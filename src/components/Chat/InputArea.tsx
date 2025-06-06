import React, { useState, useCallback } from 'react';
import { Play, AlertCircle, Plus, X, Upload, FileText, Trash2, Bug, Paperclip } from 'lucide-react';
import { InputAreaProps, AnalysisRequest } from '../../types';
import Button from '../Common/Button';

interface StackTrace {
  id: string;
  content: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  content: string;
  mimeType: string;
  size: number;
}

export function InputArea({ 
  onSubmit, 
  isLoading, 
  isNewChat = true, 
  hasIntegratedContent = false, 
  hasInteractiveQuestions = false
}: InputAreaProps) {
  const [description, setDescription] = useState('');
  const [stackTraces, setStackTraces] = useState<StackTrace[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [showStackTraceModal, setShowStackTraceModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const addStackTrace = () => {
    const newStackTrace: StackTrace = {
      id: Date.now().toString(),
      content: ''
    };
    setStackTraces([...stackTraces, newStackTrace]);
  };

  const removeStackTrace = (id: string) => {
    setStackTraces(stackTraces.filter((st: StackTrace) => st.id !== id));
  };

  const updateStackTrace = (id: string, content: string) => {
    setStackTraces(stackTraces.map((st: StackTrace) => st.id === id ? { ...st, content } : st));
  };

  const handleFileUpload = useCallback((files: FileList) => {
    const maxSize = 1024 * 1024; // 1MB
    const allowedTypes = ['text/plain', 'text/log', 'application/octet-stream'];
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 1MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|log)$/i)) {
        setError(`File ${file.name} is not supported. Please upload .txt or .log files.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          fileName: file.name,
          content: e.target?.result as string,
          mimeType: file.type || 'text/plain',
          size: file.size
        };
        setUploadedFiles((prev: UploadedFile[]) => [...prev, newFile]);
        setError('');
      };
      reader.readAsText(file);
    });
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f: UploadedFile) => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please provide a description of your issue');
      return;
    }
    
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setError('');
    
    // Extract stack traces
    const validStackTraces = stackTraces.filter((st: StackTrace) => st.content.trim());
    
    // Extract logs from uploaded files
    const logEntries = uploadedFiles.map((file: UploadedFile) => `[${file.fileName}]\n${file.content}`);
    
    // Create v2.0 AnalysisRequest with proper field separation
    const analysisRequest: AnalysisRequest = {
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: description.trim(),
      user_id: 'frontend_user',
      // Add stacktrace if we have exactly one, combine multiple into one
      ...(validStackTraces.length > 0 && {
        stacktrace: validStackTraces.length === 1 
          ? validStackTraces[0].content.trim()
          : validStackTraces.map((st: StackTrace, index: number) => `Stack Trace ${index + 1}:\n${st.content.trim()}`).join('\n\n')
      }),
      // Add logs from uploaded files
      ...(logEntries.length > 0 && {
        logs: logEntries
      }),
      created_at: new Date().toISOString()
    };

    // Submit the request
    onSubmit(analysisRequest);

    // Clear form after submission
    setDescription('');
    setStackTraces([]);
    setUploadedFiles([]);
  };

  const getButtonText = () => {
    if (isLoading) return 'Analyzing...';
    
    const hasStackTraces = stackTraces.some((st: StackTrace) => st.content.trim()) || uploadedFiles.length > 0;
    
    // Different button text based on context
    if (isNewChat) {
      return hasStackTraces ? 'Analyze Error' : 'Ask Question';
    } else {
      // We're in an active conversation - always show follow-up text
      if (hasIntegratedContent) {
        // When there are suggestions/actions shown, user is providing feedback
        return 'Continue Conversation';
      } else if (hasInteractiveQuestions) {
        // When there are interactive questions pending
        return 'Ask Another Question';
      } else {
        // General follow-up in active conversation
        return hasStackTraces ? 'Analyze New Error' : 'Ask Follow-up';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getTotalAttachments = () => {
    return stackTraces.filter((st: StackTrace) => st.content.trim()).length + uploadedFiles.length;
  };

  return (
    <>
      {/* Full-width responsive input area */}
      <div className="input-area-glass p-2 sm:p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Error display */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-lg p-3 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Attachment indicators */}
            {getTotalAttachments() > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {stackTraces.filter((st: StackTrace) => st.content.trim()).map((_: StackTrace, index: number) => (
                  <div key={index} className="flex items-center space-x-1 bg-gray-800 text-gray-300 px-2 py-1 rounded-md text-xs border border-gray-600">
                    <Bug className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-xs">Stack Trace {index + 1}</span>
                  </div>
                ))}
                {uploadedFiles.map((file: UploadedFile) => (
                  <div key={file.id} className="flex items-center space-x-1 bg-gray-800 text-gray-300 px-2 py-1 rounded-md text-xs border border-gray-600">
                    <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-xs truncate max-w-[100px] sm:max-w-none">{file.fileName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Responsive main input row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Description input */}
              <div className="flex-1 order-1 sm:order-1">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isNewChat 
                      ? "Describe your issue, ask a technical question, or explain the problem you're experiencing..."
                      : hasIntegratedContent
                      ? "What did you find? Let me know how it goes..."
                      : "Ask another question or describe a different issue..."
                  }
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none leading-6 placeholder-gray-400 text-sm sm:text-base"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  rows={2}
                />
              </div>

              {/* Action buttons - responsive layout */}
              <div className="flex items-center justify-between sm:justify-end space-x-2 order-2 sm:order-2">
                {/* Left side buttons on mobile, all buttons on desktop */}
                <div className="flex items-center space-x-2">
                  {/* Stack Trace button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStackTraceModal(true)}
                      className={`p-2 sm:p-3 rounded-lg transition-colors ${
                        stackTraces.filter((st: StackTrace) => st.content.trim()).length > 0
                          ? 'text-blue-400 bg-gray-800 hover:bg-gray-700 border border-gray-600'
                          : 'text-gray-500 hover:text-blue-400 hover:bg-gray-800 border border-gray-600'
                      }`}
                      title="Add Stack Trace"
                    >
                      <Bug className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {stackTraces.filter((st: StackTrace) => st.content.trim()).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {stackTraces.filter((st: StackTrace) => st.content.trim()).length}
                      </span>
                    )}
                  </div>

                  {/* File Upload button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFileModal(true)}
                      className={`p-2 sm:p-3 rounded-lg transition-colors ${
                        uploadedFiles.length > 0
                          ? 'text-blue-400 bg-gray-800 hover:bg-gray-700 border border-gray-600'
                          : 'text-gray-500 hover:text-blue-400 hover:bg-gray-800 border border-gray-600'
                      }`}
                      title="Upload Log Files"
                    >
                      <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {uploadedFiles.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {uploadedFiles.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={!description.trim() || description.trim().length < 10 || isLoading}
                  className="flex-shrink-0"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base">{getButtonText()}</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Character count */}
            <div className="text-xs text-gray-500 text-right">
              <span className={description.length < 10 ? 'text-red-400' : 'text-green-400'}>
                {description.length} characters (min: 10)
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Responsive Stack Trace Modal */}
      {showStackTraceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-large max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200">
              <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Stack Traces</h3>
              <button
                onClick={() => setShowStackTraceModal(false)}
                className="text-secondary-500 hover:text-secondary-700 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3 sm:space-y-4">
                {stackTraces.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-secondary-500">
                    <Bug className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-secondary-300" />
                    <p className="text-base sm:text-lg font-medium">No stack traces added yet</p>
                    <p className="text-sm">Add stack traces to help with error analysis</p>
                  </div>
                ) : (
                  stackTraces.map((stackTrace: StackTrace, index: number) => (
                    <div key={stackTrace.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-700">
                          Stack Trace {index + 1}
                        </label>
                        <button
                          onClick={() => removeStackTrace(stackTrace.id)}
                          className="text-danger-500 hover:text-danger-700 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <textarea
                        value={stackTrace.content}
                        onChange={(e) => updateStackTrace(stackTrace.id, e.target.value)}
                        placeholder="Paste your stack trace here..."
                        className="w-full p-3 border border-secondary-200 rounded-lg font-mono text-xs sm:text-sm min-h-[100px] sm:min-h-[120px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-500"
                        rows={4}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-t border-secondary-200 bg-secondary-50 space-y-3 sm:space-y-0">
              <Button
                onClick={addStackTrace}
                variant="outline"
                size="md"
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stack Trace</span>
              </Button>
              
              <Button
                onClick={() => setShowStackTraceModal(false)}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                Done ({stackTraces.filter((st: StackTrace) => st.content.trim()).length} added)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive File Upload Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-large max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200">
              <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Upload Log Files</h3>
              <button
                onClick={() => setShowFileModal(false)}
                className="text-secondary-500 hover:text-secondary-700 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Responsive Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 text-center transition-all duration-200 mb-4 sm:mb-6 ${
                  dragActive
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-secondary-300 hover:border-secondary-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${dragActive ? 'text-primary-500' : 'text-secondary-400'}`} />
                <div className="space-y-2">
                  <div className="text-base sm:text-lg font-medium text-secondary-700">
                    Drop log files here or{' '}
                    <label className="text-primary-600 hover:text-primary-700 cursor-pointer underline">
                      browse files
                      <input
                        type="file"
                        multiple
                        accept=".txt,.log"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-xs sm:text-sm text-secondary-500">
                    Supports .txt and .log files (max 1MB each)
                  </div>
                </div>
              </div>

              {/* Responsive Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="font-medium text-secondary-900 text-sm sm:text-base">Uploaded Files:</h4>
                  {uploadedFiles.map((file: UploadedFile) => (
                    <div key={file.id} className="flex items-center justify-between bg-secondary-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-secondary-900 text-sm sm:text-base truncate">{file.fileName}</div>
                          <div className="text-xs sm:text-sm text-secondary-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-danger-500 hover:text-danger-700 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-4 sm:p-6 border-t border-secondary-200 bg-secondary-50">
              <Button
                onClick={() => setShowFileModal(false)}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                Done ({uploadedFiles.length} uploaded)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InputArea; 