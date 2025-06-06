import React from 'react';

interface ConversationalSuggestionsProps {
  suggestions: string[];
  type: 'immediate' | 'investigate' | 'questions';
}

export function ConversationalSuggestions({ suggestions, type }: ConversationalSuggestionsProps) {
  const getIntroText = () => {
    switch (type) {
      case 'immediate':
        return "Here's what you should do right away:";
      case 'investigate':
        return "I'd suggest checking these areas:";
      case 'questions':
        return "I need to understand:";
      default:
        return "Here's what I'm thinking:";
    }
  };

  const getUrgencyStyle = () => {
    return type === 'immediate' 
      ? 'border-l-4 border-l-red-500 bg-red-900/10 pl-4' 
      : 'border-l-4 border-l-blue-500 bg-blue-900/10 pl-4';
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-300 font-medium">
        {getIntroText()}
      </div>
      
      <div className={`rounded-r-lg ${getUrgencyStyle()}`}>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-xs text-gray-500 mt-0.5 font-mono">
                {index + 1}.
              </span>
              <span className="text-sm text-gray-200 leading-relaxed">
                {suggestion}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {type === 'immediate' && (
        <div className="text-xs text-red-400 font-medium flex items-center space-x-1">
          <span>⚡</span>
          <span>Try these steps and let me know how it goes</span>
        </div>
      )}
      
      {type === 'investigate' && (
        <div className="text-xs text-blue-400 flex items-center space-x-1">
          <span>💡</span>
          <span>Check these areas and describe what you find - I'll help interpret the results</span>
        </div>
      )}
    </div>
  );
}

export default ConversationalSuggestions; 