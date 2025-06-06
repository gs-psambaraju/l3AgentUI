import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SuggestedCheck {
  id: string;
  text: string;
}

interface SuggestedChecksProps {
  checks: SuggestedCheck[];
}

export function SuggestedChecks({ checks }: SuggestedChecksProps) {
  return (
    <div className="space-y-1">
      {checks.map((check, index) => (
        <div 
          key={check.id}
          className="flex items-start space-x-3 py-2 px-1 hover:bg-gray-50 rounded-md transition-colors duration-150"
        >
          <div className="flex-shrink-0 mt-1">
            <div className="w-5 h-5 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-relaxed">
              {check.text}
            </p>
          </div>
          
          <div className="flex-shrink-0 mt-1 opacity-40">
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SuggestedChecks; 