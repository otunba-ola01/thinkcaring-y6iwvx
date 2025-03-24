import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress, Paper, IconButton } from '@mui/material'; // v5.13.0
import { styled } from '@mui/material/styles'; // v5.13.0
import { CloudUpload, Close } from '@mui/icons-material'; // v5.11.16
import { FileUploaderProps } from '../../types/ui.types';
import { isValidFileType, isValidFileSize, formatFileSize } from '../../utils/file';
import useToast from '../../hooks/useToast';

// Styled component for the drop zone area
const DropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'hasError'
})<{ isDragActive: boolean; hasError: boolean }>(({ theme, isDragActive, hasError }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${
    hasError 
      ? theme.palette.error.main 
      : isDragActive 
        ? theme.palette.primary.main 
        : theme.palette.divider
  }`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isDragActive 
    ? theme.palette.action.hover 
    : hasError 
      ? theme.palette.error.light 
      : theme.palette.background.paper,
  transition: theme.transitions.create(['border', 'background-color']),
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

// Styled component for file preview items
const FilePreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  margin: theme.spacing(1, 0),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`
}));

// Visually hidden input for accessibility
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
});

/**
 * A reusable file upload component that allows users to select and upload files 
 * with validation for file types and sizes. Provides drag-and-drop functionality 
 * and visual feedback during the upload process.
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  acceptedTypes,
  maxSize,
  onUpload,
  multiple = false,
  label = 'Upload File',
  helperText = 'Drag and drop a file here or click to select a file',
  loading = false,
  error,
  sx
}) => {
  // State for tracking drag operations, selected files, and errors
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<{ [filename: string]: string }>({});
  
  // Reference to the file input element
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Toast notifications
  const toast = useToast();
  
  // Handle drag events (dragEnter, dragOver, dragLeave)
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  // Handle file drop events
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to array
      const filesArray = Array.from(e.dataTransfer.files);
      handleFileSelection(filesArray);
    }
  }, []);
  
  // Handle file selection via input
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array
      const filesArray = Array.from(e.target.files);
      handleFileSelection(filesArray);
      
      // Reset the input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, []);
  
  // Process and validate selected files
  const handleFileSelection = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    const newErrors: { [filename: string]: string } = {};
    
    // Check each file for validity
    for (const file of files) {
      // Check file type
      if (!isValidFileType(file, acceptedTypes)) {
        newErrors[file.name] = `File type '${file.type || 'unknown'}' is not supported`;
        continue;
      }
      
      // Check file size
      if (!isValidFileSize(file, maxSize)) {
        newErrors[file.name] = `File size exceeds the maximum limit of ${formatFileSize(maxSize)}`;
        continue;
      }
      
      // If we get here, the file is valid
      validFiles.push(file);
    }
    
    // Update selected files state based on multiple flag
    setSelectedFiles(prevSelectedFiles => {
      if (multiple) {
        // Add valid files to existing files
        return [...prevSelectedFiles, ...validFiles];
      } else {
        // Replace with valid files (should be at most one)
        return validFiles.length > 0 ? [validFiles[0]] : [];
      }
    });
    
    // Update errors state
    setUploadErrors(newErrors);
    
    // Show error toast if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join(', ');
      toast.error(errorMessages);
    }
  }, [multiple, acceptedTypes, maxSize, toast]);
  
  // Remove a file from the selected files list
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);
  
  // Handle submit button click
  const handleSubmit = useCallback(() => {
    if (selectedFiles.length === 0) {
      toast.warning('Please select a file to upload');
      return;
    }
    
    // If there are no validation errors, call the onUpload callback
    if (Object.keys(uploadErrors).length === 0) {
      onUpload(selectedFiles);
    } else {
      toast.error('Please resolve the file validation errors before uploading');
    }
  }, [selectedFiles, uploadErrors, onUpload, toast]);
  
  // Get list of accepted file types for display
  const acceptedTypesDisplay = acceptedTypes
    .map(type => type.replace('image/', '').replace('application/', '').replace('text/', '').replace('audio/', '').replace('video/', ''))
    .map(type => type.startsWith('.') ? type.substring(1).toUpperCase() : type.toUpperCase())
    .join(', ');
  
  return (
    <Box sx={{ ...sx }}>
      {/* Drag and drop area */}
      <DropZone
        isDragActive={dragActive}
        hasError={!!error}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <CloudUpload 
          sx={{ 
            fontSize: 48, 
            color: error ? 'error.main' : dragActive ? 'primary.main' : 'action.active',
            mb: 2 
          }} 
        />
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {helperText}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Accepted file types: {acceptedTypesDisplay}
        </Typography>
        <Typography variant="caption" display="block">
          Maximum file size: {formatFileSize(maxSize)}
        </Typography>
        
        {/* Hidden file input */}
        <VisuallyHiddenInput
          ref={inputRef}
          type="file"
          multiple={multiple}
          onChange={handleChange}
          accept={acceptedTypes.join(',')}
        />
      </DropZone>
      
      {/* List of selected files */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected file{selectedFiles.length > 1 ? 's' : ''}:
          </Typography>
          
          {selectedFiles.map((file, index) => (
            <FilePreview key={`${file.name}-${index}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                  ({formatFileSize(file.size)})
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                sx={{ ml: 1 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </FilePreview>
          ))}
          
          {/* Upload button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || selectedFiles.length === 0 || Object.keys(uploadErrors).length > 0}
            startIcon={<CloudUpload />}
            sx={{ mt: 2 }}
          >
            Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}
          </Button>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* Loading progress */}
      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;