import React from 'react';
import { AnalysisJob } from '../../types';

interface ProgressIndicatorProps {
  job: AnalysisJob;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ job, className = '' }) => {
  const getStatusIcon = (status: AnalysisJob['status']) => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'TIMEOUT':
        return '⏱️';
      case 'PROCESSING':
        return '🔄';
      case 'CREATED':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const isActive = job.status === 'PROCESSING' || job.status === 'CREATED';

  return (
    <div className={`bg-blue-50 rounded-lg border border-blue-200 p-4 ${className}`}>
      {/* Header with current thinking step */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-lg ${isActive ? 'animate-spin' : ''}`}>
          {getStatusIcon(job.status)}
        </span>
        <div className="flex-1">
          <div className="font-medium text-blue-900">
            {job.status === 'COMPLETED' ? 'Analysis Complete' : 
             job.status === 'FAILED' ? 'Analysis Failed' :
             job.status === 'TIMEOUT' ? 'Analysis Timed Out' :
             'Analyzing...'}
          </div>
          {/* Real-time thinking step */}
          <div className="text-sm text-blue-700 mt-1">
            {job.progress.currentStep}
          </div>
        </div>
        {job.estimatedTimeRemaining && isActive && (
          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            ~{job.estimatedTimeRemaining}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-blue-600 mb-1">
            <span>Step {job.progress.currentStepIndex} of {job.progress.totalSteps}</span>
            <span>{job.progress.completionPercentage}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${job.progress.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {job.status === 'FAILED' && job.errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {job.errorMessage}
          </div>
        </div>
      )}

      {/* Job Metadata - minimal */}
      {job.status !== 'PROCESSING' && (
        <div className="mt-3 pt-2 border-t border-blue-200 text-xs text-blue-500">
          Job {job.jobId.split('_')[0]}... • {new Date(job.createdAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator; 