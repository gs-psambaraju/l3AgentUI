import React from 'react';
import { AnalysisJob } from '../../types';

interface ProgressIndicatorProps {
  job: AnalysisJob;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ job, className = '' }) => {
  const isActive = job.status === 'PROCESSING' || job.status === 'CREATED';
  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED' || job.status === 'TIMEOUT';

  // Animated thinking dots
  const ThinkingDots = () => (
    <div className="flex items-center space-x-1">
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
    </div>
  );

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="message-bubble bot max-w-none">
        <div className="flex items-start space-x-3">
          {/* Icon area */}
          <div className="flex-shrink-0 mt-1">
            {isActive && <ThinkingDots />}
            {isCompleted && <span className="text-green-500 text-sm">✓</span>}
            {isFailed && <span className="text-red-500 text-sm">✗</span>}
          </div>
          
          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Current thinking step */}
            <div className="text-sm text-gray-200 mb-2">
              {isActive && (
                <span className="italic text-blue-300">
                  {job.progress.currentStep}
                </span>
              )}
              {isCompleted && (
                <span className="text-green-300">
                  Analysis complete
                </span>
              )}
              {isFailed && (
                <span className="text-red-300">
                  Analysis failed
                  {job.errorMessage && `: ${job.errorMessage}`}
                </span>
              )}
            </div>

            {/* Progress bar - only show when active */}
            {isActive && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Step {job.progress.currentStepIndex} of {job.progress.totalSteps}</span>
                  <span>{job.progress.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-blue-400 h-1 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${job.progress.completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Time estimate - only when active */}
            {isActive && job.estimatedTimeRemaining && (
              <div className="text-xs text-gray-400">
                ~{job.estimatedTimeRemaining} remaining
              </div>
            )}

            {/* Completion summary - only when done */}
            {isCompleted && (
              <div className="text-xs text-gray-400 mt-1">
                Analyzed in {job.progress.totalSteps} steps • {new Date(job.createdAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 