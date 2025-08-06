-- Add content column to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content TEXT;

-- Update the index to include content column for better search performance
CREATE INDEX IF NOT EXISTS idx_reports_content ON public.reports USING gin(to_tsvector('english', content));