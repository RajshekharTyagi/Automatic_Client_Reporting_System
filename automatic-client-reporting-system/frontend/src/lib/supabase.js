import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to call edge functions
export const callEdgeFunction = async (functionName, payload) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Edge function ${functionName} error:`, error)
    throw error
  }
}

// Helper function to upload file to storage
export const uploadFile = async (bucket, path, file, options = {}) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

// Helper function to get public URL
export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}