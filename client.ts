import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5678';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Authentication interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    config.headers = {
      ...config.headers,
      'X-Request-ID': generateRequestId(),
    };
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle token expiration and refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token logic would go here
        // const refreshToken = localStorage.getItem('refresh_token');
        // const response = await refreshTokenCall(refreshToken);
        // localStorage.setItem('auth_token', response.data.token);
        
        // For now, just log out the user on 401
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Format error response
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      code: error.code,
      details: error.response?.data,
    };
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`API Error [${originalRequest.method?.toUpperCase()}] ${originalRequest.url}:`, apiError);
    }
    
    // Implement retry logic for network errors or 5xx
    if (
      (error.code === 'ECONNABORTED' || 
       error.code === 'ERR_NETWORK' || 
       (error.response && error.response.status >= 500)) && 
      (!originalRequest._retry || (originalRequest._retry && originalRequest._retry < MAX_RETRIES))
    ) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      // Exponential backoff
      const delay = 1000 * Math.pow(2, originalRequest._retry - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(originalRequest);
    }
    
    return Promise.reject(apiError);
  }
);

// Helper functions
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function extractErrorMessage(error: AxiosError): string {
  if (error.response?.data && typeof error.response.data === 'object') {
    // Try to extract error message from response data
    const data = error.response.data as Record<string, any>;
    if (data.message) return data.message;
    if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  }
  
  // Default error messages based on status code
  if (error.response) {
    switch (error.response.status) {
      case 400: return 'Bad request. Please check your input.';
      case 401: return 'Unauthorized. Please log in again.';
      case 403: return 'Forbidden. You do not have permission to access this resource.';
      case 404: return 'Resource not found.';
      case 422: return 'Validation error. Please check your input.';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Server error. Please try again later.';
      default: return `Error ${error.response.status}: ${error.message}`;
    }
  }
  
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
  
  return error.message || 'An unknown error occurred';
}

// API service factory
export function createApiService<T>(basePath: string) {
  return {
    getAll: async (params?: Record<string, any>): Promise<ApiResponse<T[]>> => {
      const response = await apiClient.get<T[]>(basePath, { params });
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    },
    
    getById: async (id: string | number): Promise<ApiResponse<T>> => {
      const response = await apiClient.get<T>(`${basePath}/${id}`);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    },
    
    create: async (data: Partial<T>): Promise<ApiResponse<T>> => {
      const response = await apiClient.post<T>(basePath, data);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    },
    
    update: async (id: string | number, data: Partial<T>): Promise<ApiResponse<T>> => {
      const response = await apiClient.put<T>(`${basePath}/${id}`, data);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    },
    
    delete: async (id: string | number): Promise<ApiResponse<void>> => {
      const response = await apiClient.delete(`${basePath}/${id}`);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    },
    
    custom: async <R>(
      method: 'get' | 'post' | 'put' | 'delete' | 'patch',
      path: string,
      data?: any,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<R>> => {
      const fullPath = path.startsWith('/') ? path : `${basePath}/${path}`;
      const response = await apiClient.request<R>({
        method,
        url: fullPath,
        data: ['post', 'put', 'patch'].includes(method) ? data : undefined,
        params: method === 'get' ? data : undefined,
        ...config,
      });
      
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    },
  };
}

export default apiClient;
