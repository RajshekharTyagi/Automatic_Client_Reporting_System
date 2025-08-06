import React from 'react'
import { LogOut, User, FileText, Settings, Shield, UserCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }) {
  const { userProfile, signOut, isAdmin } = useAuth()

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'client':
        return <User className="h-4 w-4 text-blue-600" />
      case 'intern':
        return <UserCheck className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'client':
        return 'bg-blue-100 text-blue-800'
      case 'intern':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Client Reporting System
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(userProfile?.role)}
                  <span className="text-sm text-gray-700">
                    {userProfile?.full_name || 'User'}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userProfile?.role)}`}>
                  {userProfile?.role}
                </span>
              </div>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 Automatic Client Reporting System. Built with React & Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}