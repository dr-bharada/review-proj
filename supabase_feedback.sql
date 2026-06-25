-- ============================================================
-- MIGRATION: Create private_feedbacks table and policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the private feedbacks table
CREATE TABLE IF NOT EXISTS public.private_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index on business_id for performance
CREATE INDEX IF NOT EXISTS idx_private_feedbacks_business ON public.private_feedbacks(business_id);

-- 3. Enable Row-Level Security
ALTER TABLE public.private_feedbacks ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow public / anonymous users to insert private feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'private_feedbacks' 
      AND policyname = 'Allow public insert to private feedback'
  ) THEN
    CREATE POLICY "Allow public insert to private feedback"
      ON public.private_feedbacks FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Policy: Allow only authenticated owners to read their business's feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'private_feedbacks' 
      AND policyname = 'Allow owners read access to their private feedback'
  ) THEN
    CREATE POLICY "Allow owners read access to their private feedback"
      ON public.private_feedbacks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.businesses
          WHERE public.businesses.id = private_feedbacks.business_id
            AND public.businesses.owner_id = auth.uid()
        )
      );
  END IF;
END $$;
