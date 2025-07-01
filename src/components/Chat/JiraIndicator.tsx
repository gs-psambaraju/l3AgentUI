import React from 'react';
import { ExternalLink, AlertCircle, CheckCircle, Loader2, Hash } from 'lucide-react';
import { DetectedTicket } from '../../types';
import { getTicketsSummary } from '../../utils/jiraUtils';

interface JiraIndicatorProps {
  detectedTickets: DetectedTicket[];
  className?: string;
}

export function JiraIndicator({ detectedTickets, className = '' }: JiraIndicatorProps) {
  if (detectedTickets.length === 0) return null;

  const hasLoading = detectedTickets.some(t => t.status === 'loading' || t.status === 'detecting');
  const hasErrors = detectedTickets.some(t => t.status === 'error');
  const hasSuccess = detectedTickets.some(t => t.status === 'success');
  const summary = getTicketsSummary(detectedTickets);

  // Determine overall status and styling
  const getStatusConfig = () => {
    if (hasLoading) {
      return {
        icon: Loader2,
        iconClass: 'text-blue-400 animate-spin',
        bgClass: 'bg-blue-900/20 border-blue-700/30',
        textClass: 'text-blue-300'
      };
    }
    
    if (hasErrors && !hasSuccess) {
      return {
        icon: AlertCircle,
        iconClass: 'text-red-400',
        bgClass: 'bg-red-900/20 border-red-700/30',
        textClass: 'text-red-300'
      };
    }
    
    if (hasSuccess) {
      return {
        icon: CheckCircle,
        iconClass: 'text-green-400',
        bgClass: 'bg-green-900/20 border-green-700/30',
        textClass: 'text-green-300'
      };
    }
    
    return {
      icon: Hash,
      iconClass: 'text-gray-400',
      bgClass: 'bg-gray-800/20 border-gray-600/30',
      textClass: 'text-gray-300'
    };
  };

  const { icon: Icon, iconClass, bgClass, textClass } = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${bgClass} border rounded-lg p-3 backdrop-blur-sm ${className}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${textClass}`}>
          {summary || 'Jira tickets detected'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {detectedTickets.map((ticket, index) => (
            <span key={ticket.ticketId} className="inline-flex items-center">
              {index > 0 && ', '}
              <span className={
                ticket.status === 'success' ? 'text-green-400' :
                ticket.status === 'error' ? 'text-red-400' :
                'text-blue-400'
              }>
                {ticket.ticketId}
              </span>
              {ticket.status === 'success' && ticket.ticket?.url && (
                <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 