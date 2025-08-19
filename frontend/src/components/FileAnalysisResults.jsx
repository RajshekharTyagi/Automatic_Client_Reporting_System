import React, { useState } from 'react';
import { Download, FileText, TrendingUp, Lightbulb, HelpCircle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateReportPDF } from '../utils/pdfGenerator';

/**
 * Component to display file analysis results
 */
export default function FileAnalysisResults({ analysisData, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  
  // Generate chart data from metrics if available
  const getChartData = () => {
    // Check if metrics exist in the new format (array of objects)
    if (Array.isArray(analysisData?.insights?.metrics)) {
      // Use numeric metrics for the chart
      const numericMetrics = analysisData.insights.metrics
        .filter(metric => metric.type === 'number' || metric.type === 'percentage' || metric.type === 'currency')
        .slice(0, 5);
      
      if (numericMetrics.length > 0) {
        return numericMetrics.map(metric => {
          // Extract numeric value from the metric
          const rawValue = metric.value.toString();
          const value = parseFloat(rawValue.replace(/[^0-9.-]+/g, ''));
          
          return {
            name: metric.context.substring(0, 15) || `Metric`,
            value: isNaN(value) ? 0 : value,
          };
        });
      }
    }
    
    // Check if metrics exist in the old format (structuredData.metrics array)
    if (analysisData?.structuredData?.metrics && analysisData.structuredData.metrics.length > 0) {
      // Convert metrics to chart data
      return analysisData.structuredData.metrics.slice(0, 5).map((metric, index) => {
        // Remove any non-numeric characters for the value
        const value = parseFloat(metric.replace(/[^0-9.-]+/g, ''));
        return {
          name: `Metric ${index + 1}`,
          value: isNaN(value) ? 0 : value,
        };
      });
    }
    
    return [];
  };
  
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || !analysisData?.textContent) return;
    
    setAskingQuestion(true);
    setAnswer(null);
    
    try {
      // Import the answerQuestion function dynamically to avoid circular dependencies
      const { answerQuestion } = await import('../utils/huggingFaceApi');
      
      const result = await answerQuestion(
        analysisData.textContent,
        question
      );
      
      setAnswer(result);
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer({
        error: true,
        message: error.message || 'Failed to get an answer. Please try again.'
      });
    } finally {
      setAskingQuestion(false);
    }
  };
  
  const handleDownloadPDF = () => {
    if (!analysisData) return;
    
    // Create a report object from analysis data
    const report = {
      title: `Analysis of ${analysisData.fileName}`,
      content: JSON.stringify(analysisData.insights, null, 2),
      summary: analysisData.insights?.summary || 'No summary available',
      generated_at: new Date().toISOString(),
      profiles: { full_name: 'Analysis Report' }
    };
    
    generateReportPDF(report);
  };
  
  if (!analysisData) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-fadeIn">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Analysis: {analysisData.fileName}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Download Analysis as PDF"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close Analysis"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'insights' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'actions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'qa' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('qa')}
          >
            Q&A
          </button>
        </div>
        
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2">File Summary</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {analysisData.insights?.summary || 'No summary available'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2">File Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">File Name:</div>
                <div className="text-gray-800 font-medium">{analysisData.fileName}</div>
                
                <div className="text-gray-600">File Type:</div>
                <div className="text-gray-800 font-medium">{analysisData.fileType}</div>
                
                <div className="text-gray-600">File Size:</div>
                <div className="text-gray-800 font-medium">{analysisData.fileSize}</div>
                
                <div className="text-gray-600">Analyzed On:</div>
                <div className="text-gray-800 font-medium">{new Date().toLocaleString()}</div>
              </div>
            </div>
            
            {analysisData.structuredData?.metrics && analysisData.structuredData.metrics.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-2">Key Metrics</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-1">Key Metrics & KPIs</h3>
                  {Array.isArray(analysisData.insights?.metrics) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {analysisData.insights.metrics.map((metric, index) => (
                        <div key={index} className="bg-white p-3 rounded-md border border-blue-200 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-blue-800">{metric.value}</span>
                            <span className="text-xs uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {metric.type}
                            </span>
                          </div>
                          {metric.context && (
                            <p className="text-xs text-gray-600 italic">
                              "...{metric.context}..."
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {analysisData.insights?.metrics || 'No metrics identified'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-1">Trends & Patterns</h3>
                  {Array.isArray(analysisData.insights?.trends) ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {analysisData.insights.trends.map((trend, index) => (
                        <li key={index}>{trend}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {analysisData.insights?.trends || 'No trends identified'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-1">Recommended Actions</h3>
                  {Array.isArray(analysisData.insights?.actions) ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {analysisData.insights.actions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {analysisData.insights?.actions || 'No specific actions recommended'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'qa' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Ask a Question About This File</h3>
              <form onSubmit={handleAskQuestion} className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g., What was the revenue in Q2?"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={askingQuestion}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    disabled={askingQuestion || !question.trim()}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>{askingQuestion ? 'Asking...' : 'Ask'}</span>
                  </button>
                </div>
              </form>
              
              {answer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fadeIn">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Answer:</h4>
                  {answer.error ? (
                    <p className="text-sm text-red-600">{answer.message}</p>
                  ) : (
                    <p className="text-sm text-gray-700">{answer.answer || 'No answer found'}</p>
                  )}
                </div>
              )}
              
              <div className="mt-4 text-xs text-gray-500">
                <p>Ask questions about the content of your file. The AI will try to find answers based on the uploaded document.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}