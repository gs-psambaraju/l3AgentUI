import { ChatContainer } from './components/Chat/ChatContainer';
import { APP_CONFIG } from './utils/constants';
import { Sparkles, Shield, Zap } from 'lucide-react';

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Full-width dark header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              {/* Clean logo */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-lg">L3</span>
              </div>
              
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                  {APP_CONFIG.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 flex items-center space-x-1 sm:space-x-2">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Intelligent Error Diagnosis Assistant</span>
                </p>
              </div>
            </div>
            
            {/* Responsive version info */}
            <div className="text-right space-y-0.5 sm:space-y-1 flex-shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-2 justify-end">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-300">
                  <span className="hidden sm:inline">Version </span>{APP_CONFIG.version}
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-500 justify-end">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 flex-shrink-0" />
                <span className="hidden sm:inline">Gainsight L3 Engineering</span>
                <span className="sm:hidden">Gainsight</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width main content area */}
      <main className="flex-1 overflow-hidden bg-gray-900">
        <div className="h-full px-1 sm:px-2 lg:px-4">
          <ChatContainer />
        </div>
      </main>

      {/* Full-width footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-2 sm:py-3">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs space-y-1 sm:space-y-0">
            <span className="text-gray-400 text-center sm:text-left">
              © 2025 Gainsight. Powered by L3 Agent AI.
            </span>
            <span className="text-gray-500 flex items-center justify-center sm:justify-end space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-center sm:text-right">
                <span className="hidden sm:inline">Reducing L3 escalations through intelligent diagnosis</span>
                <span className="sm:hidden">Intelligent L3 diagnosis</span>
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;