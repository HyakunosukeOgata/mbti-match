-- ============================
-- Profile Views + Notification type update
-- ============================

-- Drop old table if exists (safe — no production data yet)
DROP TABLE IF EXISTS profile_views CASCADE;

-- 13. PROFILE_VIEWS — 誰看過我
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, viewed_user_id)
);

CREATE INDEX idx_profile_views_viewed ON profile_views(viewed_user_id, created_at DESC);
CREATE INDEX idx_profile_views_viewer ON profile_views(viewer_id);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_views
CREATE POLICY "profile_views_insert" ON profile_views
  FOR INSERT WITH CHECK (
    viewer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "profile_views_select_viewed" ON profile_views
  FOR SELECT USING (
    viewed_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "profile_views_select_viewer" ON profile_views
  FOR SELECT USING (
    viewer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Update notification type check to include 'profile_view'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('match', 'message', 'like', 'weekly', 'system', 'profile_view'));
