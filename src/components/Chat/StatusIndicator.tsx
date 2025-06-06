import React from 'react';
import { Loader2, Brain, CheckCircle, AlertTriangle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'analyzing' | 'processing' | 'thinking' | 'complete' | 'error' | 'idle';
  message?: string;
}

export function StatusIndicator({ status, message }: StatusIndicatorProps) {
  if (status === 'idle' || status === 'complete') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'analyzing':
        return {
          icon: Brain,
          text: message || 'Analyzing your request...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'processing':
        return {
          icon: Loader2,
          text: message || 'Processing responses...',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'thinking':
        return {
          icon: Brain,
          text: message || 'Thinking...',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          text: message || 'Something went wrong',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Loader2,
          text: 'Loading...',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-center mb-3 animate-fade-in`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${config.bgColor} ${config.borderColor} backdrop-blur-sm`}>
        <Icon 
          className={`w-3.5 h-3.5 ${config.color} ${status === 'processing' || status === 'analyzing' ? 'animate-spin' : 'animate-pulse'}`} 
        />
        <span className={`text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    </div>
  );
}

export default StatusIndicator; 