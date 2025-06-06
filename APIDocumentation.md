# L3Agent API v2 Documentation

## Overview
L3Agent v2 provides intelligent technical support analysis using workflow-based pattern matching and LLM integration. This version replaces the conversation-based approach with direct analysis for faster resolution.

**Base URL**: `http://localhost:8080`
**API Version**: v2
**Content-Type**: `application/json`

## 🔄 Migration from v1 to v2

### Key Changes
- **Single Analysis Call**: No more multi-turn conversations - get immediate analysis
- **Workflow-Based**: Uses comprehensive YAML workflows derived from historical tickets
- **Enhanced Context**: Supports stacktraces, logs, and code snippets in one request
- **Semantic Search**: Built-in workflow matching using embeddings
- **Simplified Integration**: Fewer API calls needed for complete analysis

### URL Changes
```diff
- POST /api/v1/conversations
- POST /api/v1/conversations/{id}/message
- GET  /api/v1/conversations/{id}
+ POST /l3agent/api/v1/analyze
+ POST /l3agent/api/v1/quick-analyze
+ POST /l3agent/api/v1/search-workflows
```

## 🚀 Core Endpoints

### 1. Main Analysis Endpoint
**POST** `/l3agent/api/v1/analyze`

Comprehensive analysis endpoint that handles all question types with immediate results.

**Request Body:**
```json
{
  "request_id": "req_12345678",
  "question": "Getting NullPointerException in ServiceNow connector during OAuth authentication",
  "stacktrace": "java.lang.NullPointerException\n\tat com.gainsight.integrations.servicenow.ServicenowConnectionService.updateConnection(ServicenowConnectionService.java:89)",
  "logs": [
    "2025-01-24 10:30:15 ERROR [ServiceNow-OAuth] Failed to authenticate: null credential",
    "2025-01-24 10:30:15 DEBUG [ServiceNow-OAuth] Attempting OAuth with instance: company.service-now.com"
  ],
  "code_snippets": [
    "if (oauthCredential == null) {\n    throw new NullPointerException(\"OAuth credential is null\");\n}"
  ],
  "user_id": "l2_agent_001"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_id` | string | No | Unique request identifier (auto-generated if not provided) |
| `question` | string | Yes | The technical question or issue description |
| `stacktrace` | string | No | Full stack trace if available |
| `logs` | array[string] | No | Relevant log entries |
| `code_snippets` | array[string] | No | Related code snippets |
| `user_id` | string | No | Identifier for the requesting user |

**Response:**
```json
{
  "request_id": "req_12345678",
  "summary": "ServiceNow OAuth Credential NPE - Missing IPAAS_PROPERTIES configuration causing null credential during connection update",
  "immediate_actions": [
    "Verify IPAAS_PROPERTIES table contains ServiceNow connection configuration",
    "Check if OAuth Client ID and Secret are properly stored in encrypted format",
    "Validate connection parameters in gs-integrations database",
    "Test OAuth flow with curl to verify ServiceNow instance accessibility"
  ],
  "follow_up_actions": [
    "Monitor connection logs for recurring authentication failures",
    "Consider implementing connection validation before OAuth attempts",
    "Update error handling to provide more descriptive messages"
  ],
  "escalation_criteria": {
    "escalate_if": "OAuth credentials are confirmed valid but authentication still fails after 3 attempts",
    "escalate_to": "ENGINEERING",
    "escalation_priority": "MEDIUM"
  },
  "confidence_level": "HIGH",
  "confidence_explanation": "Exact match found in ServiceNow Connection Management workflow with identical stack trace pattern",
  "estimated_resolution": "15-30 minutes",
  "related_documentation": [
    "ServiceNow OAuth Setup Guide",
    "IPAAS_PROPERTIES Configuration Reference",
    "Connection Troubleshooting Playbook"
  ],
  "generated_at": "2025-01-24T10:35:22.123Z",
  "analysis_metadata": {
    "category_used": "STACKTRACE_ANALYSIS",
    "workflow_matched": "servicenow-connection-management",
    "code_context_retrieved": true,
    "processing_time_ms": 1250,
    "llm_calls_made": 2
  }
}
```

### 2. Quick Analysis Endpoint
**POST** `/l3agent/api/v1/quick-analyze`

Simplified endpoint for basic question analysis with minimal response.

**Request Body:**
```json
{
  "question": "ServiceNow connection failing with OAuth error"
}
```

**Response:**
```json
{
  "summary": "ServiceNow OAuth authentication failure - likely credential or configuration issue",
  "confidence": "MEDIUM",
  "category": "GENERAL_QUESTION",
  "escalation_required": false,
  "first_step": "Verify OAuth Client ID and Secret are correctly configured in ServiceNow"
}
```

