// API Request/Response Types for v2
export interface StackTraceFile {
  fileName: string;
  content: string;
  mimeType: string;
}

// Enhanced v2 Analysis Request - matches new API
export interface AnalysisRequest {
  request_id?: string;
  question: string;
  stacktrace?: string;
  logs?: string[];
  code_snippets?: string[];
  user_id?: string;
  created_at?: string;
}

// NEW: Async Job Types for v2
export interface JobProgress {
  currentStep: string;
  stepMessage?: string;
  completionPercentage: number;
  currentStepIndex: number;
  totalSteps: number;
  completedSteps?: string[];
  stepsCompleted?: number;
}

export interface AnalysisJob {
  jobId: string;
  status: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  progress: JobProgress;
  createdAt: string;
  updatedAt: string;
  estimatedTimeRemaining?: string;
  estimatedCompletionTime?: string;
  statusUrl?: string;
  resultUrl?: string;
  errorMessage?: string;
}

export interface AsyncJobResponse {
  success: boolean;
  data?: AnalysisJob;
  error?: string;
  timestamp: string;
  version: string;
}

export interface JobStatsResponse {
  success: boolean;
  data?: {
    active_jobs: number;
    total_created: number;
    total_completed: number;
    total_failed: number;
    total_timed_out: number;
    success_rate: number;
    user_job_counts: Record<string, number>;
  };
  error?: string;
  timestamp: string;
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
  requestId?: string;
  timestamp: string;
  version?: string;
}

// Enhanced v2 Analysis Response - Updated to match new API structure
export interface AnalysisResponse {
  request_id: string;
  summary: string;
  immediate_actions: string[];
  follow_up_actions: string[];
  escalation_criteria: {
    escalate_if: string;
    escalate_to: 'ENGINEERING' | 'PRODUCT' | 'CUSTOMER_SUCCESS';
    escalation_priority: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_explanation: string;
  estimated_resolution: string;
  related_documentation: string[];
  generated_at: string;
  analysis_metadata: {
    category_used: 'STACKTRACE_ANALYSIS' | 'LOG_ANALYSIS' | 'GENERAL_QUESTION';
    workflow_matched?: string;
    code_context_retrieved: boolean;
    processing_time_ms: number;
    llm_calls_made: number;
    files_loaded?: string[];
    conversationId?: string;
    supportsFollowUp?: boolean;
  };
  
  // Legacy UI fields for backward compatibility
  displayMessage?: string;
  nextActions?: string[];
  thoughtProcess?: string;
  needsEscalation?: boolean;
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
  type: 'bot' | 'user' | 'system' | 'progress';
  content: string;
  timestamp: Date;
  confidence?: number;
  reasoning?: string; // New field for AI reasoning/thinking
  isHtmlFormatted?: boolean; // New field to indicate HTML content from backend
  job?: AnalysisJob; // For progress messages
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
  // NEW: Async job fields
  currentJob: AnalysisJob | null;
  isAsyncProcessing: boolean;
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

// Jira Integration Types
export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  reporter?: string;
  created: string;
  updated: string;
  url?: string;
}

export interface DetectedTicket {
  ticketId: string;
  status: 'detecting' | 'loading' | 'success' | 'error';
  ticket?: JiraTicket;
  error?: string;
}

export interface JiraEnrichmentResult {
  originalText: string;
  enrichedText: string;
  detectedTickets: DetectedTicket[];
  hasEnrichment: boolean;
} 