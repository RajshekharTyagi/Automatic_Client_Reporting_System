import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setError(error.message)
      }
      setSession(session)
      if (session) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setError(null)
        
        if (session) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: session?.user?.user_metadata?.full_name || session?.user?.email || 'Unknown User',
              role: 'client'
            })
            .select()
            .single()
          
          if (createError) throw createError
          setUserProfile(newProfile)
        } else {
          throw error
        }
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGitHub = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      setError(error.message)
      throw error
    }
  }

  return {
    session,
    userProfile,
    loading,
    error,
    signInWithGitHub,
    signOut,
    isAdmin: userProfile?.role === 'admin',
    isClient: userProfile?.role === 'client',
    isIntern: userProfile?.role === 'intern',
    refetchProfile: () => session && fetchUserProfile(session.user.id)
  }
}