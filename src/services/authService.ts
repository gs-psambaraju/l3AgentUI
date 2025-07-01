import { api } from './api';

export interface AuthUser {
  userId: string;
  userName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  authUrl: string;
}

export interface CallbackResponse {
  token: string;
  message: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const TOKEN_KEY = 'l3agent_auth_token';
const USER_KEY = 'l3agent_user';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Get stored authentication token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Get stored user information
  getUser(): AuthUser | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Store authentication token
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Store user information
  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get Google OAuth URL
  async getAuthUrl(): Promise<string> {
    try {
      const response = await api.get<LoginResponse>('/v1/login');
      return response.data.authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      throw error;
    }
  }

  // Handle OAuth callback
  async handleCallback(code: string): Promise<{ token: string; user: AuthUser }> {
    try {
      const response = await api.get<CallbackResponse>(`/v1/login/callback?code=${code}`);
      const { token } = response.data;
      
      // Store token
      this.setToken(token);
      
      // Decode JWT to get user info (basic decode, not verification)
      const user = this.decodeToken(token);
      this.setUser(user);
      
      return { token, user };
    } catch (error) {
      console.error('Failed to handle callback:', error);
      throw error;
    }
  }

  // Basic JWT decode (for extracting user info, not for verification)
  private decodeToken(token: string): AuthUser {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.sub,
        userName: payload.name || '',
        email: payload.email || '',
        role: payload.role || 'user'
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      throw new Error('Invalid token format');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    this.clearAuth();
    // Redirect to login
    window.location.href = '/';
  }

  // Initiate login flow
  async initiateLogin(): Promise<void> {
    try {
      const authUrl = await this.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate login:', error);
      throw error;
    }
  }

  // Check if current page is callback
  isCallbackPage(): boolean {
    return window.location.pathname.includes('/callback') || 
           new URLSearchParams(window.location.search).has('code');
  }

  // Get authorization code from URL
  getAuthCodeFromUrl(): string | null {
    return new URLSearchParams(window.location.search).get('code');
  }
} 