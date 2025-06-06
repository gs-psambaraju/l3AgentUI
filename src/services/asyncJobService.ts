import { APP_CONFIG, API_ENDPOINTS, API_BASE_URL } from '../utils/constants';
import {
  AnalysisRequest,
  AnalysisResponse,
  AnalysisJob,
  AsyncJobResponse,
  JobStatsResponse,
  ApiResponseWrapper,
  FollowUpRequest
} from '../types';

export class AsyncJobService {
  private static readonly BASE_URL = API_BASE_URL;
  private static readonly POLL_INTERVAL = APP_CONFIG.asyncJobConfig.pollInterval;
  private static readonly MAX_POLL_ATTEMPTS = APP_CONFIG.asyncJobConfig.maxPollAttempts;

  /**
   * Start an asynchronous analysis job
   */
  static async startAsyncAnalysis(request: AnalysisRequest): Promise<AnalysisJob> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.ANALYZE_ASYNC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Maximum 5 concurrent jobs per user.');
      }

      const result: AsyncJobResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start async analysis');
      }

      if (!result.data) {
        throw new Error('No job data received');
      }

      return result.data;
    } catch (error) {
      console.error('Async analysis error:', error);
      throw error;
    }
  }

  /**
   * Start an asynchronous follow-up message job
   */
  static async startAsyncFollowUp(conversationId: string, request: FollowUpRequest): Promise<AnalysisJob> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.CONVERSATION_MESSAGE_ASYNC}/${conversationId}/message-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Maximum 5 concurrent jobs per user.');
      }

      const result: AsyncJobResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start async follow-up');
      }

      if (!result.data) {
        throw new Error('No job data received');
      }

      return result.data;
    } catch (error) {
      console.error('Async follow-up error:', error);
      throw error;
    }
  }

  /**
   * Get job status and progress
   */
  static async getJobStatus(jobId: string): Promise<AnalysisJob> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.JOB_STATUS}/${jobId}/status`, {
        method: 'GET',
      });

      const result: AsyncJobResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get job status');
      }

      if (!result.data) {
        throw new Error('No job status data received');
      }

      return result.data;
    } catch (error) {
      console.error('Get job status error:', error);
      throw error;
    }
  }

  /**
   * Get job result when completed
   */
  static async getJobResult(jobId: string): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.JOB_RESULT}/${jobId}/result`, {
        method: 'GET',
      });

      if (response.status === 400) {
        throw new Error('Job not yet completed');
      }

      const result: ApiResponseWrapper<AnalysisResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get job result');
      }

      if (!result.data) {
        throw new Error('No job result data received');
      }

      return result.data;
    } catch (error) {
      console.error('Get job result error:', error);
      throw error;
    }
  }

  /**
   * Get job service statistics
   */
  static async getJobStats(): Promise<JobStatsResponse['data']> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.JOB_STATS}`, {
        method: 'GET',
      });

      const result: JobStatsResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get job stats');
      }

      if (!result.data) {
        throw new Error('No job stats data received');
      }

      return result.data;
    } catch (error) {
      console.error('Get job stats error:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion with progress updates
   */
  static async pollForCompletion(
    jobId: string, 
    onProgress?: (job: AnalysisJob) => void,
    onError?: (error: Error) => void
  ): Promise<AnalysisResponse> {
    let attempts = 0;
    
    while (attempts < this.MAX_POLL_ATTEMPTS) {
      try {
        const job = await this.getJobStatus(jobId);
        
        // Update progress callback
        if (onProgress) {
          onProgress(job);
        }
        
        // Check if job is completed
        if (job.status === 'COMPLETED') {
          return await this.getJobResult(jobId);
        }
        
        // Check if job failed
        if (job.status === 'FAILED' || job.status === 'TIMEOUT') {
          const error = new Error(job.errorMessage || `Job ${job.status.toLowerCase()}`);
          if (onError) {
            onError(error);
          }
          throw error;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
        attempts++;
        
      } catch (error) {
        console.error(`Polling attempt ${attempts + 1} failed:`, error);
        if (onError) {
          onError(error as Error);
        }
        
        // If this is a network error, wait and retry
        if (attempts < this.MAX_POLL_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
          attempts++;
          continue;
        }
        
        throw error;
      }
    }
    
    const timeoutError = new Error('Job polling timed out after 5 minutes');
    if (onError) {
      onError(timeoutError);
    }
    throw timeoutError;
  }

  /**
   * Determine if request should use async processing
   */
  static shouldUseAsync(request: AnalysisRequest): boolean {
    // Use async for complex cases as per API documentation
    const hasStacktrace = !!request.stacktrace;
    const hasMultipleLogs = (request.logs?.length || 0) > 5;
    const isLongQuestion = request.question.length > 500;
    const hasCodeSnippets = (request.code_snippets?.length || 0) > 0;
    
    return hasStacktrace || hasMultipleLogs || isLongQuestion || hasCodeSnippets;
  }

  /**
   * Smart analysis that chooses sync vs async automatically
   */
  static async smartAnalyze(
    request: AnalysisRequest,
    onProgress?: (job: AnalysisJob) => void,
    onError?: (error: Error) => void
  ): Promise<AnalysisResponse> {
    if (this.shouldUseAsync(request)) {
      console.log('🔄 Using async analysis for complex request');
      const job = await this.startAsyncAnalysis(request);
      return await this.pollForCompletion(job.jobId, onProgress, onError);
    } else {
      console.log('⚡ Using sync analysis for simple request');
      // Use sync analysis endpoint directly to avoid circular dependency
      return await this.syncAnalyze(request);
    }
  }

  /**
   * Direct sync analysis call (to avoid circular dependency)
   */
  private static async syncAnalyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.ANALYZE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: ApiResponseWrapper<AnalysisResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      if (!result.data) {
        throw new Error('No data received from analysis');
      }

      return result.data;
    } catch (error) {
      console.error('Sync analysis error:', error);
      throw error;
    }
  }
} 