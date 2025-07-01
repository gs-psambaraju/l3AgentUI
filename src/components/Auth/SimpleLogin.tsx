import { Shield, Chrome, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '../../utils/constants';

interface SimpleLoginProps {
  onLogin: () => void;
  loading: boolean;
  error: string | null;
}

export const SimpleLogin = ({ onLogin, loading, error }: SimpleLoginProps) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">L3</span>
          </div>
          <h2 className="text-3xl font-bold text-white">
            {APP_CONFIG.name}
          </h2>
          <p className="mt-2 text-gray-400 flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Intelligent Error Diagnosis Assistant</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome Back
              </h3>
              <p className="text-gray-300 text-sm">
                Sign in with your Gainsight account to continue
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-md p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={onLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-900 font-medium py-3 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Secure authentication via Google OAuth 2.0
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Version {APP_CONFIG.version} • Gainsight L3 Engineering
          </p>
        </div>
      </div>
    </div>
  );
}; 