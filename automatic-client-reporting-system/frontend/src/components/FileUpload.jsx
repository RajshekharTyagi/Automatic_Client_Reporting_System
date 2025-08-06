import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { supabase, callEdgeFunction, uploadFile, getPublicUrl } from '../lib/supabase'

export default function FileUpload({ selectedProject, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [progress, setProgress] = useState('')

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['text/plain', 'text/csv', 'application/csv']
    const allowedExtensions = ['.txt', '.csv']
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }
    
    const hasValidType = allowedTypes.includes(file.type) || 
                        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!hasValidType) {
      throw new Error('Only .txt and .csv files are supported')
    }
  }

  const handleFileUpload = async (file) => {
    if (!selectedProject) {
      setUploadStatus({ type: 'error', message: 'Please select a project first' })
      return
    }

    setUploading(true)
    setUploadStatus(null)
    setProgress('Validating file...')

    try {
      // Validate file
      validateFile(file)
      
      // Upload file to Supabase Storage
      setProgress('Uploading file...')
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `projects/${selectedProject.id}/${fileName}`
      
      await uploadFile('client-files', filePath, file)
      
      // Get public URL
      const publicUrl = getPublicUrl('client-files', filePath)

      // Save file record to database
      setProgress('Saving file record...')
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: selectedProject.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
        })
        .select()
        .single()

      if (fileError) throw fileError

      // Read file content and generate summary
      setProgress('Reading file content...')
      const content = await file.text()
      
      if (!content.trim()) {
        throw new Error('File appears to be empty')
      }

      setProgress('Generating AI summary...')
      const summaryData = await callEdgeFunction('generate-summary', {
        content: content.substring(0, 10000), // Limit content to avoid token limits
        projectId: selectedProject.id,
        fileId: fileRecord.id,
      })

      if (!summaryData.success) {
        throw new Error(summaryData.error || 'Failed to generate summary')
      }

      setUploadStatus({ 
        type: 'success', 
        message: 'File uploaded and summary generated successfully!' 
      })
      
      onUploadComplete?.(summaryData)
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus({ 
        type: 'error', 
        message: error.message || 'Upload failed. Please try again.' 
      })
    } finally {
      setUploading(false)
      setProgress('')
      
      // Clear status after 5 seconds
      setTimeout(() => setUploadStatus(null), 5000)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleFileUpload(file)
    e.target.value = '' // Reset input
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
      
      {!selectedProject && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <span className="text-sm text-yellow-800">Please select a project first</span>
        </div>
      )}

      {uploadStatus && (
        <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
          uploadStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm ${
              uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {uploadStatus.message}
            </span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-primary-500 bg-primary-50 scale-105'
            : 'border-gray-300 hover:border-gray-400'
        } ${!selectedProject ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="loading-spinner h-8 w-8 mx-auto"></div>
            <p className="text-sm text-gray-600 font-medium">{progress}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                Drop your file here
              </p>
              <p className="text-sm text-gray-600">
                or{' '}
                <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
                  browse to upload
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={!selectedProject || uploading}
                  />
                </label>
              </p>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Supports .txt and .csv files</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Upload your .txt or .csv file</li>
              <li>AI automatically analyzes the content</li>
              <li>Get an instant summary with key insights</li>
              <li>View all reports in the history section</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}