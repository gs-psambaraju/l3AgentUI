import React, { useState, useCallback } from 'react';
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
  job?: AnalysisJob; // For progress messages
}

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  error: string | null;
  
  // Response data
  displayMessage: string | null;
  nextActions: string[];
  needsEscalation: boolean;
  thoughtProcess: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  
  // Async job data
  currentJob: AnalysisJob | null;
  isAsyncProcessing: boolean;
}

export function useConversation() {
  const [conversation, setConversation] = useState<ConversationState>({
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
  });

  const [isLoading, setIsLoading] = useState(false);

  // Helper to add messages
  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    
    setConversation(prev => {
      let updatedMessages = [...prev.messages];
      
      // If adding a progress message, remove any existing progress messages first
      if (message.type === 'progress') {
        updatedMessages = updatedMessages.filter(msg => msg.type !== 'progress');
      }
      
      return {
        ...prev,
        messages: [...updatedMessages, newMessage],
      };
    });
    
    return newMessage;
  }, []);

  // Helper to update progress message
  const updateProgressMessage = useCallback((job: AnalysisJob) => {
    setConversation(prev => ({
      ...prev,
      currentJob: job,
      messages: prev.messages.map(msg => 
        msg.type === 'progress' && msg.job?.jobId === job.jobId
          ? { ...msg, job, content: job.progress.currentStep, timestamp: new Date() }
          : msg
      ),
    }));
  }, []);



  // Helper to process API response
  const processResponse = useCallback((response: AnalysisResponse) => {
    const uiFields = conversationService.extractUIFields(response, conversation.conversationId);
    
    // Debug: Log conversation state changes
    console.log('🔄 Processing Response:', {
      currentConversationId: conversation.conversationId,
      newConversationId: uiFields.conversationId,
      isHtmlFormatted: uiFields.isHtmlFormatted,
      hasActiveConversation: !!uiFields.conversationId
    });
    
    // Add bot message with the main response
    addMessage({
      type: 'bot',
      content: uiFields.mainMessage,
      timestamp: new Date(),
      confidence: response.confidence_level === 'HIGH' ? 0.9 : 
                 response.confidence_level === 'MEDIUM' ? 0.7 : 0.5,
      reasoning: uiFields.details,
      isHtmlFormatted: uiFields.isHtmlFormatted,
    });

    // Update conversation state - Always use the conversation ID from uiFields
    setConversation(prev => ({
      ...prev,
      conversationId: uiFields.conversationId,
      status: 'completed',
      error: null,
      displayMessage: uiFields.mainMessage,
      nextActions: uiFields.actions,
      needsEscalation: uiFields.needsEscalation,
      thoughtProcess: uiFields.details,
      confidence: response.confidence_level || null,
    }));
  }, [addMessage, conversation.conversationId]);

  // Main analysis function with async job support
  const analyzeRequest = useCallback(async (request: AnalysisRequest) => {
    try {
      setIsLoading(true);
      setConversation(prev => ({
        ...prev,
        status: 'analyzing',
        error: null,
        currentJob: null,
        isAsyncProcessing: false,
      }));

      // Add user message
      addMessage({
        type: 'user',
        content: request.question,
        timestamp: new Date(),
      });

      // Check if this will be async and add progress message if so
      if (AsyncJobService.shouldUseAsync(request)) {
        console.log('🔄 Starting async analysis');
        
        setConversation(prev => ({ ...prev, isAsyncProcessing: true }));
        
        // Add progress message (automatically clears existing progress messages)
        const progressMessage = addMessage({
          type: 'progress',
          content: 'Starting analysis...',
          timestamp: new Date(),
        });

        // Call async API with progress tracking
        const response = await AsyncJobService.smartAnalyze(
          request,
          // Progress callback
          (job: AnalysisJob) => {
            setConversation(prev => ({ ...prev, currentJob: job }));
            updateProgressMessage(job);
          },
          // Error callback
          (error: Error) => {
            console.error('Async job error:', error);
          }
        );
        
        // Clear async state and process response
        setConversation(prev => ({ 
          ...prev, 
          isAsyncProcessing: false, 
          currentJob: null 
        }));
        
        processResponse(response);
      } else {
        console.log('⚡ Using sync analysis');
        // For sync analysis, call conversationService directly
        const response = await conversationService.analyzeQuestion(request);
        processResponse(response);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      
      setConversation(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAsyncProcessing: false,
        currentJob: null,
      }));
      
      addMessage({
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Analysis failed'}`,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, processResponse, updateProgressMessage]);

  // Follow-up message function with async support
  const sendFollowUp = useCallback(async (message: string) => {
    console.log('🚀 sendFollowUp called with:', {
      message,
      conversationId: conversation.conversationId,
      hasConversationId: !!conversation.conversationId
    });

    if (!conversation.conversationId) {
      console.error('❌ No conversation ID available for follow-up');
      throw new Error('No active conversation for follow-up');
    }

    try {
      setIsLoading(true);
      setConversation(prev => ({
        ...prev,
        status: 'analyzing',
        error: null,
        currentJob: null,
        isAsyncProcessing: false,
      }));

      // Add user message
      addMessage({
        type: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Call follow-up API with smart async logic
      const followUpRequest: FollowUpRequest = {
        message,
        userId: 'frontend_user', // Could be made configurable
      };

      // Create temporary request to check if async is needed
      const tempRequest: AnalysisRequest = {
        question: message,
        user_id: 'frontend_user'
      };

      if (AsyncJobService.shouldUseAsync(tempRequest)) {
        console.log('🔄 Starting async follow-up');
        
        setConversation(prev => ({ ...prev, isAsyncProcessing: true }));
        
        // Add progress message (automatically clears existing progress messages)
        const progressMessage = addMessage({
          type: 'progress',
          content: 'Processing follow-up...',
          timestamp: new Date(),
        });

        // Call async follow-up API with progress tracking
        const response = await AsyncJobService.smartFollowUp(
          conversation.conversationId,
          followUpRequest,
          // Progress callback
          (job: AnalysisJob) => {
            setConversation(prev => ({ ...prev, currentJob: job }));
            updateProgressMessage(job);
          },
          // Error callback
          (error: Error) => {
            console.error('Async follow-up job error:', error);
          }
        );
        
        // Clear async state and process response
        setConversation(prev => ({ 
          ...prev, 
          isAsyncProcessing: false, 
          currentJob: null 
        }));
        
        processResponse(response);
      } else {
        console.log('⚡ Using sync follow-up');
        // For sync follow-up, call AsyncJobService directly (it handles sync internally)
        const response = await AsyncJobService.smartFollowUp(
          conversation.conversationId,
          followUpRequest
        );
        processResponse(response);
      }

    } catch (error) {
      console.error('❌ Follow-up failed:', error);
      
      setConversation(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Follow-up failed',
        isAsyncProcessing: false,
        currentJob: null,
      }));
      
      addMessage({
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Follow-up failed'}`,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversation.conversationId, addMessage, processResponse, updateProgressMessage]);

  // Reset conversation
  const resetConversation = useCallback(async () => {
    // Clean up server-side conversation if exists
    if (conversation.conversationId) {
      try {
        await conversationService.deleteConversation(conversation.conversationId);
      } catch (error) {
        console.warn('Failed to delete conversation:', error);
      }
    }

    // Reset local state
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
    });
    
    setIsLoading(false);
  }, [conversation.conversationId]);

  // Load conversation history (for page refresh scenarios)
  const loadConversationHistory = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      
      const conversationData = await conversationService.getConversationHistory(conversationId);
      
      // Convert history to messages
      const messages: Message[] = conversationData.history.map((turn, index) => ({
        id: `${conversationId}_${index}`,
        type: turn.role === 'user' ? 'user' : 'bot',
        content: turn.message,
        timestamp: new Date(turn.timestamp),
      }));

      setConversation(prev => ({
        ...prev,
        conversationId,
        messages,
        status: 'completed',
      }));

    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setConversation(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load conversation',
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Computed properties
  const hasActiveConversation = conversation.conversationId !== null;
  const canFollowUp = hasActiveConversation && !conversation.needsEscalation;
  const hasActions = conversation.nextActions.length > 0;

  // Debug: Log computed properties
  console.log('🧮 Computed Properties:', {
    conversationId: conversation.conversationId,
    hasActiveConversation,
    canFollowUp,
    hasActions,
    needsEscalation: conversation.needsEscalation,
    messagesCount: conversation.messages.length
  });

  return {
    // State
    conversation,
    isLoading,
    
    // Actions
    analyzeRequest,
    sendFollowUp,
    resetConversation,
    loadConversationHistory,
    
    // Computed properties
    hasActiveConversation,
    canFollowUp,
    hasActions,
    
    // Legacy compatibility (for existing components)
    hasQuestions: false, // v2.0 doesn't use interactive questions
    hasResolution: conversation.status === 'completed' && !conversation.needsEscalation,
    isEscalated: conversation.needsEscalation,
  };
} 