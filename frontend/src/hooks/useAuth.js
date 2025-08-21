import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGitHub = async () => {
    try {
      // Get the current URL for redirect
      // Use absolute URL to ensure it works in all environments
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('Redirecting to:', redirectUrl)
      
      // Force the redirect URL to use the current origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      setError(error.message)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      setError(error.message)
    }
  }

  useEffect(() => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

  const isAdmin = userProfile?.role === 'admin'

  return {
    session,
    userProfile,
    loading,
    error,
    signInWithGitHub,
    signOut,
    isAdmin
  }
}