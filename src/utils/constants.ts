export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/l3agent';

export const API_ENDPOINTS = {
  // v2.0 Main Analysis endpoints
  ANALYZE: '/api/v1/analyze',
  ANALYZE_ASYNC: '/api/v1/analyze-async',
  
  // v2.0 Job Management endpoints (NEW)
  JOB_STATUS: '/api/v1/jobs', // /{jobId}/status
  JOB_RESULT: '/api/v1/jobs', // /{jobId}/result
  JOB_STATS: '/api/v1/jobs/stats',
  
  // v2.0 Conversation endpoints
  CONVERSATION_MESSAGE: '/api/v1/conversation',
  CONVERSATION_MESSAGE_ASYNC: '/api/v1/conversation', // /{conversationId}/message-async
  CONVERSATION_HISTORY: '/api/v1/conversation',
  CONVERSATION_DELETE: '/api/v1/conversation',
  
  // v2.0 Utility endpoints
  QUICK_ANALYZE: '/api/v1/quick-analyze',
  SEARCH_WORKFLOWS: '/api/v1/search-workflows',
  HEALTH: '/api/v1/health',
  STATUS: '/api/v1/status',
  PING: '/api/v1/ping',
  
  // Legacy v1 endpoints (deprecated but kept for compatibility)
  LEGACY_ANALYZE: '/api/v1/analyze',
  START_CONVERSATION: '/api/v1/conversations',
  CONTINUE_CONVERSATION: '/api/v1/conversations',
  GET_CONVERSATION: '/api/v1/conversations',
  RESOLVE_CONVERSATION: '/api/v1/conversations',
  GET_SUMMARY: '/api/v1/conversations',
  ANALYZE_CSV: '/api/v1/historical/analyze-csv'
};

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'L3 Agent',
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  apiTimeout: 30000,
  healthCheckInterval: 30000,
  // New async job configuration
  asyncJobConfig: {
    maxConcurrentJobs: 5,
    pollInterval: 1500, // 1.5 seconds for better responsiveness
    maxPollAttempts: 200, // 5 minutes max (200 * 1.5 seconds)
    timeoutMs: 300000, // 5 minutes
  },
};

// Removed CONNECTOR_TYPES - no longer used in the new API structure
// export const CONNECTOR_TYPES = [
//   'ServiceNow',
//   'Zendesk', 
//   'Freshdesk',
//   'Gong',
//   'Salesforce',
//   'Other'
// ] as const;

export const MESSAGE_TYPES = {
  BOT: 'bot',
  USER: 'user',
  SYSTEM: 'system'
} as const;

export const CONVERSATION_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  INVESTIGATING: 'investigating',
  DIAGNOSED: 'diagnosed',
  ESCALATED: 'escalated'
} as const;

export const ANSWER_TYPES = {
  TEXT: 'text',
  YES_NO: 'yes_no',
  URL: 'url',
  NUMBER: 'number',
  YES_NO_DETAILS: 'yes_no_details'
} as const;

export const CONFIDENCE_LEVELS = {
  LOW: { threshold: 0.5, color: 'red', label: 'Low Confidence' },
  MEDIUM: { threshold: 0.75, color: 'yellow', label: 'Medium Confidence' },
  HIGH: { threshold: 1.0, color: 'green', label: 'High Confidence' }
};

export const UI_MESSAGES = {
  WELCOME: 'Welcome to L3 Agent! Paste your stack trace or error details to get intelligent troubleshooting assistance.',
  ANALYZING: 'Analyzing your error...',
  GENERATING_QUESTIONS: 'Generating diagnostic questions...',
  PROCESSING_RESPONSES: 'Processing your responses...',
  RESOLUTION_FOUND: 'Resolution found! Follow the steps below to resolve this issue.',
  ESCALATED: 'This issue has been escalated to L3 engineering. An escalation package has been created.',
  API_ERROR: 'Sorry, there was an error connecting to the service. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NEW_CONVERSATION: 'Starting a new conversation...'
};

export const STORAGE_KEYS = {
  CONVERSATION_HISTORY: 'l3-agent-conversation-history',
  USER_PREFERENCES: 'l3-agent-user-preferences',
  LAST_CONVERSATION: 'l3-agent-last-conversation'
}; 