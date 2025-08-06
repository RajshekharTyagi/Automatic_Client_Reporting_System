-- Fix reports table schema issues
-- Ensure all required columns exist and fix schema cache issues

-- Add missing title column
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title TEXT;

-- Ensure content column exists
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content TEXT;

-- Ensure file_id column exists (it should already be there from 005_reports.sql)
-- But we'll add it just in case
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES public.files(id) ON DELETE CASCADE;

-- Update existing reports with default values
UPDATE public.reports 
SET title = COALESCE(title, 'Report for ' || id::text),
    content = COALESCE(content, summary)
WHERE title IS NULL OR content IS NULL;

-- Update existing reports with default content if missing
UPDATE public.reports 
SET content = COALESCE(content, summary), 
    title = COALESCE(title, 'Report for ' || id::text)
WHERE content IS NULL OR title IS NULL;

-- Ensure reports table has all required columns
-- Add missing columns that might be expected by the frontend
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'file_id'
    ) THEN
        ALTER TABLE public.reports ADD COLUMN file_id UUID REFERENCES public.files(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Refresh the schema cache
SELECT pg_catalog.pg_stat_reset();