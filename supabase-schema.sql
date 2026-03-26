-- ============================
-- Mochi 默契 — Supabase Database Schema
-- 執行方式：在 Supabase Dashboard → SQL Editor 貼上並執行
-- ============================

-- ============================
-- 1. USERS — 用戶資料
-- ============================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  bio TEXT DEFAULT '',
  region TEXT DEFAULT '',
  mbti_code TEXT NOT NULL DEFAULT '',            -- e.g. 'ENFP'
  mbti_profile JSONB NOT NULL DEFAULT '{}',       -- { EI: {type, strength}, SN: ... }
  scenario_answers JSONB NOT NULL DEFAULT '[]',   -- DEPRECATED: legacy scenario answers
  ai_personality JSONB,                           -- AI-generated personality analysis {bio, traits[], values[], ...}
  preferences JSONB NOT NULL DEFAULT '{}',        -- {ageMin, ageMax, genderPreference[], region, preferredRegions[]}
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  profile_visible BOOLEAN NOT NULL DEFAULT TRUE,
  hide_age BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================
-- 2. USER_PHOTOS — 用戶照片
-- ============================
CREATE TABLE IF NOT EXISTS user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_photos_user ON user_photos(user_id);

-- ============================
-- 3. LIKES — 喜歡記錄
-- ============================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT,
  topic_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_likes_from ON likes(from_user_id);
CREATE INDEX idx_likes_to ON likes(to_user_id);

-- ============================
-- 4. MATCHES — 配對
-- ============================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT,
  topic_text TEXT,
  topic_category TEXT,
  topic_answers JSONB DEFAULT '{}',  -- {userId: answer}
  compatibility INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'removed')),
  scoring_breakdown JSONB,
  matched_signals TEXT[] DEFAULT '{}',
  caution_signals TEXT[] DEFAULT '{}',
  recommendation_reasons JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);

-- ============================
-- 5. MESSAGES — 聊天訊息
-- ============================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_match ON messages(match_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================
-- 6. DAILY_CARDS — 每日推薦卡片
-- ============================
CREATE TABLE IF NOT EXISTS daily_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  compatibility INTEGER NOT NULL DEFAULT 0,
  topic_id TEXT,
  topic_text TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  liked BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  card_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scoring_breakdown JSONB,
  matched_signals TEXT[] DEFAULT '{}',
  caution_signals TEXT[] DEFAULT '{}',
  recommendation_reasons JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id, card_date)
);

CREATE INDEX idx_daily_cards_user ON daily_cards(user_id, card_date);

-- ============================
-- 7. SKIPPED_USERS — 已跳過用戶
-- ============================
CREATE TABLE IF NOT EXISTS skipped_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skipped_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skipped_user_id)
);

-- ============================
-- 8. BLOCKED_USERS — 封鎖
-- ============================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================
-- 9. REPORTS — 檢舉
-- ============================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'escalated')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ============================
-- 10. NOTIFICATIONS — 通知
-- ============================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'weekly', 'system', 'profile_view')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ============================
-- 11. PHOTO_CONSENTS — 照片傳送同意
-- ============================
CREATE TABLE IF NOT EXISTS photo_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id)
);

-- ============================
-- 12. ANALYTICS_EVENTS — 分析事件
-- ============================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);

-- ============================
-- 13. AUDIT_LOGS — 操作紀錄（from Kin）
-- ============================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);

-- ============================
-- 14. CONVERSATION_STARTERS — AI 生成的開場白（from Kin）
-- ============================
CREATE TABLE IF NOT EXISTS conversation_starters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starters TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_starters_match ON conversation_starters(match_id);

-- ============================
-- RLS POLICIES
-- ============================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE skipped_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users: 可看到可見用戶，只能改自己
CREATE POLICY "users_select_visible" ON users
  FOR SELECT USING (profile_visible = TRUE OR auth_id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Photos: 可看到所有照片，只能管自己的
CREATE POLICY "photos_select" ON user_photos
  FOR SELECT USING (TRUE);

CREATE POLICY "photos_insert_own" ON user_photos
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "photos_delete_own" ON user_photos
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Likes: 只看自己的
CREATE POLICY "likes_select_own" ON likes
  FOR SELECT USING (
    from_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR to_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "likes_insert_own" ON likes
  FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Matches: 只參與者可見
CREATE POLICY "matches_select_involved" ON matches
  FOR SELECT USING (
    user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "matches_update_involved" ON matches
  FOR UPDATE USING (
    user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Messages: 只在所屬配對中可見
CREATE POLICY "messages_select_in_match" ON messages
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches
      WHERE user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
         OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_in_match" ON messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND match_id IN (
      SELECT id FROM matches
      WHERE user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
         OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Daily cards: 只看自己的
CREATE POLICY "daily_cards_select_own" ON daily_cards
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Skipped: 只看自己的
CREATE POLICY "skipped_select_own" ON skipped_users
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "skipped_insert_own" ON skipped_users
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Blocked: 只看自己的
CREATE POLICY "blocked_select_own" ON blocked_users
  FOR SELECT USING (
    blocker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "blocked_insert_own" ON blocked_users
  FOR INSERT WITH CHECK (
    blocker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "blocked_delete_own" ON blocked_users
  FOR DELETE USING (
    blocker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Reports: 只能新增，不能看（管理員用 service role）
CREATE POLICY "reports_insert_own" ON reports
  FOR INSERT WITH CHECK (
    reporter_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Notifications: 只看自己的
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Photo consents: 配對參與者可見
CREATE POLICY "photo_consents_select" ON photo_consents
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches
      WHERE user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
         OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "photo_consents_insert" ON photo_consents
  FOR INSERT WITH CHECK (
    requester_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "photo_consents_update" ON photo_consents
  FOR UPDATE USING (
    match_id IN (
      SELECT id FROM matches
      WHERE user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
         OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Analytics: 只能寫入（管理員用 service role 讀取）
CREATE POLICY "analytics_insert" ON analytics_events
  FOR INSERT WITH CHECK (TRUE);

-- Audit logs: server-side only (service role)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Conversation starters: 配對參與者可見
ALTER TABLE conversation_starters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_starters_select_involved" ON conversation_starters
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches
      WHERE user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
         OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ============================
-- STORAGE BUCKET — 用戶照片
-- ============================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 任何登入用戶可上傳到自己的資料夾
CREATE POLICY "photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 可刪除自己的照片
CREATE POLICY "photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 所有人可讀取照片（public bucket）
CREATE POLICY "photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-photos');

-- ============================
-- REALTIME — 啟用即時訊息
-- ============================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
