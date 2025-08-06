import React, { useState } from 'react'
import { Plus, FolderOpen, Edit2, Trash2, X } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'

export default function ProjectSelector({ selectedProject, onProjectChange }) {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { isAdmin } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData)
        setEditingProject(null)
      } else {
        const newProject = await createProject(formData)
        onProjectChange(newProject)
        setShowCreateForm(false)
      }
      setFormData({ name: '', description: '' })
    } catch (error) {
      alert(`Failed to ${editingProject ? 'update' : 'create'} project: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({ name: project.name, description: project.description || '' })
    setShowCreateForm(false)
  }

  const handleDelete = async (project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will also delete all associated files and reports.`)) {
      return
    }

    try {
      await deleteProject(project.id)
      if (selectedProject?.id === project.id) {
        onProjectChange(null)
      }
    } catch (error) {
      alert(`Failed to delete project: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setShowCreateForm(false)
    setEditingProject(null)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Project</h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-secondary flex items-center space-x-1"
            disabled={editingProject}
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {(showCreateForm || editingProject) && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg animate-slide-up">
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description (optional)"
                className="input-field resize-none"
                rows="2"
              />
            </div>
            <div className="flex space-x-2">
              <button 
                type="submit" 
                disabled={submitting || !formData.name.trim()} 
                className="btn-primary flex-1"
              >
                {submitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>{editingProject ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  editingProject ? 'Update Project' : 'Create Project'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
              selectedProject?.id === project.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div 
              onClick={() => onProjectChange(project)}
              className="flex items-start justify-between"
            >
              <div className="flex items-start space-x-2 flex-1">
                <FolderOpen className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(project)
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit project"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(project)
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-lg font-medium">No projects found</p>
          {isAdmin ? (
            <p className="text-sm">Create your first project to get started</p>
          ) : (
            <p className="text-sm">Contact an admin to create projects</p>
          )}
        </div>
      )}
    </div>
  )
}