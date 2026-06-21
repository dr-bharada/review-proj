-- ============================================================
-- MIGRATION: Rename review_links.is_active → is_enabled
-- Run this in your Supabase SQL Editor if you get the error:
--   "column review_links.is_active does not exist"
-- ============================================================

-- 1. Rename the column (only run if the column is currently named is_active)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'review_links'
      AND column_name  = 'is_active'
  ) THEN
    ALTER TABLE public.review_links RENAME COLUMN is_active TO is_enabled;
    RAISE NOTICE 'Column renamed: is_active → is_enabled';
  ELSE
    RAISE NOTICE 'Column is_active does not exist — no rename needed (is_enabled already exists)';
  END IF;
END $$;

-- 2. Drop the old "public read of active links" RLS policy (it may reference is_active)
DROP POLICY IF EXISTS "Allow public read access to active review links" ON public.review_links;

-- 3. Re-create it using the correct column name
CREATE POLICY "Allow public read access to active review links"
  ON public.review_links FOR SELECT
  USING (is_enabled = true);
