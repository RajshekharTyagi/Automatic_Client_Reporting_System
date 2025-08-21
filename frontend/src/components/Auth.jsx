import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Github, AlertCircle, FileText, Brain, Shield, Zap } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGithubLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the auth callback route for redirect
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
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              AI-Powered
              <span className="block text-blue-200">Client Reporting</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Transform your documents into intelligent insights with our automated reporting system
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Smart File Processing</h3>
                <p className="text-blue-100">Upload and process documents instantly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">AI Summarization</h3>
                <p className="text-blue-100">Get intelligent summaries powered by GPT</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Reliable</h3>
                <p className="text-blue-100">Enterprise-grade security for your data</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-300/20 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your intelligent reporting dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>{loading ? 'Signing in...' : 'Continue with GitHub'}</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Secure authentication powered by GitHub OAuth
            </p>
          </div>

          {/* Features Preview */}
          <div className="mt-12 lg:hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">Smart document processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700">AI-powered summaries</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">Enterprise security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