### 3. Workflow Search Endpoint
**POST** `/l3agent/api/v1/search-workflows`

Semantic search across the workflow knowledge base.

**Request Body:**
```json
{
  "query": "OAuth authentication failure ServiceNow",
  "max_results": 5
}
```

**Response:**
```json
{
  "query": "OAuth authentication failure ServiceNow",
  "matches_found": 3,
  "workflows": [
    {
      "workflow_id": "servicenow-connection-management",
      "workflow_name": "ServiceNow Connection Management",
      "similarity": 0.892,
      "description": "Complete workflow for ServiceNow connection setup, OAuth authentication, and troubleshooting"
    },
    {
      "workflow_id": "servicenow-oauth-migration",
      "workflow_name": "ServiceNow OAuth Application Migration",
      "similarity": 0.756,
      "description": "Workflow for migrating ServiceNow OAuth applications and handling authentication issues"
    },
    {
      "workflow_id": "general-oauth-troubleshooting",
      "workflow_name": "General OAuth Troubleshooting",
      "similarity": 0.643,
      "description": "Common OAuth authentication issues across all connector types"
    }
  ]
}
```

## 🔍 System Health Endpoints

### Health Check
**GET** `/l3agent/api/v1/health`

Basic health check with service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T10:35:22.123Z",
  "service": "L3Agent Analysis Service",
  "version": "2.0.0",
  "embedding_service": {
    "embeddings_initialized": true,
    "total_workflows": 25,
    "embeddings_generated": 847
  },
  "decision_tree_ready": true
}
```

### Detailed Status
**GET** `/l3agent/api/v1/status`

Comprehensive system status and statistics.

**Response:**
```json
{
  "timestamp": "2025-01-24T10:35:22.123Z",
  "uptime_ms": 3600000,
  "workflows_loaded": 25,
  "embeddings_generated": 847,
  "embedding_service_ready": true,
  "memory": {
    "total_mb": 2048,
    "free_mb": 512,
    "used_mb": 1536,
    "max_mb": 4096
  },
  "capabilities": {
    "stacktrace_analysis": true,
    "log_pattern_matching": true,
    "semantic_search": true,
    "workflow_matching": true
  }
}
```

### Ping
**GET** `/l3agent/api/v1/ping`

Simple connectivity test.

**Response:**
```json
{
  "message": "pong",
  "timestamp": "2025-01-24T10:35:22.123Z"
}
```

## 📊 Data Models

### AnalysisRequest
```json
{
  "request_id": "string",           // Auto-generated if not provided
  "question": "string",             // Required: The technical question
  "stacktrace": "string",           // Optional: Stack trace
  "logs": ["string"],               // Optional: Log entries
  "code_snippets": ["string"],      // Optional: Code snippets
  "user_id": "string",              // Optional: User identifier
  "created_at": "ISO8601"           // Auto-generated timestamp
}
```

### AnalysisResponse
```json
{
  "request_id": "string",
  "summary": "string",              // Analysis summary
  "immediate_actions": ["string"],  // Immediate steps to take
  "follow_up_actions": ["string"],  // Follow-up actions
  "escalation_criteria": {          // When and how to escalate
    "escalate_if": "string",
    "escalate_to": "ENGINEERING|PRODUCT|CUSTOMER_SUCCESS",
    "escalation_priority": "LOW|MEDIUM|HIGH"
  },
  "confidence_level": "HIGH|MEDIUM|LOW",
  "confidence_explanation": "string",
  "estimated_resolution": "string",
  "related_documentation": ["string"],
  "generated_at": "ISO8601",
  "analysis_metadata": {
    "category_used": "STACKTRACE_ANALYSIS|LOG_ANALYSIS|GENERAL_QUESTION",
    "workflow_matched": "string",
    "code_context_retrieved": "boolean",
    "processing_time_ms": "number",
    "llm_calls_made": "number"
  }
}
```

## 🔧 Error Handling

### HTTP Status Codes
- `200 OK`: Successful analysis
- `400 Bad Request`: Invalid request format or missing required fields
- `500 Internal Server Error`: Server processing error

### Error Response Format
```json
{
  "request_id": "req_12345678",
  "summary": null,
  "immediate_actions": null,
  "follow_up_actions": null,
  "escalation_criteria": {
    "escalate_if": "Analysis failed due to system error",
    "escalate_to": "ENGINEERING",
    "escalation_priority": "HIGH"
  },
  "confidence_level": "LOW",
  "confidence_explanation": "Analysis failed: Invalid stack trace format",
  "estimated_resolution": null,
  "related_documentation": null,
  "generated_at": "2025-01-24T10:35:22.123Z",
  "analysis_metadata": {
    "category_used": null,
    "workflow_matched": null,
    "code_context_retrieved": false,
    "processing_time_ms": 150,
    "llm_calls_made": 0
  }
}
```

## 🚀 Usage Examples

### Basic Analysis
```bash
curl -X POST http://localhost:8080/l3agent/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "ServiceNow sync failing with timeout error",
    "logs": ["2025-01-24 10:30:15 ERROR [ServiceNow] Connection timeout after 30s"]
  }'
