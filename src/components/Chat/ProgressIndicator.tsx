import React, { useState, useEffect } from 'react';
import { AnalysisJob } from '../../types';

interface ProgressIndicatorProps {
  job: AnalysisJob;
  className?: string;
}

interface ThinkingStep {
  text: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: Date;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ job, className = '' }) => {
  const [displayedSteps, setDisplayedSteps] = useState<ThinkingStep[]>([]);
  const [animationQueue, setAnimationQueue] = useState<number[]>([]);

  const isActive = job.status === 'PROCESSING' || job.status === 'CREATED';
  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED' || job.status === 'TIMEOUT';

  // Default step templates for fallback
  const defaultSteps = [
    "Understanding your specific issue...",
    "Checking patterns and knowledge base...",
    "Analyzing root causes...", 
    "Developing specific solutions...",
    "Validating and finalizing..."
  ];

  // Process progress data into thinking steps
  const processThinkingSteps = (): ThinkingStep[] => {
    const steps: ThinkingStep[] = [];
    const completedSteps = job.progress.completedSteps || [];
    const stepsCompleted = job.progress.stepsCompleted || job.progress.currentStepIndex;
    const totalSteps = job.progress.totalSteps;

    for (let i = 0; i < totalSteps; i++) {
      const stepText = completedSteps[i] || 
                      (i === stepsCompleted ? job.progress.currentStep : '') ||
                      defaultSteps[i] || `Step ${i + 1}...`;

      let status: 'completed' | 'current' | 'pending';
      if (i < stepsCompleted) {
        status = 'completed';
      } else if (i === stepsCompleted && isActive) {
        status = 'current';
      } else {
        status = 'pending';
      }

      steps.push({
        text: stepText,
        status,
        timestamp: status === 'completed' ? new Date() : undefined
      });
    }

    return steps;
  };

  // Handle smooth catch-up animations for fast analyses
  useEffect(() => {
    const newSteps = processThinkingSteps();
    const currentCompleted = job.progress.stepsCompleted || job.progress.currentStepIndex;
    const previousCompleted = displayedSteps.filter(s => s.status === 'completed').length;

    // If we jumped steps (fast analysis), animate through them
    if (currentCompleted > previousCompleted + 1) {
      const missedSteps = [];
      for (let i = previousCompleted; i < currentCompleted; i++) {
        missedSteps.push(i);
      }
      
      // Queue catch-up animations
      setAnimationQueue(missedSteps);
      
      // Start animation sequence
      missedSteps.forEach((stepIndex, arrayIndex) => {
        setTimeout(() => {
          setDisplayedSteps(prev => {
            const updated = [...prev];
            if (updated[stepIndex]) {
              updated[stepIndex] = { ...updated[stepIndex], status: 'completed', timestamp: new Date() };
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
  }, [job.progress.stepsCompleted, job.progress.currentStepIndex, job.progress.completedSteps, job.status]);

  // Step icon component
  const StepIcon: React.FC<{ status: ThinkingStep['status']; isAnimating?: boolean }> = ({ status, isAnimating }) => {
    if (status === 'completed') {
      return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>;
    } else if (status === 'current') {
      return (
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      );
    } else {
      return <div className="w-4 h-4 bg-gray-500 rounded-full opacity-30"></div>;
    }
  };

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="message-bubble bot max-w-none">
        <div className="space-y-1">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-200">
              {isCompleted ? 'Analysis Complete' : 
               isFailed ? 'Analysis Failed' :
               'AI Thinking...'}
            </span>
            {isActive && (
              <span className="text-xs text-gray-400">
                Step {(job.progress.stepsCompleted || job.progress.currentStepIndex) + 1} of {job.progress.totalSteps}
              </span>
            )}
          </div>

          {/* Thinking Steps Timeline */}
          <div className="space-y-3">
            {displayedSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start space-x-3 transition-all duration-500 ${
                  step.status === 'current' ? 'opacity-100' : 
                  step.status === 'completed' ? 'opacity-90' : 'opacity-40'
                }`}
              >
                {/* Timeline Icon */}
                <div className="flex-shrink-0 mt-1">
                  <StepIcon status={step.status} isAnimating={animationQueue.includes(index)} />
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm leading-relaxed ${
                    step.status === 'current' ? 'text-blue-300 italic' :
                    step.status === 'completed' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {step.text}
                  </div>
                  
                  {/* Timestamp for completed steps */}
                  {step.status === 'completed' && step.timestamp && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.timestamp.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Progress indicator for current step */}
                {step.status === 'current' && isActive && (
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {job.progress.completionPercentage}%
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Overall Progress Bar */}
          {isActive && (
            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Overall Progress</span>
                <span>{job.progress.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${job.progress.completionPercentage}%` }}
                />
              </div>
              {job.estimatedTimeRemaining && (
                <div className="text-xs text-gray-500 mt-1 text-center">
                  ~{job.estimatedTimeRemaining} remaining
                </div>
              )}
            </div>
          )}

          {/* Completion Summary */}
          {isCompleted && (
            <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400 text-center">
              Analysis completed in {job.progress.totalSteps} steps
            </div>
          )}

          {/* Error State */}
          {isFailed && job.errorMessage && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-300">
              {job.errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 