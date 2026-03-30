-- Add unique constraint required by profile-photos.ts upsert
-- Safe: removes duplicate (user_id, sort_order) rows first, keeping newest

DELETE FROM user_photos a
  USING user_photos b
  WHERE a.user_id = b.user_id
    AND a.sort_order = b.sort_order
    AND a.created_at < b.created_at;

ALTER TABLE user_photos
  ADD CONSTRAINT user_photos_user_sort_unique UNIQUE (user_id, sort_order);
