import { downloadFile, convertJsonToCsv } from './file';
import { printElementToPDF } from './print';
import { formatDate } from './date';
import { ReportFormat, ReportData } from '../types/reports.types';
import ExcelJS from 'exceljs'; // exceljs ^4.3.0

/**
 * Converts data to CSV format and triggers a download
 * 
 * @param data Array of data objects to convert to CSV
 * @param filename Name for the downloaded file (will add .csv extension if not present)
 * @param options Configuration options for the export
 * @returns Promise that resolves when the CSV file is downloaded
 */
export const exportToCSV = async (
  data: any[],
  filename: string = '',
  options: {
    includeHeaders?: boolean;
    delimiter?: string;
    quoteStrings?: boolean;
    columnHeaders?: string[];
    handleNestedObjects?: boolean;
  } = {}
): Promise<void> => {
  // Validate that data is an array and not empty
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data must be a non-empty array');
  }
  
  // Apply default options
  const defaultOptions = {
    includeHeaders: true,
    delimiter: ',',
    quoteStrings: true,
    handleNestedObjects: true
  };
  
  const exportOptions = { ...defaultOptions, ...options };
  
  // Convert the data to CSV format
  const csvContent = convertJsonToCsv(data, {
    headers: exportOptions.columnHeaders,
    includeHeaders: exportOptions.includeHeaders,
    delimiter: exportOptions.delimiter,
    quoteStrings: exportOptions.quoteStrings,
    handleNestedObjects: exportOptions.handleNestedObjects
  });
  
  // Generate filename if not provided
  if (!filename) {
    const currentDate = formatDate(new Date(), 'yyyy-MM-dd');
    filename = `export_${currentDate}.csv`;
  }
  
  // Ensure filename has .csv extension
  if (!filename.toLowerCase().endsWith('.csv')) {
    filename += '.csv';
  }
  
  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  
  // Download the file
  return downloadFile(blob, filename);
};

/**
 * Converts data to Excel format and triggers a download
 * 
 * @param data Array of data objects to convert to Excel
 * @param filename Name for the downloaded file (will add .xlsx extension if not present)
 * @param options Configuration options for the export
 * @returns Promise that resolves when the Excel file is downloaded
 */
export const exportToExcel = async (
  data: any[],
  filename: string = '',
  options: {
    sheetName?: string;
    title?: string;
    author?: string;
    includeHeaders?: boolean;
    columnHeaders?: string[];
    columnFormatting?: Record<string, string>;
    freezeHeaders?: boolean;
    autoFilter?: boolean;
  } = {}
): Promise<void> => {
  // Validate that data is an array and not empty
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data must be a non-empty array');
  }
  
  // Apply default options
  const defaultOptions = {
    includeHeaders: true,
    sheetName: 'Sheet1',
    author: 'HCBS Revenue Management System',
    freezeHeaders: true,
    autoFilter: true
  };
  
  const exportOptions = { ...defaultOptions, ...options };
  
  // Create a new workbook
  const workbook = await generateExcelWorkbook(data, exportOptions);
  
  // Generate filename if not provided
  if (!filename) {
    const currentDate = formatDate(new Date(), 'yyyy-MM-dd');
    filename = `export_${currentDate}.xlsx`;
  }
  
  // Ensure filename has .xlsx extension
  if (!filename.toLowerCase().endsWith('.xlsx')) {
    filename += '.xlsx';
  }
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  // Download the file
  return downloadFile(blob, filename);
};

/**
 * Converts an HTML element to PDF format and triggers a download
 * 
 * @param element HTML element to convert to PDF
 * @param filename Name for the downloaded file (will add .pdf extension if not present)
 * @param options Configuration options for the export
 * @returns Promise that resolves when the PDF file is downloaded
 */
export const exportToPDF = async (
  element: HTMLElement,
  filename: string = '',
  options: {
    orientation?: 'portrait' | 'landscape';
    pageSize?: string;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    title?: string;
    header?: string;
    footer?: string;
    includePageNumbers?: boolean;
    includeDate?: boolean;
  } = {}
): Promise<void> => {
  // Validate that element is a valid HTML element
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('A valid HTML element must be provided');
  }
  
  // Apply default options
  const defaultOptions = {
    orientation: 'portrait',
    pageSize: 'a4',
    margins: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    },
    includePageNumbers: true,
    includeDate: true
  };
  
  const exportOptions = { ...defaultOptions, ...options };
  
  // Generate filename if not provided
  if (!filename) {
    const currentDate = formatDate(new Date(), 'yyyy-MM-dd');
    filename = `export_${currentDate}.pdf`;
  }
  
  // Ensure filename has .pdf extension
  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }
  
  // Convert the element to PDF
  const pdfBlob = await printElementToPDF(element, {
    orientation: exportOptions.orientation as any,
    pageSize: exportOptions.pageSize,
    margins: exportOptions.margins,
    title: exportOptions.title,
    header: exportOptions.header,
    footer: exportOptions.footer,
    includePageNumbers: exportOptions.includePageNumbers,
    includeDate: exportOptions.includeDate
  });
  
  // Download the file
  return downloadFile(pdfBlob, filename);
};

