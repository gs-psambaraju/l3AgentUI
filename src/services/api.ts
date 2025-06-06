import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, APP_CONFIG } from '../utils/constants';
import { ApiError, ApiResponse } from '../types';

// Create axios instance with base configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: APP_CONFIG.apiTimeout,
});

// Request interceptor for logging and auth (if needed in future)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Response Error:', error);
    
    const apiError: ApiError = {
      message: (error.response?.data as any)?.message || error.message || 'An unknown error occurred',
      status: error.response?.status || 500,
      timestamp: new Date().toISOString(),
    };
    
    return Promise.reject(apiError);
  }
);

// Generic API wrapper function
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any
): Promise<ApiResponse<T>> => {
  const response: AxiosResponse<T> = await apiClient.request({
    method,
    url,
    data,
  });

  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
  };
};

// Specific API methods
export const api = {
  get: <T>(url: string): Promise<ApiResponse<T>> => 
    apiRequest<T>('GET', url),
    
  post: <T>(url: string, data?: any): Promise<ApiResponse<T>> => 
    apiRequest<T>('POST', url, data),
    
  put: <T>(url: string, data?: any): Promise<ApiResponse<T>> => 
    apiRequest<T>('PUT', url, data),
    
  delete: <T>(url: string): Promise<ApiResponse<T>> => 
    apiRequest<T>('DELETE', url),
}; 