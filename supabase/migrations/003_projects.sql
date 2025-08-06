-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view projects they created" ON public.projects
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their projects" ON public.projects
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their projects" ON public.projects
    FOR DELETE USING (auth.uid() = created_by);