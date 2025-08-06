-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view files from their projects" ON public.files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = files.project_id 
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to their projects" ON public.files
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by AND
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = files.project_id 
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete files from their projects" ON public.files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = files.project_id 
            AND projects.created_by = auth.uid()
        )
    );