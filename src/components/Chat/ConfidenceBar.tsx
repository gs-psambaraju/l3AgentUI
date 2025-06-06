import React from 'react';
import { ConfidenceBarProps } from '../../types';
import { CONFIDENCE_LEVELS } from '../../utils/constants';

export function ConfidenceBar({ confidence, status, explanation }: ConfidenceBarProps) {
  const getConfidenceLevel = () => {
    if (confidence >= CONFIDENCE_LEVELS.HIGH.threshold) return CONFIDENCE_LEVELS.HIGH;
    if (confidence >= CONFIDENCE_LEVELS.MEDIUM.threshold) return CONFIDENCE_LEVELS.MEDIUM;
    return CONFIDENCE_LEVELS.LOW;
  };

  const confidenceLevel = getConfidenceLevel();
  const percentage = Math.round(confidence * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">
          Analysis Confidence
        </span>
        <span className="text-xs text-gray-500">
          {percentage}%
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-secondary-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 rounded-full ${
            confidenceLevel.color === 'red' ? 'bg-red-400' :
            confidenceLevel.color === 'yellow' ? 'bg-yellow-400' :
            'bg-green-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${
          confidenceLevel.color === 'red' ? 'text-red-500' :
          confidenceLevel.color === 'yellow' ? 'text-yellow-600' :
          'text-green-500'
        }`}>
          {confidenceLevel.label}
        </span>
        <span className="text-xs text-gray-400 capitalize">
          {status}
        </span>
      </div>
      
      {explanation && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          {explanation}
        </div>
      )}
    </div>
  );
}

export default ConfidenceBar; 