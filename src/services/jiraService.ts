import { JiraTicket, DetectedTicket } from '../types';
import { JIRA_CONFIG } from '../utils/constants';

class JiraService {
  private static instance: JiraService;
  
  public static getInstance(): JiraService {
    if (!JiraService.instance) {
      JiraService.instance = new JiraService();
    }
    return JiraService.instance;
  }

  /**
   * Fetch Jira ticket information from backend API
   */
  async fetchTicket(ticketId: string): Promise<JiraTicket> {
    try {
      const response = await fetch(`http://localhost:8080/l3agent/api/v1/jira/ticket/${ticketId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(JIRA_CONFIG.TICKET_FETCH_TIMEOUT),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Ticket ${ticketId} not found`);
        } else if (response.status === 403) {
          throw new Error(`Access denied for ticket ${ticketId}`);
        } else {
          throw new Error(`Failed to fetch ticket ${ticketId}: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Transform backend response to our JiraTicket interface
      // Based on actual backend response format
      const ticket: JiraTicket = {
        id: data.ticketId || ticketId,
        key: data.ticketId || ticketId,
        summary: data.summary || `Ticket ${ticketId}`,
        description: data.description,
        status: data.status || 'Unknown',
        priority: data.priority,
        assignee: data.assignee || 'Unassigned',
        reporter: data.reporter,
        created: data.created || new Date().toISOString(),
        updated: data.updated || new Date().toISOString(),
        url: data.url || `https://company.atlassian.net/browse/${ticketId}`
      };

      return ticket;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error fetching ticket ${ticketId}`);
    }
  }

  /**
   * Fetch multiple tickets with error handling
   */
  async fetchTickets(ticketIds: string[]): Promise<DetectedTicket[]> {
    const promises = ticketIds.map(async (ticketId): Promise<DetectedTicket> => {
      try {
        const ticket = await this.fetchTicket(ticketId);
        return {
          ticketId,
          status: 'success',
          ticket
        };
      } catch (error) {
        return {
          ticketId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Format ticket content for inclusion in analysis request
   */
  formatTicketForAnalysis(ticket: JiraTicket): string {
    return `
--- Jira Ticket: ${ticket.key} ---
Summary: ${ticket.summary}
Status: ${ticket.status}
Priority: ${ticket.priority || 'Not specified'}
Assignee: ${ticket.assignee || 'Unassigned'}
Created: ${new Date(ticket.created).toLocaleDateString()}
${ticket.description ? `Description: ${ticket.description}` : ''}
${ticket.url ? `URL: ${ticket.url}` : ''}
--- End Ticket: ${ticket.key} ---
`;
  }
}

export default JiraService.getInstance(); 