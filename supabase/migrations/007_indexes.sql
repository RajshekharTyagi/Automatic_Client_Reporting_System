-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_file_id ON public.reports(file_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON public.reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);