/**
 * Converts data to JSON format and triggers a download
 * 
 * @param data Data to convert to JSON
 * @param filename Name for the downloaded file (will add .json extension if not present)
 * @param options Configuration options for the export
 * @returns Promise that resolves when the JSON file is downloaded
 */
export const exportToJSON = async (
  data: any,
  filename: string = '',
  options: {
    prettify?: boolean;
    replacer?: (key: string, value: any) => any;
    space?: number;
  } = {}
): Promise<void> => {
  // Validate that data is not null or undefined
  if (data === null || data === undefined) {
    throw new Error('Data cannot be null or undefined');
  }
  
  // Apply default options
  const defaultOptions = {
    prettify: true,
    space: 2
  };
  
  const exportOptions = { ...defaultOptions, ...options };
  
  // Convert the data to a JSON string
  const jsonContent = exportOptions.prettify 
    ? JSON.stringify(data, exportOptions.replacer, exportOptions.space) 
    : JSON.stringify(data);
  
  // Generate filename if not provided
  if (!filename) {
    const currentDate = formatDate(new Date(), 'yyyy-MM-dd');
    filename = `export_${currentDate}.json`;
  }
  
  // Ensure filename has .json extension
  if (!filename.toLowerCase().endsWith('.json')) {
    filename += '.json';
  }
  
  // Create a Blob from the JSON string
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  
  // Download the file
  return downloadFile(blob, filename);
};

/**
 * Exports report data in the specified format
 * 
 * @param reportData Report data to export
 * @param format Format to export the data in (PDF, Excel, CSV, JSON)
 * @param filename Name for the downloaded file
 * @param options Configuration options for the export
 * @returns Promise that resolves when the report is exported
 */
