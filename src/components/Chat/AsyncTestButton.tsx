import React, { useState } from 'react';
import { AsyncJobService } from '../../services/asyncJobService';
import { AnalysisRequest, AnalysisJob, AnalysisResponse } from '../../types';
import ProgressIndicator from './ProgressIndicator';
import Button from '../Common/Button';

const AsyncTestButton: React.FC = () => {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const testAsyncAnalysis = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);

      const testRequest: AnalysisRequest = {
        request_id: `test_${Date.now()}`,
        question: "ServiceNow integration failing with OAuth authentication error",
        stacktrace: "java.lang.NullPointerException\n\tat com.gainsight.integrations.servicenow.ServicenowConnectionService.updateConnection(ServicenowConnectionService.java:89)",
        logs: [
          "2025-01-24 10:30:15 ERROR [ServiceNow-OAuth] Failed to authenticate: null credential"
        ],
        user_id: 'test_user',
        created_at: new Date().toISOString()
      };

      const finalResult = await AsyncJobService.smartAnalyze(
        testRequest,
        (progressJob) => setJob(progressJob),
        (err) => setError(err.message)
      );

      setResult(finalResult);
      setJob(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
      setJob(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
      <h3 className="text-lg font-medium text-white mb-4">Async Analysis Test</h3>
      
      <Button
        onClick={testAsyncAnalysis}
        disabled={isProcessing}
        variant="primary"
        className="mb-4"
      >
        {isProcessing ? 'Testing...' : 'Test Async Analysis'}
      </Button>

      {job && <ProgressIndicator job={job} />}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg text-red-300">
          Error: {error}
        </div>
      )}
      {result && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg text-green-300">
          Success! Analysis completed.
        </div>
      )}
    </div>
  );
};

export default AsyncTestButton; 