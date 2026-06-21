-- ============================================================
-- FIX: Make the 'review' storage bucket publicly accessible
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Mark the 'review' bucket as public so /public/ URLs work
UPDATE storage.buckets
SET public = true
WHERE id = 'review';

-- Verify the change
SELECT id, name, public FROM storage.buckets WHERE id = 'review';
