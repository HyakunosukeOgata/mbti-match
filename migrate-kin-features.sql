-- ============================
-- Mochi 默契 — Schema Migration: Kin Features Integration
-- Features: audit logs, enhanced matching, report escalation, recommendation reasons
-- 執行方式：在 Supabase Dashboard → SQL Editor 貼上並執行
-- ============================

-- ============================
-- 1. AUDIT_LOGS — 操作紀錄（from Kin）
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

-- RLS: only service role can read/write (server-side only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================
-- 2. MATCHES — 新增推薦理由和配對分數明細欄位
-- ============================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS recommendation_reasons JSONB;
  -- { reasons: string[], caution: string | null }

ALTER TABLE matches ADD COLUMN IF NOT EXISTS scoring_breakdown JSONB;
  -- { valueFit, traitFit, communicationFit, relationshipGoalFit, preferenceFit }

ALTER TABLE matches ADD COLUMN IF NOT EXISTS matched_signals TEXT[] DEFAULT '{}';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS caution_signals TEXT[] DEFAULT '{}';

-- ============================
-- 3. DAILY_CARDS — 新增推薦理由和配對訊號欄位
-- ============================
ALTER TABLE daily_cards ADD COLUMN IF NOT EXISTS recommendation_reasons JSONB;
ALTER TABLE daily_cards ADD COLUMN IF NOT EXISTS matched_signals TEXT[] DEFAULT '{}';
ALTER TABLE daily_cards ADD COLUMN IF NOT EXISTS caution_signals TEXT[] DEFAULT '{}';
ALTER TABLE daily_cards ADD COLUMN IF NOT EXISTS scoring_breakdown JSONB;

-- ============================
-- 4. REPORTS — 新增 'escalated' 狀態
-- ============================
-- Note: need to drop and recreate the check constraint to add 'escalated'
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('pending', 'reviewed', 'dismissed', 'escalated'));

-- ============================
-- 5. NOTIFICATIONS — 新增 'profile_view' 類型
--    (already supported if not constrained, but update check)
-- ============================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('match', 'message', 'like', 'weekly', 'system', 'profile_view'));

-- ============================
-- 6. CONVERSATION_STARTERS — AI 生成的開場白（from Kin）
-- ============================
CREATE TABLE IF NOT EXISTS conversation_starters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starters TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_starters_match ON conversation_starters(match_id);

ALTER TABLE conversation_starters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_starters_select_involved" ON conversation_starters
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches
      WHERE user1_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
         OR user2_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );
