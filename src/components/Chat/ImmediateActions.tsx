import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ImmediateAction {
  id: string;
  text: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ImmediateActionsProps {
  actions: ImmediateAction[];
}

export function ImmediateActions({ actions }: ImmediateActionsProps) {
  return (
    <div className="space-y-1">
      {actions.map((action, index) => (
        <div 
          key={action.id}
          className="flex items-start space-x-3 py-2 px-1 hover:bg-red-50 rounded-md transition-colors duration-150"
        >
          <div className="flex-shrink-0 mt-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              action.priority === 'high' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {index + 1}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                {action.text}
              </p>
              {action.priority === 'high' && (
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">Immediate Action Required</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ImmediateActions; 