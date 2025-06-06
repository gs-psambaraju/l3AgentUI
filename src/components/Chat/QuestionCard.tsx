import React, { useState } from 'react';
import { CheckCircle, HelpCircle } from 'lucide-react';
import { QuestionCardProps, QuestionResponse } from '../../types';
import Button from '../Common/Button';

export function QuestionCard({ questions, onSubmit, isLoading }: QuestionCardProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    questions.forEach(question => {
      // Handle both API formats
      const questionId = question.questionId || question.id;
      const response = responses[questionId];
      
      if (!response || !response.trim()) {
        newErrors[questionId] = 'This field is required';
        return;
      }
      
      // Handle both answerType formats
      const answerType = question.answerType || question.type;
      
      // Validate based on answer type
      if (answerType === 'url') {
        try {
          new URL(response);
        } catch {
          newErrors[questionId] = 'Please enter a valid URL';
        }
      } else if (answerType === 'number') {
        if (isNaN(Number(response))) {
          newErrors[questionId] = 'Please enter a valid number';
        }
      }
      
      // Custom validation pattern
      if (question.validationPattern) {
        const regex = new RegExp(question.validationPattern);
        if (!regex.test(response)) {
          newErrors[questionId] = 'Invalid format';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateResponses()) {
      return;
    }
    
    const questionResponses: QuestionResponse[] = questions.map(question => {
      // Handle both API formats
      const questionId = question.questionId || (question as any).id;
      return {
        questionId: questionId,
        answer: responses[questionId] || ''
      };
    });
    
    onSubmit(questionResponses);
  };

  const renderQuestionInput = (question: any) => {
    // Handle both API formats
    const questionId = question.questionId || question.id;
    const answerType = question.answerType || question.type;
    const response = responses[questionId] || '';
    const error = errors[questionId];
    
    switch (answerType) {
      case 'yes_no':
      case 'boolean':
        return (
          <div className="space-y-2">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={questionId}
                  value="yes"
                  checked={response === 'yes'}
                  onChange={(e) => handleResponseChange(questionId, e.target.value)}
                  className="mr-2"
                  disabled={isLoading}
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={questionId}
                  value="no"
                  checked={response === 'no'}
                  onChange={(e) => handleResponseChange(questionId, e.target.value)}
                  className="mr-2"
                  disabled={isLoading}
                />
                No
              </label>
            </div>
          </div>
        );
        
      case 'yes_no_details':
        return (
          <div className="space-y-3">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={questionId}
                  value="yes"
                  checked={response.startsWith('yes')}
                  onChange={(e) => handleResponseChange(questionId, e.target.value)}
                  className="mr-2"
                  disabled={isLoading}
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={questionId}
                  value="no"
                  checked={response.startsWith('no')}
                  onChange={(e) => handleResponseChange(questionId, e.target.value)}
                  className="mr-2"
                  disabled={isLoading}
                />
                No
              </label>
            </div>
            <textarea
              placeholder="Please provide additional details..."
              value={response.replace(/^(yes|no)\s*-?\s*/, '')}
              onChange={(e) => {
                const baseAnswer = response.startsWith('yes') ? 'yes' : response.startsWith('no') ? 'no' : '';
                const details = e.target.value;
                handleResponseChange(questionId, baseAnswer ? `${baseAnswer} - ${details}` : details);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={response}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        );
        
      default:
        return (
          <input
            type={answerType === 'url' ? 'url' : 'text'}
            value={response}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            placeholder={answerType === 'url' ? 'https://example.com' : 'Enter your answer...'}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        );
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 text-blue-800">
        <HelpCircle className="w-5 h-5" />
        <h3 className="font-semibold">Diagnostic Questions</h3>
      </div>
      
      <div className="space-y-4">
        {questions.map((question, index) => {
          // Handle both API formats
          const questionId = question.questionId || (question as any).id;
          const questionText = (question as any).question || question.customerTemplate;
          const internalQuestion = question.l2Question;
          
          return (
            <div key={questionId} className="bg-white p-4 rounded-md border">
              <div className="mb-3">
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {questionText}
                    </p>
                    {internalQuestion && internalQuestion !== questionText && (
                      <p className="text-xs text-gray-600 italic">
                        Internal: {internalQuestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                {renderQuestionInput(question)}
              </div>
              
              {errors[questionId] && (
                <p className="text-red-600 text-sm mt-1">
                  {errors[questionId]}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-blue-200">
        <Button
          onClick={handleSubmit}
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading || questions.length === 0}
          className="flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{isLoading ? 'Processing...' : 'Submit Answers'}</span>
        </Button>
      </div>
    </div>
  );
}

export default QuestionCard; 