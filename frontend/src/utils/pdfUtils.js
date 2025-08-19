import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePdf = async (elementId, filename) => {
  try {
    console.log('Starting PDF generation for element:', elementId);
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    // Create a clone of the element
    const elementClone = element.cloneNode(true);
    elementClone.style.visibility = 'visible';
    elementClone.style.position = 'absolute';
    elementClone.style.left = '-9999px';
    elementClone.style.width = '210mm';
    document.body.appendChild(elementClone);

    // Remove the download button from the clone
    const downloadBtn = elementClone.querySelector('button');
    if (downloadBtn) {
      downloadBtn.remove();
    }

    // Generate canvas from the element
    const canvas = await html2canvas(elementClone, {
      scale: 2,
      useCORS: true,
      logging: true,
      scrollX: 0,
      scrollY: 0,
      width: elementClone.offsetWidth,
      height: elementClone.offsetHeight,
      windowWidth: elementClone.scrollWidth,
      windowHeight: elementClone.scrollHeight
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Save the PDF
    pdf.save(filename);
    
    // Clean up
    document.body.removeChild(elementClone);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