export const exportReport = async (
  reportData: ReportData,
  format: ReportFormat,
  filename: string = '',
  options: any = {}
): Promise<void> => {
  // Validate that reportData is not null or undefined
  if (!reportData) {
    throw new Error('Report data is required');
  }
  
  // If filename is not provided, generate one from the report metadata
  if (!filename && reportData.metadata) {
    const reportName = reportData.metadata.reportName || 'Report';
    const currentDate = formatDate(reportData.metadata.generatedAt || new Date(), 'yyyy-MM-dd');
    filename = `${reportName}_${currentDate}`;
  }
  
  try {
    switch (format) {
      case ReportFormat.PDF:
        // For PDF, we need to find or create an HTML element from the report data
        let pdfElement: HTMLElement | null = document.getElementById('report-content');
        
        if (!pdfElement) {
          // Create a temporary element if one doesn't exist
          pdfElement = document.createElement('div');
          pdfElement.id = 'temp-report-content';
          
          // Populate with report data - this would need to be customized based on report structure
          pdfElement.innerHTML = `
            <h1>${reportData.metadata.reportName}</h1>
            <div class="report-summary">
              <p>Generated: ${formatDate(reportData.metadata.generatedAt, 'MMMM d, yyyy')}</p>
              <p>Generated By: ${reportData.metadata.generatedBy.name}</p>
              <p>Organization: ${reportData.metadata.organization.name}</p>
            </div>
            <div class="report-content">
              ${generateReportHtml(reportData)}
            </div>
          `;
          
          document.body.appendChild(pdfElement);
        }
        
        // Export to PDF
        await exportToPDF(pdfElement, filename, options);
        
        // Remove temporary element if we created one
        if (pdfElement.id === 'temp-report-content') {
          document.body.removeChild(pdfElement);
        }
        break;
        
      case ReportFormat.EXCEL:
        // Extract tabular data from the report
        let excelData: any[] = [];
        
        // Depending on the report structure, extract the appropriate data
        if (reportData.data && typeof reportData.data === 'object') {
          // Find the first array in the data object
          for (const key in reportData.data) {
            if (Array.isArray(reportData.data[key])) {
              excelData = reportData.data[key];
              break;
            }
          }
        }
        
        // Export to Excel with appropriate formatting
        await exportToExcel(excelData, filename, {
          ...options,
          title: reportData.metadata.reportName,
          sheetName: reportData.metadata.reportType || 'Report',
          // Add automatic formatting based on common field names
          columnFormatting: {
            ...detectColumnFormats(excelData),
            ...(options.columnFormatting || {})
          }
        });
        break;
        
      case ReportFormat.CSV:
        // Extract tabular data similar to Excel
        let csvData: any[] = [];
        
        // Depending on the report structure, extract the appropriate data
        if (reportData.data && typeof reportData.data === 'object') {
          // Find the first array in the data object
          for (const key in reportData.data) {
            if (Array.isArray(reportData.data[key])) {
              csvData = reportData.data[key];
              break;
            }
          }
        }
        
        // Export to CSV
        await exportToCSV(csvData, filename, options);
        break;
        
      case ReportFormat.JSON:
        // Export the entire report as JSON
        await exportToJSON(reportData, filename, options);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

/**
 * Helper function to generate HTML from report data
 */
function generateReportHtml(reportData: ReportData): string {
  let html = '';
  
  // Add summary metrics
  if (reportData.summaryMetrics && reportData.summaryMetrics.length > 0) {
    html += '<div class="summary-metrics"><h2>Summary</h2><table>';
    reportData.summaryMetrics.forEach(metric => {
      let valueDisplay = metric.value;
      let changeDisplay = '';
      
      // Format based on metric type
      if (metric.format === 'currency' && typeof metric.value === 'number') {
        valueDisplay = `$${metric.value.toFixed(2)}`;
        if (typeof metric.change === 'number') {
          changeDisplay = `(${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(2)}%)`;
        }
      } else if (metric.format === 'percentage' && typeof metric.value === 'number') {
        valueDisplay = `${metric.value.toFixed(2)}%`;
        if (typeof metric.change === 'number') {
          changeDisplay = `(${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(2)}%)`;
        }
      }
      
      html += `<tr><td>${metric.label}</td><td>${valueDisplay} ${changeDisplay}</td></tr>`;
    });
    html += '</table></div>';
  }
  
  // Add data tables for each data set
  if (reportData.data) {
    for (const key in reportData.data) {
      if (Array.isArray(reportData.data[key]) && reportData.data[key].length > 0) {
        const dataArray = reportData.data[key];
        html += `<div class="data-table"><h2>${key.replace(/([A-Z])/g, ' $1').trim()}</h2><table>`;
        
        // Add headers
        html += '<tr>';
        Object.keys(dataArray[0]).forEach(header => {
          html += `<th>${header.replace(/([A-Z])/g, ' $1').trim()}</th>`;
        });
        html += '</tr>';
        
        // Add data rows
        dataArray.forEach(row => {
          html += '<tr>';
          Object.entries(row).forEach(([key, value]) => {
            // Format value based on type
            let formattedValue = value;
            if (typeof value === 'number') {
              if (key.toLowerCase().includes('amount') || 
                  key.toLowerCase().includes('revenue') || 
                  key.toLowerCase().includes('payment')) {
                formattedValue = `$${value.toFixed(2)}`;
              } else if (key.toLowerCase().includes('percentage') || 
                         key.toLowerCase().includes('rate')) {
                formattedValue = `${value.toFixed(2)}%`;
              }
            } else if (value instanceof Date) {
              formattedValue = formatDate(value, 'MM/dd/yyyy');
            }
            
            html += `<td>${formattedValue}</td>`;
          });
          html += '</tr>';
        });
        
        html += '</table></div>';
      }
    }
  }
  
  return html;
}

/**
 * Helper function to detect column formats based on data analysis
 */
function detectColumnFormats(data: any[]): Record<string, string> {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }
  
  const formats: Record<string, string> = {};
  const sampleRow = data[0];
  
  // Analyze each column to detect appropriate format
  Object.keys(sampleRow).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    // Detect currency fields
    if (lowerKey.includes('amount') || 
        lowerKey.includes('price') || 
        lowerKey.includes('cost') ||
        lowerKey.includes('revenue') ||
        lowerKey.includes('payment') ||
        lowerKey.includes('budget')) {
      formats[key] = 'currency';
    }
    // Detect percentage fields
    else if (lowerKey.includes('percent') || 
             lowerKey.includes('rate') || 
             lowerKey.includes('ratio')) {
      formats[key] = 'percentage';
    }
    // Detect date fields
    else if (lowerKey.includes('date') || 
             lowerKey.includes('created') || 
             lowerKey.includes('updated') ||
             lowerKey.includes('timestamp')) {
      formats[key] = 'date';
    }
    // Detect number fields
    else if (lowerKey.includes('count') || 
             lowerKey.includes('number') || 
             lowerKey.includes('quantity') ||
             lowerKey.includes('total')) {
      formats[key] = 'number';
    }
  });
  
  return formats;
}

