/**
 * Utility functions for printing and PDF generation in the HCBS Revenue Management System.
 * Provides standardized methods for printing HTML elements, generating PDF documents,
 * and configuring print settings for reports, claims, and other printable content.
 */

import { formatDate } from './date';
import html2canvas from 'html2canvas'; // html2canvas v1.4.1
import jsPDF from 'jspdf'; // jspdf v2.5.1

/**
 * Options for printing HTML elements
 */
export interface PrintOptions {
  title?: string;
  pageSize?: string; // 'a4', 'letter', etc.
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  header?: string;
  footer?: string;
  includePageNumbers?: boolean;
  includeDate?: boolean;
  hideElements?: string[]; // CSS selectors of elements to hide when printing
  pageBreaks?: {
    before?: string[]; // CSS selectors for elements that should have a page break before them
    after?: string[]; // CSS selectors for elements that should have a page break after them
    avoid?: string[]; // CSS selectors for elements that should avoid page breaks within them
  };
  cssOverrides?: string; // Custom CSS to apply to the print view
}

/**
 * Extended options for PDF generation
 */
export interface PDFOptions extends PrintOptions {
  filename?: string;
  compress?: boolean;
  imgQuality?: number; // 0-1, image quality
  unit?: string; // 'mm', 'cm', 'in', 'px', etc.
  format?: [number, number]; // Custom page size, if pageSize is not provided
  addLogo?: {
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  addTimestamp?: boolean;
}

/**
 * Dimensions of the printable area
 */
export interface PrintableArea {
  width: number;
  height: number;
}

/**
 * Prints a specific HTML element using the browser's print functionality
 * 
 * @param element - The HTML element to print
 * @param options - Print options for customizing the output
 * @returns Promise that resolves when printing is complete or rejects on error
 */
export const printElement = async (
  element: HTMLElement,
  options: PrintOptions = {}
): Promise<void> => {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Invalid element provided for printing');
  }

  return new Promise((resolve, reject) => {
    try {
      // Create a new iframe element
      const iframe = document.createElement('iframe');
      
      // Set the iframe style to be invisible
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      // Append the iframe to the document body
      document.body.appendChild(iframe);
      
      // Wait for the iframe to load
      iframe.onload = () => {
        try {
          // Get the iframe document
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (!iframeDoc) {
            throw new Error('Could not access iframe document');
          }
          
          // Open the document and write the HTML content
          iframeDoc.open();
          iframeDoc.write('<!DOCTYPE html><html><head><title>');
          iframeDoc.write(options.title || 'Print');
          iframeDoc.write('</title>');
          
          // Add print-specific CSS
          const printCSS = generatePrintCSS(options);
          iframeDoc.write(`<style>${printCSS}</style>`);
          
          // Add the element's content
          iframeDoc.write('</head><body>');
          iframeDoc.write(element.outerHTML);
          iframeDoc.write('</body></html>');
          iframeDoc.close();
          
          // Wait for all images to load
          const images = iframeDoc.getElementsByTagName('img');
          const imagePromises = Array.from(images).map(img => {
            return new Promise<void>(imgResolve => {
              if (img.complete) {
                imgResolve();
              } else {
                img.onload = () => imgResolve();
                img.onerror = () => imgResolve(); // Continue even if image fails to load
              }
            });
          });
          
          // When all images are loaded, print the document
          Promise.all(imagePromises).then(() => {
            // Focus the iframe
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              
              // Print the document
              setTimeout(() => {
                try {
                  iframe.contentWindow?.print();
                  
                  // Remove the iframe after printing
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                  }, 100);
                } catch (err) {
                  reject(err);
                }
              }, 500);
            } else {
              reject(new Error('Could not access iframe window'));
            }
          });
        } catch (err) {
          reject(err);
        }
      };
      
