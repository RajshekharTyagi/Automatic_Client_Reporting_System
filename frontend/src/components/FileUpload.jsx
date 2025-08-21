import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function FileUpload({ selectedProject, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [progress, setProgress] = useState('')

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'text/plain', 
      'text/csv', 
      'application/csv',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const allowedExtensions = ['.txt', '.csv', '.pdf', '.xls', '.xlsx']
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }
    
    const hasValidType = allowedTypes.includes(file.type) || 
                        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!hasValidType) {
      throw new Error('Only .txt, .csv, .pdf, .xls, and .xlsx files are supported')
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
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')
      
      // Upload file to Supabase Storage
      setProgress('Uploading file...')
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${user.id}/${selectedProject.id}/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-files')
        .getPublicUrl(filePath)

      // Save file record to database
      setProgress('Saving file record...')
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: selectedProject.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (fileError) throw fileError

      // Generate content based on file type
      setProgress('Processing file content...')
      let content = ''
      
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        content = await file.text()
      } else if (file.type === 'application/pdf') {
        content = `PDF file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      } else {
        content = `File: ${file.name} (${file.type}) - ${(file.size / 1024).toFixed(1)} KB`
      }
      
      if (!content.trim()) {
        content = `Uploaded file: ${file.name}`
      }

      setProgress('Generating report...')
      // Create a basic report
      const summary = `File Analysis Report

File Name: ${file.name}
File Type: ${file.type}
File Size: ${(file.size / 1024).toFixed(1)} KB
Upload Date: ${new Date().toLocaleString()}
Project: ${selectedProject.name}

Content Preview:
${content.substring(0, 500)}${content.length > 500 ? '...' : ''}

This file has been successfully uploaded and is ready for analysis.`

      // Save report to database
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          title: `Report for ${file.name}`,
          content: content.substring(0, 5000),
          summary: summary,
          project_id: selectedProject.id,
          file_id: fileRecord.id,
          generated_by: user.id,
          status: 'completed'
        })
        .select()
        .single()

      if (reportError) throw reportError

      setUploadStatus({ 
        type: 'success', 
        message: 'File uploaded and report generated successfully!' 
      })
      
      onUploadComplete?.(report)
      
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
    <div className="space-y-6 animate-fadeIn">
      {!selectedProject && (
        <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl animate-slideDown">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <span className="text-sm text-yellow-800 font-medium">Please select a project first</span>
        </div>
      )}

      {uploadStatus && (
        <div className={`flex items-center justify-between p-4 rounded-xl animate-slideDown ${
          uploadStatus.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 animate-bounce-slow" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
            )}
            <span className={`text-sm font-medium ${
              uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {uploadStatus.message}
            </span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/50 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`upload-area border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragOver
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-xl'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
        } ${!selectedProject ? 'opacity-50 pointer-events-none' : 'hover-lift'}`}
      >
        {uploading ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="relative">
              <div className="loading-spinner h-12 w-12 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium animate-pulse">{progress}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full animate-pulse transition-all duration-500" style={{ width: '60%' }}></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <div className="relative group">
              <Upload className="h-16 w-16 text-gray-400 mx-auto group-hover:text-blue-500 transition-colors duration-300 transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Drop your files here
              </p>
              <p className="text-sm text-gray-600">
                or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold underline decoration-2 underline-offset-2 hover:decoration-blue-700 transition-all duration-200">
                  browse to upload
                  <input
                    type="file"
                    accept=".txt,.csv,.pdf,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={!selectedProject || uploading}
                  />
                </label>
              </p>
            </div>
            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
              <p className="font-medium">📄 Supports: .txt, .csv, .pdf, .xls, .xlsx files</p>
              <p className="font-medium">📏 Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 animate-fadeInUp">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2 text-blue-900">🚀 How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
              <li>Select a project from the dropdown above</li>
              <li>Upload your file (.txt, .csv, .pdf, etc.)</li>
              <li>AI automatically analyzes and generates insights</li>
              <li>View detailed reports in the Reports tab</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}





