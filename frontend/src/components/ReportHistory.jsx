import React, { useState, useEffect } from 'react'
import { FileText, Calendar, User, Download, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateReportPDF } from '../utils/pdfGenerator'
import toast from 'react-hot-toast'

export default function ReportHistory({ selectedProject }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (selectedProject) {
      fetchReports()
    } else {
      setReports([])
    }
  }, [selectedProject])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          files(file_name, file_size),
          profiles(full_name)
        `)
        .eq('project_id', selectedProject.id)
        .order('generated_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (report) => {
    console.log('Download button clicked for report:', report.id);
    await generateReportPDF(report);
  }

  const filteredAndSortedReports = reports
    .filter(report => 
      !searchTerm || 
      report.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.files?.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.generated_at) - new Date(b.generated_at)
        case 'filename':
          return (a.files?.file_name || '').localeCompare(b.files?.file_name || '')
        case 'newest':
        default:
          return new Date(b.generated_at) - new Date(a.generated_at)
      }
    })

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report History</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Report History</h2>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="filename">By Filename</option>
          </select>
        </div>
      </div>

      {!selectedProject ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Select a project to view reports</p>
        </div>
      ) : filteredAndSortedReports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No reports found for this project</p>
          <p className="text-sm">Upload a file to generate your first report</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedReports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {report.title || report.files?.file_name || 'Untitled Report'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{report.profiles?.full_name || 'System'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload(report);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Download PDF Report"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
              
              {report.summary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {report.summary}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


