import Papa from 'papaparse';
import * as XLSX from 'xlsx';
// Note: pdf-parse requires Node.js fs module which isn't available in browsers
// We'll use a different approach for PDF parsing in the browser
// Note: mammoth.js might have browser compatibility issues
// We'll use a simplified approach for DOCX parsing in the browser

/**
 * Utility functions for parsing different file formats
 */

/**
 * Parse CSV file content
 * @param {File} file - The CSV file
 * @returns {Promise<Object>} - Parsed data and text content
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Convert to plain text for AI processing
        let textContent = '';
        
        // Add headers
        if (results.meta && results.meta.fields) {
          textContent += results.meta.fields.join(', ') + '\n';
        }
        
        // Add rows
        results.data.forEach(row => {
          const values = Object.values(row).join(', ');
          textContent += values + '\n';
        });
        
        resolve({
          data: results.data,
          meta: results.meta,
          textContent
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Parse Excel file content
 * @param {File} file - The Excel file
 * @returns {Promise<Object>} - Parsed data and text content
 */
export const parseExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Convert to text for AI processing
        let textContent = '';
        
        // Add headers if available
        if (jsonData.length > 0) {
          textContent += Object.keys(jsonData[0]).join(', ') + '\n';
        }
        
        // Add rows
        jsonData.forEach(row => {
          const values = Object.values(row).join(', ');
          textContent += values + '\n';
        });
        
        resolve({
          data: jsonData,
          sheetNames: workbook.SheetNames,
          textContent
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse PDF file content
 * @param {File} file - The PDF file
 * @returns {Promise<Object>} - Parsed text content
 */
export const parsePDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // In a browser environment, we can't use pdf-parse directly
        // Instead, we'll return basic file info and a placeholder message
        // In a real app, you would use a PDF.js or a server-side approach
        
        resolve({
          text: `PDF content from ${file.name}. PDF parsing in browser requires PDF.js library.`,
          info: { filename: file.name, filesize: file.size },
          metadata: { type: 'pdf' },
          textContent: `PDF content from ${file.name}. This is a placeholder for actual PDF content.\n\n` +
                      `In a production environment, you would use PDF.js library or a server-side API to extract text.\n\n` +
                      `File details:\n` +
                      `- Name: ${file.name}\n` +
                      `- Size: ${(file.size / 1024).toFixed(1)} KB\n` +
                      `- Type: ${file.type}`
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse DOCX file content
 * @param {File} file - The DOCX file
 * @returns {Promise<Object>} - Parsed text content
 */
export const parseDOCX = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // In a browser environment without server-side processing,
        // we'll return basic file info and a placeholder message
        
        resolve({
          text: `DOCX content from ${file.name}. DOCX parsing in browser requires specialized libraries.`,
          textContent: `DOCX content from ${file.name}. This is a placeholder for actual DOCX content.\n\n` +
                      `In a production environment, you would use a server-side API to extract text.\n\n` +
                      `File details:\n` +
                      `- Name: ${file.name}\n` +
                      `- Size: ${(file.size / 1024).toFixed(1)} KB\n` +
                      `- Type: ${file.type}`,
          messages: []
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse file based on its type
 * @param {File} file - The file to parse
 * @returns {Promise<Object>} - Parsed content
 */
export const parseFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    // CSV files
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return await parseCSV(file);
    }
    
    // Excel files
    if (fileType === 'application/vnd.ms-excel' || 
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return await parseExcel(file);
    }
    
    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    }
    
    // DOCX files
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')) {
      return await parseDOCX(file);
    }
    
    // Text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const text = await file.text();
      return {
        text,
        textContent: text
      };
    }
    
    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
};

/**
 * Extract structured data from parsed content
 * @param {Object} parsedContent - The parsed file content
 * @param {string} fileType - The file type
 * @returns {Object} - Structured data
 */
export const extractStructuredData = (parsedContent, fileType) => {
  // For CSV and Excel, we already have structured data
  if (fileType === 'csv' || fileType === 'excel') {
    return parsedContent.data;
  }
  
  // For text-based files, we need to do some basic extraction
  // This is a simple implementation - in a real app, you might use more sophisticated NLP
  const text = parsedContent.textContent || parsedContent.text || '';
  
  // Extract potential metrics (numbers with % or currency symbols)
  const metrics = [];
  const metricRegex = /\$?\d+([.,]\d+)?%?/g;
  let match;
  while ((match = metricRegex.exec(text)) !== null) {
    metrics.push(match[0]);
  }
  
  // Extract potential dates
  const dates = [];
  const dateRegex = /(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{2,4}[/\-]\d{1,2}[/\-]\d{1,2})/g;
  while ((match = dateRegex.exec(text)) !== null) {
    dates.push(match[0]);
  }
  
  return {
    metrics: metrics.slice(0, 10), // Limit to first 10 matches
    dates: dates.slice(0, 10),
    text: text.substring(0, 1000) // First 1000 chars for preview
  };
};