```

### Stacktrace Analysis
```bash
curl -X POST http://localhost:8080/l3agent/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Getting NPE in ServiceNow connector",
    "stacktrace": "java.lang.NullPointerException\n\tat com.gainsight.integrations.servicenow.ServicenowConnectionService.updateConnection(ServicenowConnectionService.java:89)"
  }'
```

### Quick Analysis
```bash
curl -X POST http://localhost:8080/l3agent/api/v1/quick-analyze \
  -H "Content-Type: application/json" \
  -d '{"question": "Zendesk widget not loading"}'
```

### Workflow Search
```bash
curl -X POST http://localhost:8080/l3agent/api/v1/search-workflows \
  -H "Content-Type: application/json" \
  -d '{"query": "OAuth token refresh", "max_results": 3}'
```

## 🔄 Migration Guide from v1

### 1. Replace Conversation Flow
**Old v1 Approach:**
```javascript
// Start conversation
const conversation = await fetch('/api/v1/conversations', {
  method: 'POST',
  body: JSON.stringify({
    stackTrace: error.stackTrace,
    errorDescription: error.description,
    connectorType: 'ServiceNow'
  })
});

// Continue conversation
const response = await fetch(`/api/v1/conversations/${conversationId}/message`, {
  method: 'POST',
  body: JSON.stringify({
    responses: [
      {questionId: 'q1', answer: 'company.service-now.com'},
      {questionId: 'q2', answer: 'yes'}
    ]
  })
});
```

**New v2 Approach:**
```javascript
// Single analysis call
const analysis = await fetch('/l3agent/api/v1/analyze', {
  method: 'POST',
  body: JSON.stringify({
    question: error.description,
    stacktrace: error.stackTrace,
    logs: error.logs
  })
});
```

### 2. Update Response Handling
**Old v1 Response:**
```javascript
if (response.status === 'investigating') {
  // Show questions to user
  displayQuestions(response.questions);
} else if (response.status === 'diagnosed') {
  // Show resolution
  displayResolution(response.resolution);
}
```

**New v2 Response:**
```javascript
// Immediate analysis results
displaySummary(analysis.summary);
displayActions(analysis.immediate_actions);

if (analysis.escalation_criteria) {
  showEscalationGuidance(analysis.escalation_criteria);
}
```

### 3. Update Error Handling
**Old v1:**
```javascript
if (response.error) {
  handleError(response.error);
}
```

**New v2:**
```javascript
if (analysis.confidence_level === 'LOW' || !analysis.summary) {
  handleLowConfidence(analysis);
}
```

## 🔒 Security & Configuration

### CORS
The API includes CORS headers allowing cross-origin requests:
```java
@CrossOrigin(origins = "*")
```

### Rate Limiting
Currently no rate limiting implemented. Consider adding for production.

### Authentication
No authentication required currently. Consider adding for production deployment.

## 🎯 UI Integration Best Practices

### 1. Single Analysis Call
- Make one API call to `/analyze` instead of multiple conversation turns
- Handle immediate results without state management complexity

### 2. Progressive Enhancement
- Start with `quick-analyze` for simple cases
- Use full `analyze` for complex technical issues
- Implement `search-workflows` for additional context

### 3. Confidence-Based UI
```javascript
switch (analysis.confidence_level) {
  case 'HIGH':
    showConfidentResults(analysis);
    break;
  case 'MEDIUM':
    showResultsWithCaveats(analysis);
    break;
  case 'LOW':
    showSearchAlternatives(analysis);
    break;
}
```

### 4. Action-Oriented Display
```javascript
// Immediate actions (primary)
displayPrimaryActions(analysis.immediate_actions);

// Follow-up actions (secondary)
displaySecondaryActions(analysis.follow_up_actions);

// Escalation guidance (if needed)
if (analysis.escalation_criteria) {
  displayEscalationPath(analysis.escalation_criteria);
}
```

### 5. Metadata Utilization
```javascript
// Show processing insights
displayProcessingTime(analysis.analysis_metadata.processing_time_ms);
displayWorkflowUsed(analysis.analysis_metadata.workflow_matched);
displayCategory(analysis.analysis_metadata.category_used);
```

---

**API Version**: 2.0.0  
**Last Updated**: January 24, 2025  
**Migration Support**: Contact engineering team for migration assistance 