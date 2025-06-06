import * as React from 'react';
import { ConversationState, ChatMessage, ConversationQuestion, ResolutionPath, EscalationPackage, AnalysisResponse, AnalysisJob } from '../types';
import { CONVERSATION_STATUS, MESSAGE_TYPES } from '../utils/constants';

// Enhanced initial state with async job support
const initialState: ConversationState = {
  conversationId: null,
  messages: [],
  currentQuestions: [],
  status: 'idle',
  confidence: 0,
  resolution: null,
  escalationPackage: null,
  error: null,
  // New v2 fields
  currentAnalysis: null,
  immediateActions: [],
  followUpActions: [],
  // NEW: Async job fields
  currentJob: null,
  isAsyncProcessing: false,
};

// Enhanced action types with async job actions
type ConversationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_CONVERSATION'; payload: { conversationId: string; confidence: number; summary: string } }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_QUESTIONS'; payload: ConversationQuestion[] }
  | { type: 'SET_RESOLUTION'; payload: ResolutionPath }
  | { type: 'SET_ESCALATION'; payload: EscalationPackage }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: ConversationState['status'] }
  | { type: 'SET_CONFIDENCE'; payload: number }
  | { type: 'RESET_CONVERSATION' }
  | { type: 'CLEAR_QUESTIONS' }
  | { type: 'SET_ANALYSIS'; payload: AnalysisResponse }
  // NEW: Async job actions
  | { type: 'START_ASYNC_JOB'; payload: AnalysisJob }
  | { type: 'UPDATE_JOB_PROGRESS'; payload: AnalysisJob }
  | { type: 'COMPLETE_ASYNC_JOB'; payload: { job: AnalysisJob; result: AnalysisResponse } }
  | { type: 'FAIL_ASYNC_JOB'; payload: { job: AnalysisJob; error: string } };

// Reducer function
function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        status: action.payload ? 'loading' : 'idle',
      };

    case 'START_CONVERSATION':
      return {
        ...state,
        conversationId: action.payload.conversationId,
        confidence: action.payload.confidence,
        status: 'investigating',
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: 'system',
            content: action.payload.summary,
            timestamp: new Date(),
            confidence: action.payload.confidence,
          },
        ],
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_QUESTIONS':
      return {
        ...state,
        currentQuestions: action.payload,
        status: 'investigating',
      };

    case 'SET_RESOLUTION':
      return {
        ...state,
        resolution: action.payload,
        status: 'diagnosed',
        currentQuestions: [],
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: 'bot',
            content: `Resolution found: ${action.payload.rootCause}`,
            timestamp: new Date(),
          },
        ],
      };

    case 'SET_ESCALATION':
      return {
        ...state,
        escalationPackage: action.payload,
        status: 'escalated',
        currentQuestions: [],
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            type: 'system',
            content: `Issue escalated: ${action.payload.summary}`,
            timestamp: new Date(),
          },
        ],
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        status: action.payload ? 'idle' : state.status,
      };

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      };

    case 'SET_CONFIDENCE':
      return {
        ...state,
        confidence: action.payload,
      };

    case 'CLEAR_QUESTIONS':
      return {
        ...state,
        currentQuestions: [],
      };

    case 'SET_ANALYSIS':
      return {
        ...state,
        currentAnalysis: action.payload,
        immediateActions: action.payload.immediate_actions || [],
        followUpActions: action.payload.follow_up_actions || [],
        conversationId: action.payload.analysis_metadata?.conversationId || action.payload.request_id, // Use conversationId from metadata
        status: 'investigating',
      };

    case 'RESET_CONVERSATION':
      return {
        ...initialState,
        messages: [
          {
            id: Date.now().toString(),
            type: 'system',
            content: 'Starting a new conversation...',
            timestamp: new Date(),
          },
        ],
      };

    case 'START_ASYNC_JOB':
      return {
        ...state,
        currentJob: action.payload,
        isAsyncProcessing: true,
      };

    case 'UPDATE_JOB_PROGRESS':
      return {
        ...state,
        currentJob: action.payload,
      };

    case 'COMPLETE_ASYNC_JOB':
      return {
        ...state,
        currentJob: null,
        isAsyncProcessing: false,
        currentAnalysis: action.payload.result,
        immediateActions: action.payload.result.immediate_actions || [],
        followUpActions: action.payload.result.follow_up_actions || [],
        conversationId: action.payload.result.analysis_metadata?.conversationId || action.payload.result.request_id,
        status: 'investigating',
      };

    case 'FAIL_ASYNC_JOB':
      return {
        ...state,
        currentJob: null,
        isAsyncProcessing: false,
        error: action.payload.error,
        status: 'idle',
      };

    default:
      return state;
  }
}

// Context type
interface ConversationContextType {
  state: ConversationState;
  dispatch: React.Dispatch<ConversationAction>;
  // Helper functions
  addMessage: (type: ChatMessage['type'], content: string, confidence?: number, reasoning?: string) => void;
  resetConversation: () => void;
  setError: (error: string | null) => void;
}

// Create context
const ConversationContext = React.createContext<ConversationContextType | undefined>(undefined);

// Provider component
interface ConversationProviderProps {
  children?: React.ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [state, dispatch] = React.useReducer(conversationReducer, initialState);

  // Helper function to add messages with optional reasoning
  const addMessage = (type: ChatMessage['type'], content: string, confidence?: number, reasoning?: string) => {
    const message: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      confidence,
      reasoning, // New field for AI reasoning/thinking
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  // Helper function to reset conversation
  const resetConversation = () => {
    dispatch({ type: 'RESET_CONVERSATION' });
  };

  // Helper function to set error
  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const value: ConversationContextType = {
    state,
    dispatch,
    addMessage,
    resetConversation,
    setError,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

// Custom hook to use the conversation context
export function useConversationContext() {
  const context = React.useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
} 