      // Handle iframe load error
      iframe.onerror = (err) => {
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Converts an HTML element to a PDF document using html2canvas and jsPDF
 * 
 * @param element - The HTML element to convert to PDF
 * @param options - PDF generation options for customizing the output
 * @returns Promise that resolves with the generated PDF as a Blob
 */
export const printElementToPDF = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<Blob> => {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Invalid element provided for PDF generation');
  }
  
  // Default options
  const pageSize = options.pageSize || 'a4';
  const orientation = options.orientation || 'portrait';
  const margins = {
    top: options.margins?.top ?? 10,
    right: options.margins?.right ?? 10,
    bottom: options.margins?.bottom ?? 10,
    left: options.margins?.left ?? 10
  };
  const unit = options.unit || 'mm';
  const compress = options.compress !== undefined ? options.compress : true;
  const imgQuality = options.imgQuality !== undefined ? options.imgQuality : 0.95;
  
  // Create a new jsPDF instance
  const pdf = new jsPDF({
    orientation,
    unit,
    format: pageSize,
    compress
  });
  
  // Calculate printable area dimensions
  const { width: pdfWidth, height: pdfHeight } = getPrintableArea(options);
  
  // Use html2canvas to convert the element to a canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher scale for better quality
    useCORS: true, // Allow loading cross-origin images
    logging: false,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });
  
  // Calculate the optimal scale to fit the content on the page
  const imgWidth = pdf.internal.pageSize.getWidth() - margins.left - margins.right;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Add the image to the PDF
  const imgData = canvas.toDataURL('image/jpeg', imgQuality);
  pdf.addImage(imgData, 'JPEG', margins.left, margins.top, imgWidth, imgHeight);
  
  // Add page breaks if needed
  if (imgHeight > pdfHeight) {
    let heightLeft = imgHeight - pdfHeight;
    let position = -pdfHeight; // For tracking the position
    
    while (heightLeft > 0) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margins.left, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  }
  
  // Add header if specified
  if (options.header) {
    addHeaderToPDF(pdf, options.header, options);
  }
  
  // Add footer if specified
  if (options.footer) {
    addFooterToPDF(pdf, options.footer, options);
  }
  
  // Add page numbers if specified
  if (options.includePageNumbers) {
    addPageNumbersToPDF(pdf, options);
  }
  
  // Return the PDF as a Blob
  return pdf.output('blob');
};

/**
 * Adds a header to each page of a PDF document
 * 
 * @param pdf - The jsPDF instance to add the header to
 * @param headerText - The text to display in the header
 * @param options - Options for customizing the header
 */
export const addHeaderToPDF = (
  pdf: jsPDF,
  headerText: string,
  options: PDFOptions = {}
): void => {
  const pageCount = pdf.internal.getNumberOfPages();
  const margins = {
    top: options.margins?.top ?? 10,
    right: options.margins?.right ?? 10,
    left: options.margins?.left ?? 10
  };
  
  // Save the current state
  pdf.saveGraphicsState();
  
  // Set font for the header
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  
  // Loop through each page
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Add logo if specified
    if (options.addLogo) {
      pdf.addImage(
        options.addLogo.src,
        'PNG',
        options.addLogo.x,
        options.addLogo.y,
        options.addLogo.width,
        options.addLogo.height
      );
    }
    
    // Add header text
    pdf.text(headerText, margins.left, margins.top - 5);
    
    // Add current date if specified
    if (options.includeDate) {
      const dateText = formatDate(new Date());
      const dateTextWidth = pdf.getTextWidth(dateText);
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.text(dateText, pageWidth - margins.right - dateTextWidth, margins.top - 5);
    }
  }
  
  // Restore the state
  pdf.restoreGraphicsState();
};

/**
 * Adds a footer to each page of a PDF document
 * 
 * @param pdf - The jsPDF instance to add the footer to
 * @param footerText - The text to display in the footer
 * @param options - Options for customizing the footer
 */
