import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  LogOut, 
  Upload, 
  FileText, 
  Brain, 
  Users, 
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  FolderOpen,
  File,
  Trash2,
  Edit3,
  BarChart2
} from 'lucide-react'
import { setupDatabase } from '../utils/setupDatabase'
import { generateReportPDF } from '../utils/pdfGenerator'
import FileUpload from './FileUpload'
import FileAnalysisResults from './FileAnalysisResults'

export default function Dashboard({ session }) {
  const [userProfile, setUserProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [reports, setReports] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [creatingProject, setCreatingProject] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [analysisData, setAnalysisData] = useState(null)
  const [showAnalysisResults, setShowAnalysisResults] = useState(false)

  useEffect(() => {
    setupDatabase()
    fetchUserProfile()
    fetchProjects()
    fetchReports()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Create profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: 'client'
          })
          .select()
          .single()
        
        if (!createError) setUserProfile(newProfile)
      } else if (!error) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    }
  }

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Reports query error:', error)
        setReports([])
      } else {
        setReports(data || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleUploadComplete = (report) => {
    // Refresh reports and files when upload completes
    fetchReports()
    fetchFiles(selectedProject?.id)
  }
  
  const handleAnalysisComplete = (data) => {
    setAnalysisData(data)
    setShowAnalysisResults(true)
  }
  
  const handleCloseAnalysis = () => {
    setShowAnalysisResults(false)
    setAnalysisData(null)
  }

  const createProject = async (projectData) => {
    setCreatingProject(true)
    try {
      // Fix: Get user directly from session instead of auth.getUser()
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          created_by: userId
        })
        .select()
        .single()
      
      if (error) throw error
      
      setProjects([data, ...projects])
      setSelectedProject(data)
      setShowCreateProject(false)
      setProjectForm({ name: '', description: '' })
      
      return data
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project: ' + error.message)
    } finally {
      setCreatingProject(false)
    }
  }

  const fetchFiles = async (projectId = null) => {
    try {
      let query = supabase
        .from('files')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Files query error:', error)
        setFiles([])
      } else {
        setFiles(data || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setFiles([])
    }
  }

  const deleteFile = async (fileId, filePath) => {
    try {
      // Delete from storage
      await supabase.storage.from('client-files').remove([filePath])
      
      // Delete from database
      await supabase.from('files').delete().eq('id', fileId)
      
      // Refresh files list
      fetchFiles(selectedProject?.id)
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header with gradient */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Client Reporting System
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Document Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.full_name || session.user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userProfile?.role || 'Client'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-2 bg-white/60 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/20">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
              { id: 'projects', label: 'Projects', icon: FolderOpen, color: 'from-purple-500 to-pink-500' },
              { id: 'upload', label: 'Upload', icon: Upload, color: 'from-green-500 to-emerald-500' },
              { id: 'reports', label: 'Reports', icon: Brain, color: 'from-orange-500 to-red-500' },
              { id: 'analyze', label: 'Analyze', icon: BarChart2, color: 'from-purple-500 to-pink-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Enhanced Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Total Projects', value: projects.length, icon: FolderOpen, color: 'from-blue-500 to-cyan-500' },
                { title: 'Files Uploaded', value: files.length, icon: FileText, color: 'from-purple-500 to-pink-500' },
                { title: 'Reports Generated', value: reports.length, icon: Brain, color: 'from-green-500 to-emerald-500' },
              ].map((stat, index) => (
                <div
                  key={stat.title}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {reports.slice(0, 5).map((report, index) => (
                  <div
                    key={report.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{report.title}</p>
                      <p className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  My Projects
                </h2>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Project</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Create Project Form */}
              {showCreateProject && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 animate-slideDown">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    if (projectForm.name.trim()) {
                      createProject(projectForm)
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                        placeholder="Enter project name"
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                        placeholder="Enter project description (optional)"
                        rows="3"
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={creatingProject || !projectForm.name.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105 transition-all duration-200"
                      >
                        {creatingProject ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>Create Project</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateProject(false)
                          setProjectForm({ name: '', description: '' })
                        }}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Projects Grid */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No projects found' : 'No Projects Yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to start uploading files and generating reports.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowCreateProject(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 inline-flex items-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Your First Project</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="group bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 animate-fadeInUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => {
                        setSelectedProject(project)
                        setActiveTab('upload')
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-200">
                          <FolderOpen className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-blue-600 transition-colors duration-200">
                        {project.name}
                      </h3>
                      
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                      )}
                      
                      {/* Project Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <File className="h-4 w-4" />
                            <span>{files.filter(f => f.project_id === project.id).length} files</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Brain className="h-4 w-4" />
                            <span>{reports.filter(r => r.project_id === project.id).length} reports</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick Upload Button */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                          Click to upload files
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProject(project)
                              setActiveTab('upload')
                            }}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add edit functionality
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
                Upload Files & Generate Reports
              </h2>
              
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Available</h3>
                  <p className="text-gray-600 mb-6">You need to create a project first before uploading files.</p>
                  <button 
                    onClick={() => setActiveTab('projects')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 inline-flex items-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Project</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Project Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                      <FolderOpen className="h-5 w-5" />
                      <span>Selected Project</span>
                    </h3>
                    {selectedProject ? (
                      <div className="flex items-center justify-between bg-white rounded-xl p-4">
                        <div>
                          <p className="font-semibold text-blue-800">{selectedProject.name}</p>
                          {selectedProject.description && (
                            <p className="text-sm text-blue-600">{selectedProject.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab('projects')}
                          className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
                        >
                          Change Project
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-blue-800 mb-4">Choose a project to upload files:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {projects.map(project => (
                            <button
                              key={project.id}
                              onClick={() => setSelectedProject(project)}
                              className="text-left p-4 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                            >
                              <p className="font-semibold text-gray-900">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-gray-600">{project.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <FileUpload 
                    selectedProject={selectedProject}
                    onUploadComplete={handleUploadComplete}
                  />

                  {/* Files List for Selected Project */}
                  {selectedProject && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <File className="h-5 w-5" />
                        <span>Uploaded Files</span>
                      </h3>
                      {files.filter(f => f.project_id === selectedProject.id).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No files uploaded yet</p>
                      ) : (
                        <div className="space-y-2">
                          {files.filter(f => f.project_id === selectedProject.id).map((file, index) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 animate-fadeInUp"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{file.file_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteFile(file.id, file.file_path)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
                Analyze Files
              </h2>
              
              {showAnalysisResults ? (
                <div className="space-y-4">
                  <button
                    onClick={handleCloseAnalysis}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Back to Upload</span>
                  </button>
                  
                  <FileAnalysisResults 
                    analysisData={analysisData} 
                    onClose={handleCloseAnalysis} 
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Project Selection */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                      <FolderOpen className="h-5 w-5" />
                      <span>Selected Project</span>
                    </h3>
                    {selectedProject ? (
                      <div className="flex items-center justify-between bg-white rounded-xl p-4">
                        <div>
                          <p className="font-semibold text-purple-800">{selectedProject.name}</p>
                          {selectedProject.description && (
                            <p className="text-sm text-purple-600">{selectedProject.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab('projects')}
                          className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm font-medium"
                        >
                          Change Project
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-purple-800 mb-4">Choose a project to analyze files:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {projects.map(project => (
                            <button
                              key={project.id}
                              onClick={() => setSelectedProject(project)}
                              className="text-left p-4 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
                            >
                              <p className="font-semibold text-gray-900">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-gray-600">{project.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <FileUpload 
                    selectedProject={selectedProject}
                    onUploadComplete={handleUploadComplete}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Generated Reports
                </h2>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} total
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                  <p className="text-gray-600 mb-6">Upload files to automatically generate AI-powered reports.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-red-600 inline-flex items-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Files</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report, index) => (
                    <div
                      key={report.id}
                      className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-fadeInUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{report.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => generateReportPDF(report)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title="Download PDF Report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50/50 rounded-xl p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {report.summary}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





















