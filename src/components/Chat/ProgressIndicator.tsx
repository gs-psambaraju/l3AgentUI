import React from 'react';
import { AnalysisJob } from '../../types';

interface ProgressIndicatorProps {
  job: AnalysisJob;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ job, className = '' }) => {
  const getStatusColor = (status: AnalysisJob['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED':
      case 'TIMEOUT':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'CREATED':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

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

  const getStepIcon = (stepIndex: number, currentIndex: number) => {
    if (stepIndex < currentIndex) return '✅';
    if (stepIndex === currentIndex) return '🔄';
    return '⏳';
  };

  const steps = [
    'Problem Understanding',
    'Pattern Recognition', 
    'Root Cause Analysis',
    'Solution Development',
    'Solution Validation'
  ];

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(job.status)}`}>
        <span className="text-lg">{getStatusIcon(job.status)}</span>
        <div className="flex-1">
          <div className="font-medium">
            {job.status === 'COMPLETED' ? 'Analysis Complete' : 
             job.status === 'FAILED' ? 'Analysis Failed' :
             job.status === 'TIMEOUT' ? 'Analysis Timed Out' :
             job.status === 'PROCESSING' ? 'Analyzing...' :
             'Starting Analysis...'}
          </div>
          <div className="text-sm opacity-75">
            {job.progress.currentStep}
          </div>
        </div>
        {job.estimatedTimeRemaining && job.status === 'PROCESSING' && (
          <div className="text-sm opacity-75">
            ~{job.estimatedTimeRemaining}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{job.progress.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${job.progress.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-3">Analysis Steps</div>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-lg">
                {getStepIcon(index + 1, job.progress.currentStepIndex)}
              </span>
              <span 
                className={`text-sm ${
                  index + 1 < job.progress.currentStepIndex ? 'text-green-600 font-medium' :
                  index + 1 === job.progress.currentStepIndex ? 'text-blue-600 font-medium' :
                  'text-gray-500'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {job.status === 'FAILED' && job.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {job.errorMessage}
          </div>
        </div>
      )}

      {/* Job Metadata */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Job ID: {job.jobId}</span>
          <span>Started: {new Date(job.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 