export const addFooterToPDF = (
  pdf: jsPDF,
  footerText: string,
  options: PDFOptions = {}
): void => {
  const pageCount = pdf.internal.getNumberOfPages();
  const margins = {
    right: options.margins?.right ?? 10,
    bottom: options.margins?.bottom ?? 10,
    left: options.margins?.left ?? 10
  };
  
  // Save the current state
  pdf.saveGraphicsState();
  
  // Set font for the footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  
  // Loop through each page
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add footer text
    pdf.text(footerText, margins.left, pageHeight - margins.bottom + 3);
    
    // Add timestamp if specified
    if (options.addTimestamp) {
      const timestamp = `Generated on ${formatDate(new Date())}`;
      const timestampWidth = pdf.getTextWidth(timestamp);
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.text(timestamp, pageWidth - margins.right - timestampWidth, pageHeight - margins.bottom + 3);
    }
  }
  
  // Restore the state
  pdf.restoreGraphicsState();
};

/**
 * Adds page numbers to each page of a PDF document
 * 
 * @param pdf - The jsPDF instance to add page numbers to
 * @param options - Options for customizing the page numbers
 */
export const addPageNumbersToPDF = (
  pdf: jsPDF,
  options: PDFOptions = {}
): void => {
  const pageCount = pdf.internal.getNumberOfPages();
  const margins = {
    right: options.margins?.right ?? 10,
    bottom: options.margins?.bottom ?? 10
  };
  
  // Save the current state
  pdf.saveGraphicsState();
  
  // Set font for page numbers
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  
  // Loop through each page
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Create page number text
    const pageNumberText = `Page ${i} of ${pageCount}`;
    const textWidth = pdf.getTextWidth(pageNumberText);
    
    // Position in the center of the footer
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight - margins.bottom + 3;
    
    // Add page number
    pdf.text(pageNumberText, x, y);
  }
  
  // Restore the state
  pdf.restoreGraphicsState();
};

/**
 * Prints multiple HTML elements as a single print job
 * 
 * @param elements - Array of HTML elements to print
 * @param options - Print options for customizing the output
 * @returns Promise that resolves when printing is complete
 */