/**
 * Generates an Excel workbook from data without triggering a download
 * 
 * @param data Array of data objects to convert to Excel
 * @param options Configuration options for the workbook
 * @returns Promise that resolves with the generated Excel workbook
 */
export const generateExcelWorkbook = async (
  data: any[],
  options: {
    sheetName?: string;
    title?: string;
    author?: string;
    includeHeaders?: boolean;
    columnHeaders?: string[];
    columnFormatting?: Record<string, string>;
    freezeHeaders?: boolean;
    autoFilter?: boolean;
  } = {}
): Promise<ExcelJS.Workbook> => {
  // Validate that data is an array and not empty
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data must be a non-empty array');
  }
  
  // Apply default options
  const defaultOptions = {
    sheetName: 'Sheet1',
    includeHeaders: true,
    author: 'HCBS Revenue Management System',
    freezeHeaders: true,
    autoFilter: true
  };
  
  const exportOptions = { ...defaultOptions, ...options };
  
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = exportOptions.author;
  workbook.lastModifiedBy = exportOptions.author;
  workbook.created = new Date();
  workbook.modified = new Date();
  
  if (exportOptions.title) {
    workbook.properties.title = exportOptions.title;
  }
  
  // Add a worksheet
  const worksheet = workbook.addWorksheet(exportOptions.sheetName);
  
  // Determine column headers
  let headers: string[] = [];
  
  if (exportOptions.columnHeaders) {
    // Use provided headers
    headers = exportOptions.columnHeaders;
  } else if (data.length > 0) {
    // Extract headers from the first data object
    headers = Object.keys(data[0]);
  }
  
  // Add headers to the worksheet if includeHeaders is true
  if (exportOptions.includeHeaders && headers.length > 0) {
    const headerRow = worksheet.addRow(headers);
    
    // Style the header row
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        bottom: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Freeze the header row if specified
    if (exportOptions.freezeHeaders) {
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }
    
    // Apply auto filter if specified
    if (exportOptions.autoFilter) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };
    }
  }
  
  // Add data rows
  for (const item of data) {
    const rowData: any[] = [];
    
    // Extract values for each column
    for (const header of headers) {
      rowData.push(item[header] !== undefined ? item[header] : '');
    }
    
    const row = worksheet.addRow(rowData);
    
    // Apply formatting based on data types and column formatting options
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      const format = exportOptions.columnFormatting?.[header];
      
      if (format) {
        // Apply specified format
        formatExcelCell(cell, cell.value, format);
      } else {
        // Apply automatic formatting based on data type
        const value = cell.value;
        
        if (typeof value === 'number') {
          // Check if it might be currency (look for common currency fields)
          if (header.toLowerCase().includes('amount') || 
              header.toLowerCase().includes('price') || 
              header.toLowerCase().includes('cost') ||
              header.toLowerCase().includes('revenue') ||
              header.toLowerCase().includes('payment')) {
            formatExcelCell(cell, value, 'currency');
          }
        } else if (value instanceof Date) {
          formatExcelCell(cell, value, 'date');
        } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Check if string looks like a date (ISO format)
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            formatExcelCell(cell, date, 'date');
          }
        }
      }
    });
  }
  
  // Auto-size columns based on content
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50); // Cap width at 50 characters
  });
  
  return workbook;
};

/**
 * Formats an Excel cell based on the data type and format options
 * 
 * @param cell Excel cell to format
 * @param value Value to set in the cell
 * @param format Format to apply ('currency', 'percentage', 'date', etc.)
 */
export const formatExcelCell = (
  cell: ExcelJS.Cell,
  value: any,
  format: string
): void => {
  // Set the cell value
  cell.value = value;
  
  // Apply formatting based on the specified format
  switch (format.toLowerCase()) {
    case 'currency':
      cell.numFmt = '$#,##0.00;[Red]-$#,##0.00';
      cell.alignment = { horizontal: 'right' };
      break;
      
    case 'percentage':
      cell.numFmt = '0.00%';
      cell.alignment = { horizontal: 'right' };
      break;
      
    case 'date':
      if (value instanceof Date) {
        cell.value = value;
      } else if (typeof value === 'string') {
        // Try to parse the date string
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          cell.value = date;
        }
      }
      cell.numFmt = 'mm/dd/yyyy';
      cell.alignment = { horizontal: 'center' };
      break;
      
    case 'integer':
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'right' };
      break;
      
    case 'decimal':
    case 'number':
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right' };
      break;
  }
};