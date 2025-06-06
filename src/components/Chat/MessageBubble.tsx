import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Brain, Lightbulb } from 'lucide-react';
import { MessageBubbleProps } from '../../types';
import { ConversationalSuggestions } from './ConversationalSuggestions';

export function MessageBubble({ message, suggestions, actions }: MessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Detect system reasoning messages that should be treated as "thinking"
  // BUT prioritize HTML rendering if we have formatted HTML content
  const isSystemReasoning = message.reasoning && message.reasoning.length > 0 && !message.isHtmlFormatted;

  // Extract the actual reasoning content vs the conversational intro
  const getReasoningContent = () => {
    return message.reasoning || message.content;
  };

  const getConversationalResponse = () => {
    if (isSystemReasoning) {
      // Convert system reasoning to natural conversation
      if (message.content.includes('Here are some things to check')) {
        return "I'd suggest checking these areas:";
      } else if (message.content.includes('actions you should take')) {
        return "Here's what you should do right away:";
      } else if (message.content.includes('better understand')) {
        return "I need to understand a few more details:";
      }
      return "Let me help you with this:";
    }
    return message.content;
  };

  const getMessageClasses = () => {
    const baseClasses = 'message-bubble';
    return `${baseClasses} ${message.type}`;
  };

  // Check if this is a technical response that might have expandable details
  const hasTechnicalDetails = message.type === 'bot' && (
    (message.confidence && message.confidence < 0.8) ||
    message.content.toLowerCase().includes('diagnostic questions') ||
    message.content.toLowerCase().includes('better understand')
  );

  // Don't render system reasoning messages as regular messages
  if (isSystemReasoning) {
    return (
      <div className="flex justify-start mb-4">
        <div className="message-bubble bot">
          <div className="text-sm leading-relaxed">
            {getConversationalResponse()}
          </div>
          
          {/* Expandable thinking section */}
          <div className="mt-3 border-t border-secondary-100 pt-3">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center space-x-2 text-xs text-secondary-600 hover:text-secondary-800 transition-colors group"
            >
              <Brain className="w-3.5 h-3.5 group-hover:text-primary-600" />
              <span className="text-xs font-medium">Show reasoning</span>
              {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {showThinking && (
              <div className="mt-3 p-4 bg-secondary-50/50 rounded-lg border border-secondary-100 animate-slide-down">
                <div className="flex items-start space-x-2 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-secondary-500 mt-0.5" />
                  <span className="font-medium">AI Reasoning</span>
                </div>
                <div className="text-xs text-secondary-700 leading-relaxed pl-5">
                  {getReasoningContent()}
                </div>
                <div className="mt-2 pt-2 border-t border-secondary-200 text-xs text-secondary-500">
                  This reasoning helps me provide better suggestions based on your specific situation.
                </div>
              </div>
            )}
          </div>
          
          {/* Integrated suggestions and actions */}
          {actions && actions.length > 0 && (
            <div className="mt-3">
              <ConversationalSuggestions 
                suggestions={actions.map(a => a.text)} 
                type="immediate" 
              />
            </div>
          )}
          
          {suggestions && suggestions.length > 0 && (
            <div className="mt-3">
              <ConversationalSuggestions 
                suggestions={suggestions.map(s => s.text)} 
                type="investigate" 
              />
            </div>
          )}
          
          {/* Timestamp */}
          <div className="flex items-center justify-between text-xs opacity-60 mt-2">
            <span>{formatTimestamp(message.timestamp)}</span>
            {message.confidence && (
              <span className="ml-2">
                {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : message.type === 'system' ? 'justify-center' : 'justify-start'} mb-4`}>
      <div className={getMessageClasses()}>
        <div className={`${message.type === 'system' ? 'text-xs' : 'text-sm'} leading-relaxed`}>
          {message.isHtmlFormatted ? (
            // NEW WAY: Render pre-formatted HTML content from backend with fallback
            (() => {
              try {
                // Handle JSON-encoded HTML from API response
                let cleanHtml = message.content;
                
                // First, handle JSON encoding issues
                cleanHtml = cleanHtml
                  // Unescape JSON-encoded quotes
                  .replace(/\\"/g, '"')
                  // Convert literal \n to actual newlines
                  .replace(/\\n/g, '\n')
                  // Handle any other JSON escape sequences
                  .replace(/\\\\/g, '\\');
                
                // Strip markdown code block wrapper if present
                cleanHtml = cleanHtml
                  // Remove ```html at the beginning
                  .replace(/^```html\s*/i, '')
                  // Remove ``` at the end
                  .replace(/\s*```$/, '')
                  .trim();
                
                // Then apply our existing sanitization
                cleanHtml = cleanHtml
                  // Convert problematic nested li structures to simpler format
                  .replace(/<li>\s*<strong>([^<]*)<\/strong>\s*<ul>/g, '<li><strong>$1:</strong></li><ul>')
                  .replace(/<\/ul>\s*<\/li>/g, '</ul>')
                  // Remove empty paragraphs
                  .replace(/<p>\s*<\/p>/g, '')
                  // Clean up spacing around lists
                  .replace(/<\/ul>\s*<ul>/g, '</ul><ul>')
                  .replace(/<\/ol>\s*<ol>/g, '</ol><ol>')
                  // Convert nested lists inside list items to separate lists
                  .replace(/<li>([^<]*)<ul>/g, '<li>$1</li><ul>')
                  .replace(/<li>([^<]*)<ol>/g, '<li>$1</li><ol>')
                  // Clean up whitespace
                  .replace(/\s+/g, ' ')
                  .replace(/>\s+</g, '><')
                  .trim();
                
                return (
                  <div 
                    dangerouslySetInnerHTML={{ __html: cleanHtml }}
                    className="technical-content text-gray-200"
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                  />
                );
              } catch (error) {
                console.warn('HTML rendering failed, using plain text fallback:', error);
                // Fallback to plain text with basic formatting
                return (
                  <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {message.content.replace(/<[^>]*>/g, '')}
                  </div>
                );
              }
            })()
          ) : (
            // OLD WAY: Plain text content (fallback)
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          )}
        </div>
        
        {/* Integrated suggestions and actions for non-reasoning messages */}
        {message.type === 'bot' && (
          <>
            {actions && actions.length > 0 && (
              <div className="mt-3">
                <ConversationalSuggestions 
                  suggestions={actions.map(a => a.text)} 
                  type="immediate" 
                />
              </div>
            )}
            
            {suggestions && suggestions.length > 0 && (
              <div className="mt-3">
                <ConversationalSuggestions 
                  suggestions={suggestions.map(s => s.text)} 
                  type="investigate" 
                />
              </div>
            )}
          </>
        )}
        
        {/* Technical details toggle for bot messages with low confidence */}
        {hasTechnicalDetails && (
          <div className="mt-2 border-t border-secondary-100 pt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Info className="w-3 h-3" />
              <span>Details</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-secondary-50 rounded-lg text-xs text-secondary-600 animate-slide-down border border-secondary-100">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Confidence:</span>
                    <span>{message.confidence ? Math.round(message.confidence * 100) : 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Response Type:</span>
                    <span>Diagnostic inquiry</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Timestamp:</span>
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <div className="pt-1 border-t border-secondary-200">
                    <span className="font-medium block mb-1">Technical Context:</span>
                    <span className="text-secondary-500">
                      The system requires additional information to provide accurate diagnostics and solutions.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular timestamp for non-technical messages */}
        {message.type !== 'system' && !hasTechnicalDetails && (
          <div className="flex items-center justify-between text-xs opacity-60 mt-2">
            <span>{formatTimestamp(message.timestamp)}</span>
            {message.confidence && (
              <span className="ml-2">
                {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble; 