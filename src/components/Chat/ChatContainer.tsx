import React, { useRef, useEffect } from 'react';
import { useConversation } from '../../hooks/useConversation';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { StatusIndicator } from './StatusIndicator';
import ProgressIndicator from './ProgressIndicator';
import { Copy, RotateCcw, MessageCircle, Sparkles, AlertTriangle } from 'lucide-react';
import Button from '../Common/Button';
import { AnalysisRequest } from '../../types';

export function ChatContainer() {
  const {
    conversation,
    analyzeRequest,
    sendFollowUp,
    resetConversation,
    isLoading,
    hasActiveConversation,
    canFollowUp,
    hasActions,
    hasResolution,
    isEscalated
  } = useConversation();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversation.messages]);

  const handleAnalyzeRequest = async (data: AnalysisRequest) => {
    // Debug: Log the decision-making process
    console.log('🔍 handleAnalyzeRequest Decision:', {
      hasActiveConversation,
      canFollowUp,
      conversationId: conversation.conversationId,
      needsEscalation: conversation.needsEscalation,
      status: conversation.status,
      willUseFollowUp: hasActiveConversation && canFollowUp,
      question: data.question
    });

    // TEMPORARY FIX: Force follow-up if we have a conversation ID
    if (conversation.conversationId) {
      // If we have an active conversation, send as follow-up
      console.log('📤 Sending follow-up message to conversation:', conversation.conversationId);
      await sendFollowUp(data.question);
    } else {
      // Otherwise start new analysis
      console.log('🆕 Starting new analysis (no active conversation or cannot follow up)');
      await analyzeRequest(data);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header with New Chat button when conversation is active */}
      {hasActiveConversation && (
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Active Conversation</span>
              </div>
              {conversation.confidence && (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">
                    {conversation.confidence} Confidence
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={resetConversation}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Welcome screen when no messages */}
        {conversation.messages.length === 0 && (
          <div className="text-center py-16 px-4 max-w-4xl mx-auto">
            <div className="mb-12">
              <div className="w-32 h-32 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center mx-auto animate-pulse hover:animate-bounce transition-all duration-300 cursor-pointer">
                <MessageCircle className="w-14 h-14 text-blue-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-6">
              Welcome to L3 Agent
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 text-xl">
              Ask technical questions or paste error details to get intelligent troubleshooting assistance.
            </p>
            
            {/* Clean call-to-action */}
            <div className="mb-12">
              <p className="text-base text-gray-500 mb-6">
                👇 Start by describing your technical issue below
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AI Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Smart Solutions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Expert Escalation</span>
              </div>
            </div>
          </div>
        )}

        {conversation.messages.map((message, index) => {
          // Filter out unwanted messages
          const isGenericBotMessage = message.type === 'bot' && (
            message.content.toLowerCase().includes('technical assistance based on your query') ||
            message.content.toLowerCase().includes('technical assistance: technical assistance') ||
            /^technical assistance:\s*technical assistance/i.test(message.content) ||
            message.content.toLowerCase().includes('let me help you with this:') ||
            message.content.toLowerCase().includes('here are some things to check') ||
            message.content.toLowerCase().includes('actions you should take right away') ||
            message.content.toLowerCase().includes('i need to ask you a few questions') ||
            message.content.toLowerCase().includes('better understand the issue') ||
            message.content.trim() === 'Let me help you with this:' ||
            message.content.trim() === 'Show reasoning'
          );
          
          // Skip rendering generic/transitional messages entirely
          if (isGenericBotMessage) {
            return null;
          }
          
          // For the latest bot message, show actions if available
          const isLatestBotMessage = message.type === 'bot' && index === conversation.messages.length - 1;
          let suggestions = undefined;
          
          if (isLatestBotMessage && hasActions) {
            // Convert nextActions to suggestions format for display
            suggestions = conversation.nextActions.map((action, actionIndex) => ({
              id: `action_${actionIndex}`,
              text: action
            }));
          }
          
          return (
            <MessageBubble 
              key={message.id} 
              message={message}
              suggestions={suggestions && suggestions.length > 0 ? suggestions : undefined}
            />
          );
        })}
        
        {/* Status indicator for processing states */}
        {isLoading && !conversation.isAsyncProcessing && (
          <StatusIndicator 
            status="analyzing"
            message="Analyzing your request..."
          />
        )}

        {/* Async job progress indicator */}
        {conversation.isAsyncProcessing && conversation.currentJob && (
          <ProgressIndicator 
            job={conversation.currentJob}
            className="mb-4"
          />
        )}

        {/* Escalation notice */}
        {isEscalated && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-300 mb-1">
                  Escalation Required
                </h3>
                <p className="text-sm text-red-200">
                  This issue requires additional expertise. Your case has been escalated to our engineering team.
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - simplified for v2.0 API */}
      {(() => {
        // Show input area for:
        // 1. No conversation started yet
        // 2. Conversation completed (can ask follow-up)
        // 3. Has resolution/escalation (can start new conversation)
        const showInputArea = 
          !hasActiveConversation || 
          conversation.status === 'completed' || 
          hasResolution || 
          isEscalated ||
          canFollowUp;
        
        return showInputArea && (
          <InputArea
            onSubmit={handleAnalyzeRequest}
            isLoading={isLoading}
            isNewChat={!hasActiveConversation}
            hasIntegratedContent={hasActions}
            hasInteractiveQuestions={false} // v2.0 doesn't use interactive questions
          />
        );
      })()}
    </div>
  );
} 