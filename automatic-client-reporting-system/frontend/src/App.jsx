import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import FileUpload from './components/FileUpload'
import ReportHistory from './components/ReportHistory'
import LoginPage from './components/LoginPage'
import { LogOut, Users, FolderOpen, UserCircle, Settings } from 'lucide-react'

function App() {
  const { session, userProfile, loading, signInWithGitHub, signOut, isAdmin } = useAuth()
  const { projects, loading: projectsLoading, fetchProjects } = useProjects()
  const [selectedProject, setSelectedProject] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Client Reporting System
                </h1>
                <p className="text-xs text-gray-500">Your Personal AI Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.full_name || session.user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Client'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <UserCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
              {projectsLoading ? (
                <div className="loading-spinner mx-auto"></div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedProject?.id === project.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <FileUpload 
              selectedProject={selectedProject}
              onUploadComplete={() => {}}
            />
            <ReportHistory selectedProject={selectedProject} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App