export const printMultipleElements = async (
  elements: HTMLElement[],
  options: PrintOptions = {}
): Promise<void> => {
  if (!Array.isArray(elements) || elements.length === 0) {
    throw new Error('Invalid elements array provided for printing');
  }
  
  // Validate all elements
  const validElements = elements.filter(el => el instanceof HTMLElement);
  if (validElements.length === 0) {
    throw new Error('No valid HTML elements provided for printing');
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Create a new iframe element
      const iframe = document.createElement('iframe');
      
      // Set the iframe style to be invisible
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      // Append the iframe to the document body
      document.body.appendChild(iframe);
      
      // Wait for the iframe to load
      iframe.onload = () => {
        try {
          // Get the iframe document
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (!iframeDoc) {
            throw new Error('Could not access iframe document');
          }
          
          // Open the document and write the HTML content
          iframeDoc.open();
          iframeDoc.write('<!DOCTYPE html><html><head><title>');
          iframeDoc.write(options.title || 'Print');
          iframeDoc.write('</title>');
          
          // Add print-specific CSS
          const printCSS = generatePrintCSS(options);
          iframeDoc.write(`<style>${printCSS}</style>`);
          
          // Add the elements' content
          iframeDoc.write('</head><body><div class="print-container">');
          
          // Add each element with a page break if needed
          validElements.forEach((element, index) => {
            // Add page break before, except for the first element
            const pageBreakClass = index > 0 ? 'page-break-before' : '';
            iframeDoc.write(`<div class="print-item ${pageBreakClass}">${element.outerHTML}</div>`);
          });
          
          iframeDoc.write('</div></body></html>');
          iframeDoc.close();
          
          // Wait for all images to load
          const images = iframeDoc.getElementsByTagName('img');
          const imagePromises = Array.from(images).map(img => {
            return new Promise<void>(imgResolve => {
              if (img.complete) {
                imgResolve();
              } else {
                img.onload = () => imgResolve();
                img.onerror = () => imgResolve(); // Continue even if image fails to load
              }
            });
          });
          
          // When all images are loaded, print the document
          Promise.all(imagePromises).then(() => {
            // Focus the iframe
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              
              // Print the document
              setTimeout(() => {
                try {
                  iframe.contentWindow?.print();
                  
                  // Remove the iframe after printing
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                  }, 100);
                } catch (err) {
                  reject(err);
                }
              }, 500);
            } else {
              reject(new Error('Could not access iframe window'));
            }
          });
        } catch (err) {
          reject(err);
        }
      };
      
      // Handle iframe load error
      iframe.onerror = (err) => {
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates print-specific CSS to optimize content for printing
 * 
 * @param options - Options for customizing the print CSS
 * @returns CSS string with print-specific styles
 */
export const generatePrintCSS = (options: PrintOptions = {}): string => {
  const pageSize = options.pageSize || 'a4';
  const orientation = options.orientation || 'portrait';
  const margins = options.margins || { top: 10, right: 10, bottom: 10, left: 10 };
  
  // Start with base print CSS
  let css = `
    @media print {
      @page {
        size: ${pageSize} ${orientation};
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }
      
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        background-color: #fff;
      }
      
      .print-container {
        width: 100%;
      }
      
      .print-item {
        width: 100%;
        box-sizing: border-box;
      }
      
      .page-break-before {
        page-break-before: always;
      }
      
      @supports (-webkit-appearance:none) {
        html {
          -webkit-print-color-adjust: exact;
        }
      }
  `;
  
  // Add page break styles
  if (options.pageBreaks) {
    if (options.pageBreaks.before && options.pageBreaks.before.length) {
      css += `
        ${options.pageBreaks.before.join(', ')} {
          page-break-before: always;
        }
      `;
    }
    
    if (options.pageBreaks.after && options.pageBreaks.after.length) {
      css += `
        ${options.pageBreaks.after.join(', ')} {
          page-break-after: always;
        }
      `;
    }
    
    if (options.pageBreaks.avoid && options.pageBreaks.avoid.length) {
      css += `
        ${options.pageBreaks.avoid.join(', ')} {
          page-break-inside: avoid;
        }
      `;
    }
  }
  
  // Hide elements that shouldn't be printed
  if (options.hideElements && options.hideElements.length) {
    css += `
      ${options.hideElements.join(', ')} {
        display: none !important;
      }
    `;
  }
  
  // Add any custom CSS overrides
  if (options.cssOverrides) {
    css += options.cssOverrides;
  }
  
  // Close the media query
  css += `
    }
  `;
  
  return css;
};

/**
 * Calculates the printable area dimensions based on page size and margins
 * 
 * @param options - Options containing page size and margins
 * @returns Object containing width and height of printable area in pixels
 */
export const getPrintableArea = (options: PrintOptions = {}): PrintableArea => {
  const pageSize = options.pageSize || 'a4';
  const orientation = options.orientation || 'portrait';
  const margins = options.margins || { top: 10, right: 10, bottom: 10, left: 10 };
  
  // Page dimensions in mm (A4 is 210x297 mm)
  let pageWidth = 210;
  let pageHeight = 297;
  
  // Set page dimensions based on page size
  switch (pageSize.toLowerCase()) {
    case 'letter':
      pageWidth = 215.9;
      pageHeight = 279.4;
      break;
    case 'legal':
      pageWidth = 215.9;
      pageHeight = 355.6;
      break;
    case 'a3':
      pageWidth = 297;
      pageHeight = 420;
      break;
    case 'a5':
      pageWidth = 148;
      pageHeight = 210;
      break;
    // Default is A4
  }
  
  // Swap dimensions if landscape
  if (orientation === 'landscape') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  // Calculate printable area (converting mm to px, assuming 96 DPI)
  const mmToPx = 3.779527559; // 1mm = 3.779527559px at 96 DPI
  
  const printableWidth = (pageWidth - (margins.left || 0) - (margins.right || 0)) * mmToPx;
  const printableHeight = (pageHeight - (margins.top || 0) - (margins.bottom || 0)) * mmToPx;
  
  return {
    width: printableWidth,
    height: printableHeight
  };
};