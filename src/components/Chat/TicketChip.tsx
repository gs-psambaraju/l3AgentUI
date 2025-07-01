import React from 'react';
import { X, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { DetectedTicket } from '../../types';

interface TicketChipProps {
  ticket: DetectedTicket;
  onRemove: (ticketId: string) => void;
  className?: string;
}

export function TicketChip({ ticket, onRemove, className = '' }: TicketChipProps) {
  const getChipStyle = () => {
    switch (ticket.status) {
      case 'loading':
        return 'bg-blue-900/20 border-blue-700/30 text-blue-300';
      case 'success':
        return 'bg-green-900/20 border-green-700/30 text-green-300 hover:bg-green-900/30';
      case 'error':
        return 'bg-red-900/20 border-red-700/30 text-red-300';
      default:
        return 'bg-gray-800/20 border-gray-600/30 text-gray-300';
    }
  };

  const getIcon = () => {
    switch (ticket.status) {
      case 'loading':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      case 'success':
        return ticket.ticket?.url ? <ExternalLink className="w-3 h-3" /> : null;
      default:
        return null;
    }
  };

  const getDisplayText = () => {
    switch (ticket.status) {
      case 'loading':
        return `${ticket.ticketId} (Loading...)`;
      case 'error':
        return `${ticket.ticketId} (${ticket.error || 'Failed to load'})`;
      case 'success':
        return `${ticket.ticketId} (${ticket.ticket?.summary || 'No summary'})`;
      default:
        return ticket.ticketId;
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 ${getChipStyle()} ${className}`}>
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      {/* Ticket text */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block max-w-[300px] sm:max-w-[400px]">
          {getDisplayText()}
        </span>
      </div>
      
      {/* Remove button */}
      <button
        onClick={() => onRemove(ticket.ticketId)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
        title="Remove ticket info"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
} 