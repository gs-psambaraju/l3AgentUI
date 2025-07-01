import { AnalysisRequest, AnalysisResponse, AnalysisJob } from '../types';
import { AsyncJobService } from './asyncJobService';

export interface UploadedFile {
  id: string;
  fileName: string;
  file: File; // Actual File object for multipart upload
  mimeType: string;
  size: number;
}

export interface EnhancedAnalysisRequest extends Omit<AnalysisRequest, 'logs'> {
  uploadedFiles?: UploadedFile[]; // Files to upload via multipart
  // No logs field - simplified approach
}

export class EnhancedAnalysisService {
  private static readonly API_BASE_URL = 'http://localhost:8080/l3agent/api/v1';
  
  /**
   * Submit analysis request using the appropriate format:
   * - Multipart form data if files are present
   * - JSON if only text data
   */
  static async submitAnalysis(
    request: EnhancedAnalysisRequest,
    onProgress?: (job: AnalysisJob) => void,
    onError?: (error: Error) => void
  ): Promise<AnalysisResponse> {
    
    const hasFiles = request.uploadedFiles && request.uploadedFiles.length > 0;
    
    if (hasFiles) {
      // Use multipart form data for file uploads
      return this.submitMultipartAnalysis(request, onProgress, onError);
    } else {
      // Use JSON for text-only requests
      return this.submitJSONAnalysis(request, onProgress, onError);
    }
  }

  /**
   * Submit analysis using multipart form data (when files are present)
   */
  private static async submitMultipartAnalysis(
    request: EnhancedAnalysisRequest,
    onProgress?: (job: AnalysisJob) => void,
    onError?: (error: Error) => void
  ): Promise<AnalysisResponse> {
    
    console.log('📤 Submitting multipart analysis request with files:', {
      fileCount: request.uploadedFiles?.length || 0,
      fileNames: request.uploadedFiles?.map(f => f.fileName) || [],
      hasStacktrace: !!request.stacktrace
    });

    const formData = new FormData();
    
    // Add required fields
    formData.append('question', request.question);
    formData.append('userId', request.user_id || 'frontend_user');
    
    // Add optional fields
    if (request.request_id) {
      formData.append('requestId', request.request_id);
    }
    
    if (request.stacktrace) {
      formData.append('stacktrace', request.stacktrace);
    }
    
    // Add file uploads
    if (request.uploadedFiles) {
      request.uploadedFiles.forEach((uploadedFile, index) => {
        // Use 'logFile' as the field name for single file or add index for multiple
        const fieldName = request.uploadedFiles!.length === 1 ? 'logFile' : `logFile${index}`;
        formData.append(fieldName, uploadedFile.file, uploadedFile.fileName);
      });
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/analyze-async`, {
        method: 'POST',
        body: formData, // No Content-Type header - browser sets it with boundary
      });

      const result = await this.handleResponse(response);
      
      // If response contains a job ID, poll for completion
      if (result.jobId) {
        return AsyncJobService.pollForCompletion(result.jobId, onProgress, onError);
      }
      
      // Otherwise, return direct response
      return result as AnalysisResponse;
      
    } catch (error) {
      console.error('Multipart analysis submission error:', error);
      throw error;
    }
  }

  /**
   * Submit analysis using JSON format (when no files)
   */
  private static async submitJSONAnalysis(
    request: EnhancedAnalysisRequest,
    onProgress?: (job: AnalysisJob) => void,
    onError?: (error: Error) => void
  ): Promise<AnalysisResponse> {
    
    console.log('📤 Submitting JSON analysis request:', {
      hasStacktrace: !!request.stacktrace
    });

    // Convert to standard AnalysisRequest format
    const analysisRequest: AnalysisRequest = {
      request_id: request.request_id,
      question: request.question,
      stacktrace: request.stacktrace,
      user_id: request.user_id,
      created_at: request.created_at
    };

    // Use existing AsyncJobService for JSON requests
    return AsyncJobService.smartAnalyze(analysisRequest, onProgress, onError);
  }

  /**
   * Handle response from multipart submission
   */
  private static async handleResponse(response: Response): Promise<any> {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Maximum 5 concurrent jobs per user.');
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    return result.data || result;
  }

  /**
   * Validate file uploads before submission
   */
  static validateFiles(files: UploadedFile[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.txt', '.log'];
    
    files.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`File ${file.fileName} is too large (max 10MB)`);
      }
      
      // Check file extension
      const hasValidExtension = allowedExtensions.some(ext => 
        file.fileName.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        errors.push(`File ${file.fileName} must be a .txt or .log file`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert legacy UploadedFile format to new format
   */
  static convertLegacyFiles(legacyFiles: Array<{
    id: string;
    fileName: string;
    content: string;
    mimeType: string;
    size: number;
  }>): UploadedFile[] {
    return legacyFiles.map(legacyFile => {
      // Create File object from content
      const blob = new Blob([legacyFile.content], { type: legacyFile.mimeType });
      const file = new File([blob], legacyFile.fileName, { type: legacyFile.mimeType });
      
      return {
        id: legacyFile.id,
        fileName: legacyFile.fileName,
        file: file,
        mimeType: legacyFile.mimeType,
        size: legacyFile.size
      };
    });
  }
} 