import { api } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import {
  StartConversationRequest,
  ContinueConversationRequest,
  ConversationResponse,
  HealthCheckResponse,
  ApiResponse,
  ApiResponseWrapper,
  AnalysisRequest,
  AnalysisResponse,
  FollowUpRequest,
  QuickAnalysisResponse,
  WorkflowSearchResponse,
  ConversationData,
  HealthData
} from '../types';

const API_BASE_URL = 'http://localhost:8080/l3agent/api/v1';

class ConversationService {
  
  // ===== PRIMARY ENDPOINTS =====
  
  /**
   * Main analysis endpoint - handles all question types and creates conversation
   */
  async analyzeQuestion(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
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
      console.error('Analysis error:', error);
      throw error;
    }
  }

  /**
   * Follow-up questions with conversation context
   */
  async sendFollowUpMessage(conversationId: string, request: FollowUpRequest): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: ApiResponseWrapper<AnalysisResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Follow-up message failed');
      }

      if (!result.data) {
        throw new Error('No data received from follow-up');
      }

      return result.data;
    } catch (error) {
      console.error('Follow-up error:', error);
      throw error;
    }
  }

  // ===== CONVERSATION MANAGEMENT =====

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(conversationId: string): Promise<ConversationData> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
        method: 'GET',
      });

      const result: ApiResponseWrapper<ConversationData> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get conversation history');
      }

      if (!result.data) {
        throw new Error('No conversation data received');
      }

      return result.data;
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }

  /**
   * Clean up conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
        method: 'DELETE',
      });

      const result: ApiResponseWrapper<{ message: string; conversationId: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }

  // ===== UTILITY ENDPOINTS =====

  /**
   * System health check
   */
  async getHealth(): Promise<HealthData> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });

      const result: ApiResponseWrapper<HealthData> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Health check failed');
      }

      if (!result.data) {
        throw new Error('No health data received');
      }

      return result.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Extract primary UI fields from response
   */
  extractUIFields(response: AnalysisResponse, currentConversationId?: string | null) {
    // Debug: Log the full response to understand the structure
    console.log('🔍 API Response Debug:', {
      fullResponse: response,
      analysisMetadata: response.analysisMetadata,
      conversationId: response.analysisMetadata?.conversationId,
      hasConversationId: !!response.analysisMetadata?.conversationId,
      currentConversationId,
      newConversationId: (response as any).conversation_id,
      hasDisplayMessageHtml: !!(response as any).displayMessageHtml
    });

    // NEW WAY: Use top-level conversation_id field (recommended)
    // Fallback to old ways for backward compatibility
    const conversationId = (response as any).conversation_id ||
                          response.analysisMetadata?.conversationId || 
                          (response as any).conversationId ||
                          currentConversationId ||
                          // Only generate a new conversation ID if none exists anywhere
                          `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🆔 Conversation ID Resolution:', {
      fromTopLevel: (response as any).conversation_id,
      fromMetadata: response.analysisMetadata?.conversationId,
      fromRoot: (response as any).conversationId,
      fromCurrent: currentConversationId,
      finalId: conversationId
    });

    // NEW WAY: Use displayMessageHtml if available, fallback to displayMessage
    const mainMessage = (response as any).displayMessageHtml || 
                       response.displayMessage || 
                       response.summary || 
                       'No response available';

    console.log('📝 Message Format Resolution:', {
      hasHtml: !!(response as any).displayMessageHtml,
      hasDisplayMessage: !!response.displayMessage,
      hasSummary: !!response.summary,
      usingHtml: !!(response as any).displayMessageHtml
    });

    return {
      mainMessage: mainMessage,
      isHtmlFormatted: !!(response as any).displayMessageHtml,
      actions: response.nextActions || response.immediateActions || [],
      details: response.thoughtProcess,
      needsEscalation: response.needsEscalation,
      conversationId: conversationId,
      supportsFollowUp: response.analysisMetadata?.supportsFollowUp !== false, // Default to true for v2.0
      confidence: response.confidenceLevel,
      processingTime: response.analysisMetadata?.processingTimeMs
    };
  }

  /**
   * Check if conversation supports follow-up
   */
  canFollowUp(response: AnalysisResponse): boolean {
    return !!(response.analysisMetadata?.conversationId && response.analysisMetadata?.supportsFollowUp);
  }

  // New v2 API Methods
  
  // Quick analysis for simple cases
  static async quickAnalyze(question: string): Promise<QuickAnalysisResponse> {
    try {
      const response: ApiResponse<QuickAnalysisResponse> = await api.post(
        API_ENDPOINTS.QUICK_ANALYZE,
        { question }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to quick analyze:', error);
      throw error;
    }
  }

  // Search workflows for additional context
  static async searchWorkflows(query: string, maxResults: number = 5): Promise<WorkflowSearchResponse> {
    try {
      const response: ApiResponse<WorkflowSearchResponse> = await api.post(
        API_ENDPOINTS.SEARCH_WORKFLOWS,
        { query, max_results: maxResults }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to search workflows:', error);
      throw error;
    }
  }

  // Health check endpoint (v2)
  static async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response: ApiResponse<HealthCheckResponse> = await api.get(API_ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // System status endpoint (v2)
  static async getStatus(): Promise<any> {
    try {
      const response: ApiResponse<any> = await api.get(API_ENDPOINTS.STATUS);
      return response.data;
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }

  // Ping endpoint (v2)
  static async ping(): Promise<{ message: string; timestamp: string }> {
    try {
      const response: ApiResponse<{ message: string; timestamp: string }> = await api.get(API_ENDPOINTS.PING);
      return response.data;
    } catch (error) {
      console.error('Ping failed:', error);
      throw error;
    }
  }

  // Legacy v1 API Methods (for backward compatibility during migration)
  
  // Start a new conversation (legacy)
  static async startConversation(request: StartConversationRequest): Promise<ConversationResponse> {
    try {
      const response: ApiResponse<ConversationResponse> = await api.post(
        API_ENDPOINTS.START_CONVERSATION,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }

  // Continue an existing conversation (legacy)
  static async continueConversation(
    conversationId: string,
    request: ContinueConversationRequest
  ): Promise<ConversationResponse> {
    try {
      const response: ApiResponse<ConversationResponse> = await api.post(
        `${API_ENDPOINTS.CONTINUE_CONVERSATION}/${conversationId}/message`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to continue conversation:', error);
      throw error;
    }
  }

  // Get conversation history (legacy)
  static async getConversation(conversationId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await api.get(
        `${API_ENDPOINTS.GET_CONVERSATION}/${conversationId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      throw error;
    }
  }

  // Mark conversation as resolved (legacy)
  static async resolveConversation(conversationId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await api.put(
        `${API_ENDPOINTS.RESOLVE_CONVERSATION}/${conversationId}/resolve`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to resolve conversation:', error);
      throw error;
    }
  }

  // Get conversation summary (legacy)
  static async getConversationSummary(conversationId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await api.get(
        `${API_ENDPOINTS.GET_SUMMARY}/${conversationId}/summary`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get conversation summary:', error);
      throw error;
    }
  }

  // Utility method to convert legacy request to new analysis request
  static convertLegacyRequest(legacyRequest: StartConversationRequest): AnalysisRequest {
    return {
      question: legacyRequest.description,
      // Note: stacktrace and other fields are not part of AnalysisRequest interface
      // They would need to be included in the question text if needed
      userId: 'frontend_user'
    };
  }
}

export const conversationService = new ConversationService();
export default conversationService; 