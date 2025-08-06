-- Manual SQL script to fix reports table schema issues
-- Run this in your Supabase SQL Editor (https://app.supabase.com -> Your Project -> SQL Editor)

-- Step 1: Ensure all required columns exist in reports table
-- Add missing title column
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title TEXT;

-- Ensure content column exists (it should from 005_reports.sql)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content TEXT;

-- Ensure file_id column exists and has proper foreign key
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES public.files(id) ON DELETE CASCADE;

-- Step 2: Update existing reports with default values
UPDATE public.reports 
SET title = COALESCE(title, 'Report for ' || id::text),
    content = COALESCE(content, summary),
    status = COALESCE(status, 'completed')
WHERE title IS NULL OR content IS NULL OR status IS NULL;

-- Step 3: Ensure reports table has proper indexes
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_file_id ON public.reports(file_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON public.reports(generated_by);

-- Step 4: Refresh the schema cache (run this if you still get column errors)
-- This helps Supabase recognize the new columns
SELECT pg_catalog.pg_stat_reset();

-- Step 5: Verify the table structure
-- Run this to check if all columns are present
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reports'
ORDER BY ordinal_position;

-- Step 6: Test insert (optional - run this to verify everything works)
-- This is just a test, you can delete it after verification
-- INSERT INTO public.reports (title, content, summary, project_id, file_id, generated_by, status) 
-- VALUES ('Test Report', 'Test content', 'Test summary', '00000000-0000-0000-0000-000000000000', NULL, '00000000-0000-0000-0000-000000000000', 'completed')
-- ON CONFLICT DO NOTHING;