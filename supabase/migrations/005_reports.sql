-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    summary TEXT,
    content TEXT, -- Add the missing content column
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    generated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Users can view reports from their projects" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = reports.project_id 
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create reports for their projects" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() = generated_by AND
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = reports.project_id 
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update reports from their projects" ON public.reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = reports.project_id 
            AND projects.created_by = auth.uid()
        )
    );

