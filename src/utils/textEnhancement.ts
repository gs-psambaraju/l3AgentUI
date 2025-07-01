import { DetectedTicket } from '../types';
import { JIRA_CONFIG } from './constants';

/**
 * Replace Jira ticket IDs with inline summaries in text
 * Example: "GE-206865" -> "GE-206865 (OAuth authentication failing for mobile app)"
 */
export function enhanceTextWithTicketSummaries(text: string, detectedTickets: DetectedTicket[]): string {
  let enhancedText = text;
  
  // Create a map of ticket ID to summary for quick lookup
  const ticketSummaryMap = new Map<string, string>();
  
  detectedTickets.forEach(ticket => {
    if (ticket.status === 'success' && ticket.ticket?.summary) {
      ticketSummaryMap.set(ticket.ticketId, ticket.ticket.summary);
    }
  });
  
  // Replace ticket IDs with enhanced format
  enhancedText = enhancedText.replace(JIRA_CONFIG.TICKET_REGEX, (match) => {
    const summary = ticketSummaryMap.get(match);
    return summary ? `${match} (${summary})` : match;
  });
  
  return enhancedText;
}

/**
 * Extract original ticket IDs from enhanced text
 * Example: "GE-206865 (OAuth auth failing)" -> "GE-206865"
 */
export function extractOriginalText(enhancedText: string): string {
  // Remove the summary parts in parentheses that follow ticket IDs
  return enhancedText.replace(/\b([A-Z]{2,10}-\d+)\s*\([^)]+\)/g, '$1');
}

/**
 * Check if text has been enhanced with ticket summaries
 */
export function hasEnhancedTickets(text: string): boolean {
  return /\b([A-Z]{2,10}-\d+)\s*\([^)]+\)/.test(text);
} 