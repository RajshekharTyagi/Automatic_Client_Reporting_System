import { supabase } from '../lib/supabase'

export const setupDatabase = async () => {
  try {
    // Check if profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (profilesError && profilesError.code === '42P01') {
      console.log('Profiles table does not exist')
    }

    // Check if projects table exists  
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1)

    if (projectsError && projectsError.code === '42P01') {
      console.log('Projects table does not exist')
    }

    // Check if reports table exists
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('count')
      .limit(1)

    if (reportsError && reportsError.code === '42P01') {
      console.log('Reports table does not exist')
    }

    console.log('Database check complete')
  } catch (error) {
    console.error('Database setup error:', error)
  }
}