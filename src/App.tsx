import React from 'react';
import { ChatContainer } from './components/Chat/ChatContainer';
import { SimpleLogin } from './components/Auth/SimpleLogin';
import { UserHeader } from './components/Auth/UserHeader';
import { AuthService, AuthUser } from './services/authService';
import { APP_CONFIG } from './utils/constants';
import { Sparkles, Shield, Zap, Loader2 } from 'lucide-react';

interface AppState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

class App extends React.Component<{}, AppState> {
  private authService = AuthService.getInstance();

  constructor(props: {}) {
    super(props);
    this.state = {
      isAuthenticated: false,
      user: null,
      loading: true,
      error: null,
    };
  }

  async componentDidMount() {
    await this.initializeAuth();
    this.handleOAuthCallback();
  }

  private async initializeAuth() {
    try {
      const token = this.authService.getToken();
      const user = this.authService.getUser();
      
      if (token && user) {
        this.setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
      this.setState({
        loading: false,
        error: 'Failed to initialize authentication',
      });
    }
  }

  private async handleOAuthCallback() {
    if (this.authService.isCallbackPage() && !this.state.isAuthenticated) {
      const code = this.authService.getAuthCodeFromUrl();
      if (code) {
        try {
          this.setState({ loading: true, error: null });
          const { token, user } = await this.authService.handleCallback(code);
          
          this.setState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });

          // Clean up URL
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, document.title, url.pathname);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          this.setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: errorMessage,
          });
        }
      }
    }
  }

  private handleLogin = async () => {
    try {
      this.setState({ loading: true, error: null });
      await this.authService.initiateLogin();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.setState({
        loading: false,
        error: errorMessage,
      });
    }
  };

  private handleLogout = async () => {
    try {
      this.setState({ loading: true });
      await this.authService.logout();
      this.setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      this.setState({ loading: false });
    }
  };

  render() {
    const { isAuthenticated, user, loading, error } = this.state;

    // Show loading screen
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-white font-bold text-2xl">L3</span>
            </div>
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
      return (
        <SimpleLogin
          onLogin={this.handleLogin}
          loading={loading}
          error={error}
        />
      );
    }

        // Show main app if authenticated
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
              
              {/* User info and logout */}
              <div className="flex-shrink-0">
                {user && <UserHeader user={user} onLogout={this.handleLogout} />}
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
}

export default App;