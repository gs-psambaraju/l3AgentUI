import React, { useState, useEffect, useRef } from 'react';
import { AnalysisJob } from '../../types';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  job: AnalysisJob;
  className?: string;
}

interface ThinkingStep {
  text: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: Date;
  completedAt?: string; // Fixed timestamp as string to prevent re-rendering issues
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ job, className = '' }) => {
  // Defensive programming: ensure job.progress exists with sensible defaults
  const progress = job.progress || {
    currentStep: 'Processing...',
    completionPercentage: 0,
    currentStepIndex: 0,
    totalSteps: 5,
    completedSteps: [],
    stepsCompleted: 0
  };

  const isActive = job.status === 'PROCESSING' || job.status === 'CREATED';
  const isCompleted = job.status === 'COMPLETED' && (progress.stepsCompleted || 0) >= progress.totalSteps;
  const isFailed = job.status === 'FAILED' || job.status === 'TIMEOUT';
  
  const [displayedSteps, setDisplayedSteps] = useState<ThinkingStep[]>([]);
  const [animationQueue, setAnimationQueue] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompleted);
  const [showProgress, setShowProgress] = useState<boolean>(true);
  
  // Store completed timestamps to prevent dynamic changes
  const completedTimestamps = useRef<Map<number, string>>(new Map());

  // Removed hardcoded messages - backend will provide proper step messages

  // Process progress data into thinking steps - API-driven, no placeholders
  const processThinkingSteps = (): ThinkingStep[] => {
    const steps: ThinkingStep[] = [];
    const completedSteps = progress.completedSteps || [];
    const stepsCompleted = progress.stepsCompleted || progress.currentStepIndex || 0;
    
    // Debug: Log the actual data we're working with
    console.log('🔍 ProgressIndicator processing:', {
      jobId: job.jobId,
      status: job.status,
      completedSteps: completedSteps,
      completedStepsLength: completedSteps.length,
      stepsCompleted,
      totalSteps: progress.totalSteps,
      currentStep: progress.currentStep,
      stepMessage: progress.stepMessage,
      currentStepIndex: progress.currentStepIndex
    });

    // Add completed steps (only those with actual messages from backend)
    for (let i = 0; i < completedSteps.length; i++) {
      if (completedSteps[i]) {
        // Get or create a fixed timestamp for this completed step
        if (!completedTimestamps.current.has(i)) {
          completedTimestamps.current.set(i, new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }));
        }
        
        steps.push({
          text: completedSteps[i],
          status: 'completed',
          completedAt: completedTimestamps.current.get(i)
        });
      }
    }

    // Add current step (only if backend provides a message)
    if (isActive && (progress.currentStep || progress.stepMessage)) {
      const currentStepText = progress.currentStep || progress.stepMessage;
      
      // Avoid duplicating if current step is already in completed steps
      const isDuplicate = steps.some(step => step.text === currentStepText);
      
      if (!isDuplicate && currentStepText) {
        steps.push({
          text: currentStepText,
          status: 'current',
        });
      }
    }

    return steps;
  };

  // Handle smooth catch-up animations for fast analyses
  useEffect(() => {
    const newSteps = processThinkingSteps();
    const currentCompleted = progress.stepsCompleted || progress.currentStepIndex || 0;
    const previousCompleted = displayedSteps.filter((s: ThinkingStep) => s.status === 'completed').length;

    // If we jumped steps (fast analysis), animate through them
    if (currentCompleted > previousCompleted + 1) {
      const missedSteps = [];
      for (let i = previousCompleted; i < currentCompleted; i++) {
        missedSteps.push(i);
      }
      
      // Queue catch-up animations
      setAnimationQueue(missedSteps);
      
      // Start animation sequence with proper timestamp management
      missedSteps.forEach((stepIndex, arrayIndex) => {
        setTimeout(() => {
          // Set fixed timestamp for this step
          if (!completedTimestamps.current.has(stepIndex)) {
            completedTimestamps.current.set(stepIndex, new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            }));
          }
          
          setDisplayedSteps((prev: ThinkingStep[]) => {
            const updated = [...prev];
            if (updated[stepIndex]) {
              updated[stepIndex] = { 
                ...updated[stepIndex], 
                status: 'completed', 
                completedAt: completedTimestamps.current.get(stepIndex)
              };
            }
            return updated;
          });
        }, arrayIndex * 400); // 400ms between catch-up steps
      });

      // Final update after catch-up
      setTimeout(() => {
        setDisplayedSteps(newSteps);
        setAnimationQueue([]);
      }, missedSteps.length * 400 + 200);
    } else {
      // Normal progression - update immediately
      setDisplayedSteps(newSteps);
    }
  }, [progress.stepsCompleted, progress.currentStepIndex, progress.completedSteps, job.status]);

  // Enhanced step icon component with smooth animations
  const StepIcon: React.FC<{ status: ThinkingStep['status']; isAnimating?: boolean; stepIndex?: number }> = ({ status, isAnimating, stepIndex = 0 }) => {
    if (status === 'completed') {
      return (
        <div className={`w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500 shadow-lg shadow-green-500/30 ${isAnimating ? 'scale-110 ring-2 ring-green-300' : ''}`}>
          <span className="animate-fadeIn">✓</span>
        </div>
      );
    } else if (status === 'current') {
      return (
        <div className="relative">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/30">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          {/* Animated thinking rings */}
          <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 w-5 h-5 bg-blue-300 rounded-full animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
        </div>
      );
    } else {
      return (
        <div className="w-5 h-5 bg-gray-600 rounded-full opacity-40 transition-all duration-300 hover:opacity-60 border border-gray-500"></div>
      );
    }
  };

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="message-bubble bot max-w-none">
        <div className="space-y-1">
          {/* Enhanced Header with smooth transitions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Status indicator with enhanced animations */}
              <div className="relative">
                <div className={`w-5 h-5 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-500 shadow-lg shadow-green-500/40' : 
                  isFailed ? 'bg-red-500 shadow-lg shadow-red-500/40' : 
                  'bg-blue-500 shadow-lg shadow-blue-500/40'
                }`}>
                  {isCompleted && (
                    <div className="w-5 h-5 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                  {isActive && (
                    <>
                      <div className="w-5 h-5 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-25"></div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Status text with typewriter effect */}
              <div className="flex flex-col">
                <span className={`text-base font-bold transition-all duration-300 ${
                  isCompleted ? 'text-green-300' : 
                  isFailed ? 'text-red-300' :
                  'text-blue-300'
                }`}>
                  {isCompleted ? '🎉 Analysis Complete' : 
                   isFailed ? '❌ Analysis Failed' :
                   '🤖 AI Thinking...'}
                </span>
                {isActive && (
                  <span className="text-sm text-blue-400 animate-pulse font-medium">
                    {displayedSteps.some((s: ThinkingStep) => s.status === 'current') 
                      ? `Step ${displayedSteps.filter((s: ThinkingStep) => s.status === 'completed').length + 1}` 
                      : 'Analyzing'} • {progress.completionPercentage}% complete
                  </span>
                )}
                {isCompleted && (
                  <span className="text-sm text-green-400 font-medium">
                    Analysis completed in {displayedSteps.length} steps
                  </span>
                )}
              </div>
            </div>
            
            {/* Enhanced expand/collapse button */}
            {(isCompleted || displayedSteps.length > 0) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-700/50 hover:bg-gray-600/60 text-sm text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <span className="font-semibold">{isExpanded ? 'Hide' : 'Show'} steps</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Thinking Steps Timeline */}
          {(isExpanded || !isCompleted) && displayedSteps.length > 0 ? (
            <div className="space-y-3">
              {displayedSteps.map((step: ThinkingStep, index: number) => (
                <div 
                  key={index} 
                  className={`group flex items-start space-x-4 transition-all duration-500 ease-out transform ${
                    step.status === 'current' ? 'opacity-100 scale-[1.01] bg-blue-500/8 -mx-2 px-2 py-2 rounded-lg border-l-2 border-blue-500/40' : 
                    step.status === 'completed' ? 'opacity-90 hover:opacity-100' : 
                    'opacity-50 hover:opacity-70'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 80}ms`,
                    animation: step.status === 'completed' ? `slideIn 0.5s ease-out ${index * 0.08}s both` : undefined
                  }}
                >
                  {/* Enhanced Timeline Icon */}
                  <div className="flex-shrink-0 mt-0.5 relative">
                    <StepIcon 
                      status={step.status} 
                      isAnimating={animationQueue.includes(index)} 
                      stepIndex={index}
                    />
                    {/* Connecting line for visual flow */}
                    {index < displayedSteps.length - 1 && (
                      <div className={`absolute top-5 left-2.5 w-0.5 h-6 transition-all duration-300 ${
                        step.status === 'completed' ? 'bg-green-400/25' : 
                        step.status === 'current' ? 'bg-blue-400/25' : 'bg-gray-600/25'
                      }`}></div>
                    )}
                  </div>

                  {/* Enhanced Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-relaxed transition-all duration-300 ${
                      step.status === 'current' ? 'text-blue-200 font-medium' :
                      step.status === 'completed' ? 'text-gray-200 group-hover:text-white' : 
                      'text-gray-400'
                    }`}>
                      {step.text}
                      {step.status === 'current' && (
                        <span className="inline-block ml-2 thinking-dots">
                          <span className="text-blue-300">●</span>
                          <span className="text-blue-400 ml-1">●</span>
                          <span className="text-blue-500 ml-1">●</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Subtle timestamp for completed steps - no redundant "Completed" text */}
                    {step.status === 'completed' && step.completedAt && (
                      <div className="mt-1 text-xs text-gray-500 font-mono opacity-60">
                        {step.completedAt}
                      </div>
                    )}
                  </div>

                  {/* Enhanced progress indicator for current step */}
                  {step.status === 'current' && isActive && (
                    <div className="flex-shrink-0 flex flex-col items-end space-y-1">
                      <div className="text-xs font-semibold text-blue-300 animate-pulse">
                        {progress.completionPercentage}%
                      </div>
                      <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progress.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Show initial state or collapsed summary with persistence */
            <div className="text-sm text-gray-400 text-center py-3">
              {isCompleted ? 
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-gray-400 hover:text-gray-300 transition-colors underline decoration-dotted"
                >
                  View {displayedSteps.length} completed steps
                </button> :
                "Starting analysis..."
              }
            </div>
          )}

          {/* Overall Progress Bar */}
          {isActive && (
            <div className="mt-6 pt-4 border-t border-gray-600">
              <div className="flex justify-between text-sm text-gray-300 mb-3 font-medium">
                <span>Overall Progress</span>
                <span className="font-bold">{progress.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${progress.completionPercentage}%` }}
                />
              </div>
              {job.estimatedTimeRemaining && (
                <div className="text-sm text-gray-400 mt-2 text-center font-medium">
                  ~{job.estimatedTimeRemaining} remaining
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {isFailed && job.errorMessage && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-200 font-medium">
              {job.errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 