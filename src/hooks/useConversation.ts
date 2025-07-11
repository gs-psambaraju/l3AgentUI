import React from 'react';
import { conversationService } from '../services/conversationService';
import { AsyncJobService } from '../services/asyncJobService';
import { AnalysisRequest, FollowUpRequest, AnalysisResponse, AnalysisJob } from '../types';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system' | 'progress';
  content: string;
  timestamp: Date;
  confidence?: number;
  reasoning?: string;
  isHtmlFormatted?: boolean;
  job?: AnalysisJob;
}

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  error: string | null;
  displayMessage: string | null;
  nextActions: string[];
  needsEscalation: boolean;
  thoughtProcess: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  currentJob: AnalysisJob | null;
  isAsyncProcessing: boolean;
  activeJobId: string | null;
}

export function useConversation() {
  const [conversation, setConversation] = React.useState<ConversationState>({
    conversationId: null,
    messages: [],
    status: 'idle',
    error: null,
    displayMessage: null,
    nextActions: [],
    needsEscalation: false,
    thoughtProcess: null,
    confidence: null,
    currentJob: null,
    isAsyncProcessing: false,
    activeJobId: null,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  
  // Add a ref to track if an analysis is already in progress
  const analysisInProgress = React.useRef(false);

  // Simple progress update 
  const addOrUpdateProgress = React.useCallback((job: AnalysisJob) => {
    console.log('🔄 Progress Update:', job.jobId, job.progress?.currentStep);
    
    setConversation(prev => {
      const existingIndex = prev.messages.findIndex(msg => 
        msg.type === 'progress' && msg.job?.jobId === job.jobId
      );
      
      if (existingIndex >= 0) {
        // Update existing progress message
        const updatedMessages = [...prev.messages];
        updatedMessages[existingIndex] = {
          ...updatedMessages[existingIndex],
          job,
          content: job.progress?.currentStep || 'Processing...',
        };
        return { ...prev, messages: updatedMessages, currentJob: job };
      } else {
        // Add new progress message
        const progressMessage = {
          id: Date.now().toString() + '_progress',
          type: 'progress' as const,
          content: job.progress?.currentStep || 'Processing...',
          timestamp: new Date(),
          job
        };
        return { 
          ...prev, 
          messages: [...prev.messages, progressMessage],
          currentJob: job,
          activeJobId: job.jobId
        };
      }
    });
  }, []);

  // Helper to process API response
  const processResponse = React.useCallback((response: AnalysisResponse, currentConversationId: string | null) => {
    const uiFields = conversationService.extractUIFields(response, currentConversationId);
    
    console.log('🔄 Processing Response');
    
    // Add bot response
    const botMessage = {
      id: Date.now().toString() + '_bot',
      type: 'bot' as const,
      content: uiFields.mainMessage,
      timestamp: new Date(),
      confidence: response.confidence_level === 'HIGH' ? 0.9 : 
                 response.confidence_level === 'MEDIUM' ? 0.7 : 0.5,
      reasoning: uiFields.details,
      isHtmlFormatted: uiFields.isHtmlFormatted,
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, botMessage],
      conversationId: uiFields.conversationId,
      status: 'completed' as const,
      error: null,
      displayMessage: uiFields.mainMessage,
      nextActions: uiFields.actions,
      needsEscalation: uiFields.needsEscalation,
      thoughtProcess: uiFields.details,
      confidence: response.confidence_level || null,
      isAsyncProcessing: false,
      currentJob: null,
      activeJobId: null,
    }));
  }, []);

  const analyzeRequest = React.useCallback(async (request: AnalysisRequest) => {
    // Prevent duplicate calls
    if (analysisInProgress.current) {
      console.log('🚫 Analysis already in progress, skipping duplicate call');
      return;
    }
    
    try {
      analysisInProgress.current = true;
      console.log('🔍 Starting analysis:', request.question);
      setIsLoading(true);
      
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: request.question,
        timestamp: new Date(),
      };
      
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        status: 'analyzing' as const,
        error: null,
      }));

      // Capture current conversationId
      let currentConversationId: string | null = null;
      setConversation(prev => {
        currentConversationId = prev.conversationId;
        return prev;
      });

      // Check if this is an enhanced request with files
      const hasFiles = (request as any).uploadedFiles && (request as any).uploadedFiles.length > 0;
      
      if (hasFiles) {
        // Use EnhancedAnalysisService for file uploads
        console.log('📁 Using EnhancedAnalysisService for file uploads');
        const { EnhancedAnalysisService } = await import('../services/enhancedAnalysisService');
        
        const enhancedRequest = {
          ...request,
          uploadedFiles: (request as any).uploadedFiles
        };
        
        const response = await EnhancedAnalysisService.submitAnalysis(
          enhancedRequest,
          addOrUpdateProgress,
          (error: Error) => console.error('Job error:', error)
        );
        
        processResponse(response, currentConversationId);
      } else {
        // Use regular AsyncJobService for text-only requests
        if (AsyncJobService.shouldUseAsync(request)) {
          console.log('🔄 Starting async analysis');
          
          setConversation(prev => ({ ...prev, isAsyncProcessing: true }));
          
          const initialJob = await AsyncJobService.startAsyncAnalysis(request);
          if (!initialJob?.jobId) throw new Error('Invalid job data');
          
          // Add initial progress
          addOrUpdateProgress(initialJob);
          
          // Poll for completion
          const response = await AsyncJobService.pollForCompletion(
            initialJob.jobId,
            addOrUpdateProgress,
            (error: Error) => console.error('Job error:', error)
          );
          
          processResponse(response, currentConversationId);
        } else {
          console.log('⚡ Using sync analysis');
          const response = await conversationService.analyzeQuestion(request);
          processResponse(response, currentConversationId);
        }
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      
      const errorMessage = {
        id: Date.now().toString() + '_error',
        type: 'system' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Analysis failed'}`,
        timestamp: new Date(),
      };
      
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAsyncProcessing: false,
        currentJob: null,
        activeJobId: null,
      }));
    } finally {
      analysisInProgress.current = false;
      setIsLoading(false);
    }
  }, [processResponse, addOrUpdateProgress]);

  const sendFollowUp = React.useCallback(async (message: string) => {
    // Get current conversationId from state instead of closure
    const currentConversationId = conversation.conversationId;
    
    if (!currentConversationId) {
      throw new Error('No active conversation for follow-up');
    }

    try {
      setIsLoading(true);
      
      const userMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: message,
        timestamp: new Date(),
      };
      
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        status: 'analyzing' as const,
        error: null,
      }));

      const followUpRequest: FollowUpRequest = { message, userId: 'frontend_user' };
      
      // Use sync follow-up for stability
      console.log('⚡ Using sync follow-up');
      const response = await AsyncJobService.smartFollowUp(currentConversationId, followUpRequest);
      processResponse(response, currentConversationId);

    } catch (error) {
      console.error('❌ Follow-up failed:', error);
      
      const errorMessage = {
        id: Date.now().toString() + '_error',
        type: 'system' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Follow-up failed'}`,
        timestamp: new Date(),
      };
      
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Follow-up failed',
      }));
    } finally {
      setIsLoading(false);
    }
  }, [processResponse]);

  const resetConversation = React.useCallback(async () => {
    const currentConversationId = conversation.conversationId;
    
    if (currentConversationId) {
      try {
        await conversationService.deleteConversation(currentConversationId);
      } catch (error) {
        console.warn('Failed to delete conversation:', error);
      }
    }

    console.log('🔄 Reset conversation');
    setConversation({
      conversationId: null,
      messages: [],
      status: 'idle',
      error: null,
      displayMessage: null,
      nextActions: [],
      needsEscalation: false,
      thoughtProcess: null,
      confidence: null,
      currentJob: null,
      isAsyncProcessing: false,
      activeJobId: null,
    });
    setIsLoading(false);
  }, []);

  return {
    conversation,
    analyzeRequest,
    sendFollowUp,
    resetConversation,
    isLoading,
    hasActiveConversation: Boolean(conversation.conversationId),
    canFollowUp: Boolean(conversation.conversationId) && !conversation.needsEscalation,
    hasActions: conversation.nextActions.length > 0,
    hasResolution: conversation.status === 'completed' && !conversation.needsEscalation,
    isEscalated: conversation.needsEscalation,
  };
} 