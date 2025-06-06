// API Request/Response Types for v2
export interface StackTraceFile {
  fileName: string;
  content: string;
  mimeType: string;
}

// New v2 Analysis Request
export interface AnalysisRequest {
  question: string;
  userId?: string;
  requestId?: string;
}

// Legacy v1 types for backward compatibility during migration
export interface StartConversationRequest {
  description: string;
  stackTraces?: string[];
  stackTraceFiles?: StackTraceFile[];
}

export interface ContinueConversationRequest {
  responses: Array<{
    questionId: string;
    answer: string;
  }>;
}

// API Response Wrapper - matches actual API structure
export interface ApiResponseWrapper<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
  timestamp: string;
  version: string;
}

// New v2 Analysis Response - Updated to match actual API structure
export interface AnalysisResponse {
  // === PRIMARY UI FIELDS (Use these for display) ===
  displayMessage: string;
  nextActions: string[];
  thoughtProcess?: string;
  needsEscalation: boolean;
  
  // === LEGACY FIELDS (Deprecated but still present) ===
  summary?: string;
  immediateActions?: string[];
  followUpActions?: string[];
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceExplanation?: string;
  estimatedResolution?: string;
  relatedDocumentation?: string[];
  
  // === METADATA ===
  analysisMetadata: {
    conversationId: string;
    supportsFollowUp: boolean;
    categoryUsed: 'PRODUCT_QUESTION' | 'LOG_ANALYSIS' | 'STACKTRACE_ANALYSIS' | 'PROBLEM_DESCRIPTION';
    workflowMatched?: string;
    codeContextRetrieved: boolean;
    processingTimeMs: number;
    llmCallsMade: number;
  };
  
  requestId: string;
  generatedAt: string;
}

// Quick Analysis Response
export interface QuickAnalysisResponse {
  summary: string;
  confidence: 'MEDIUM' | 'HIGH' | 'LOW';
  category: string;
  escalation_required: boolean;
  first_step: string;
}

// Workflow Search Response
export interface WorkflowSearchResponse {
  query: string;
  matches_found: number;
  workflows: Array<{
    workflow_id: string;
    workflow_name: string;
    similarity: number;
    description: string;
  }>;
}

// Legacy v1 types (keeping for backward compatibility during migration)
export interface ConversationQuestion {
  questionId: string;
  l2Question: string;
  customerTemplate: string;
  answerType: 'text' | 'yes_no' | 'url' | 'number' | 'yes_no_details';
  validationPattern?: string;
  sequence: number;
}

export interface ResolutionPath {
  pathId: string;
  confidence: number;
  rootCause: string;
  solutionSteps: string[];
  triggerConditions: string[];
}

export interface EscalationPackage {
  escalationId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  summary: string;
  technicalDetails: string;
  customerImpact: string;
  attempedSolutions: string[];
  nextSteps: string[];
}

export interface ConversationResponse {
  conversationId: string;
  confidence: number;
  summary: string;
  confidenceExplanation?: string;
  status: 'investigating' | 'diagnosed' | 'escalated';
  questions?: ConversationQuestion[];
  resolution?: ResolutionPath;
  escalationPackage?: EscalationPackage;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  service?: string;
  embedding_service?: {
    embeddings_initialized: boolean;
    total_workflows: number;
    embeddings_generated: number;
  };
  decision_tree_ready?: boolean;
}

// UI State Types
export interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  reasoning?: string; // New field for AI reasoning/thinking
  isHtmlFormatted?: boolean; // New field to indicate HTML content from backend
}

export interface ConversationState {
  conversationId: string | null;
  messages: ChatMessage[];
  currentQuestions: ConversationQuestion[];
  status: 'idle' | 'loading' | 'investigating' | 'diagnosed' | 'escalated';
  confidence: number;
  resolution: ResolutionPath | null;
  escalationPackage: EscalationPackage | null;
  error: string | null;
  // New v2 fields
  currentAnalysis: AnalysisResponse | null;
  immediateActions: string[];
  followUpActions: string[];
}

export interface QuestionResponse {
  questionId: string;
  answer: string;
}

// API Client Types
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Component Props Types
export interface MessageBubbleProps {
  message: ChatMessage;
  suggestions?: Array<{ id: string; text: string; }>;
  actions?: Array<{ id: string; text: string; priority?: string; }>;
}

export interface QuestionCardProps {
  questions: ConversationQuestion[];
  onSubmit: (responses: QuestionResponse[]) => void;
  isLoading: boolean;
}

export interface ConfidenceBarProps {
  confidence: number;
  status: ConversationState['status'];
  explanation?: string;
}

export interface InputAreaProps {
  onSubmit: (data: AnalysisRequest) => void;
  isLoading: boolean;
  isNewChat?: boolean;
  hasIntegratedContent?: boolean;
  hasInteractiveQuestions?: boolean;
}

// Constants
// export type ConnectorType = 'ServiceNow' | 'Zendesk' | 'Freshdesk' | 'Gong' | 'Salesforce' | 'Other';

export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
}

// Follow-up conversation request
export interface FollowUpRequest {
  message: string;
  userId?: string;
}

// Conversation History Types
export interface ConversationTurn {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface ConversationData {
  conversationId: string;
  metadata: {
    conversationId: string;
    userId?: string;
    createdAt: string;
    lastActivity: string;
    turnCount: number;
  };
  history: ConversationTurn[];
}

// Health Check Response
export interface HealthData {
  status: string;
  timestamp: string;
  services: {
    llm: string;
    workflows: string;
    embeddings: string;
    conversations: string;
  };
  conversationStats: {
    total_conversations: number;
    active_conversations: number;
    max_conversations: number;
  };
} 