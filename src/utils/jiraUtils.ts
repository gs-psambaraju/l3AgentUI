import { JIRA_CONFIG } from './constants';
import { DetectedTicket, JiraEnrichmentResult } from '../types';
import JiraService from '../services/jiraService';

/**
 * Extract Jira ticket IDs from text
 */
export function extractJiraTicketIds(text: string): string[] {
  const matches = text.match(JIRA_CONFIG.TICKET_REGEX);
  if (!matches) return [];
  
  // Remove duplicates and limit results
  const uniqueTickets = [...new Set(matches)];
  return uniqueTickets.slice(0, JIRA_CONFIG.MAX_TICKETS_PER_INPUT);
}

/**
 * Check if text contains potential Jira ticket IDs
 */
export function hasJiraTickets(text: string): boolean {
  return JIRA_CONFIG.TICKET_REGEX.test(text);
}

/**
 * Create initial detected tickets with 'detecting' status
 */
export function createDetectedTickets(ticketIds: string[]): DetectedTicket[] {
  return ticketIds.map(ticketId => ({
    ticketId,
    status: 'detecting' as const
  }));
}

/**
 * Enrich text with Jira ticket information
 */
export async function enrichTextWithJiraTickets(
  originalText: string,
  onProgress?: (tickets: DetectedTicket[]) => void
): Promise<JiraEnrichmentResult> {
  const ticketIds = extractJiraTicketIds(originalText);
  
  if (ticketIds.length === 0) {
    return {
      originalText,
      enrichedText: originalText,
      detectedTickets: [],
      hasEnrichment: false
    };
  }

  // Initialize detected tickets
  let detectedTickets = createDetectedTickets(ticketIds);
  onProgress?.(detectedTickets);

  // Update status to loading
  detectedTickets = detectedTickets.map(ticket => ({
    ...ticket,
    status: 'loading' as const
  }));
  onProgress?.(detectedTickets);

  try {
    // Fetch ticket information
    const fetchedTickets = await JiraService.fetchTickets(ticketIds);
    
    // Build enriched text
    const ticketContents = fetchedTickets
      .filter(ticket => ticket.status === 'success' && ticket.ticket)
      .map(ticket => JiraService.formatTicketForAnalysis(ticket.ticket!));

    const enrichedText = ticketContents.length > 0
      ? `${originalText}\n\n=== Related Jira Tickets ===\n${ticketContents.join('\n')}`
      : originalText;

    return {
      originalText,
      enrichedText,
      detectedTickets: fetchedTickets,
      hasEnrichment: ticketContents.length > 0
    };
  } catch (error) {
    // Handle global errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ticket information';
    const errorTickets = detectedTickets.map(ticket => ({
      ...ticket,
      status: 'error' as const,
      error: errorMessage
    }));

    return {
      originalText,
      enrichedText: originalText,
      detectedTickets: errorTickets,
      hasEnrichment: false
    };
  }
}

/**
 * Get summary text for detected tickets
 */
export function getTicketsSummary(detectedTickets: DetectedTicket[]): string {
  const successful = detectedTickets.filter(t => t.status === 'success').length;
  const failed = detectedTickets.filter(t => t.status === 'error').length;
  const loading = detectedTickets.filter(t => t.status === 'loading').length;
  
  if (loading > 0) {
    return `Loading ${loading} ticket${loading > 1 ? 's' : ''}...`;
  }
  
  if (successful === 0 && failed > 0) {
    return `Failed to load ${failed} ticket${failed > 1 ? 's' : ''}`;
  }
  
  if (successful > 0 && failed === 0) {
    return `Loaded ${successful} ticket${successful > 1 ? 's' : ''}`;
  }
  
  if (successful > 0 && failed > 0) {
    return `Loaded ${successful}, failed ${failed}`;
  }
  
  return '';
} 