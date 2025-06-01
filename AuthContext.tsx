import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiClient from '@/api/client'; // Assuming your API client is set up

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin'; // Example roles
  avatar?: string;
  // Add any other user-specific fields
}

// Define token structure (example)
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp for access token expiry
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Global loading state for auth operations
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (registrationData: RegistrationData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (resetData: PasswordResetData) => Promise<void>;
  checkAuth: () => Promise<boolean>; // Function to check auth status, e.g., on app load
  error: string | null; // Store auth-related errors
  clearError: () => void;
}

// Login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data type
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

// Password reset data type
export interface PasswordResetData {
  token: string; // Password reset token from email
  newPassword: string;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  checkAuth: async () => false,
  error: null,
  clearError: () => {},
});

// Hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_accessToken';
const REFRESH_TOKEN_KEY = 'auth_refreshToken';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRES_AT_KEY = 'auth_tokenExpiresAt';

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  const clearError = () => setError(null);

  const storeTokens = (newTokens: AuthTokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newTokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newTokens.refreshToken);
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, newTokens.expiresAt.toString());
    setTokens(newTokens);
    // Update apiClient headers
    if (apiClient.defaults.headers) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
    }
  };

  const clearStoredTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    setTokens(null);
    // Remove Authorization header from apiClient
    if (apiClient.defaults.headers) {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  };

  const storeUser = (userData: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const clearStoredUser = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const fetchUserProfile = async (accessToken: string): Promise<User | null> => {
    // In a real app, fetch user profile from /api/me or similar endpoint
    // For now, we'll use a mock user if we have a token
    console.log('Fetching user profile with token:', accessToken); // Keep for debug
    // const response = await apiClient.get('/api/auth/me');
    // return response.data.user as User;
    
    // Mock user profile fetch
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) {
          resolve(JSON.parse(storedUser) as User);
        } else {
          // Fallback mock user if not in localStorage but token exists
          resolve({
            id: 'mock-user-id-' + Date.now(),
            name: 'Demo User',
            email: 'demo@example.com',
            role: 'user',
            avatar: `https://i.pravatar.cc/150?u=demo@example.com`,
          });
        }
      }, 500);
    });
  };

  const refreshToken = useCallback(async (): Promise<AuthTokens | null> => {
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefreshToken) {
      console.log('No refresh token available for refresh.');
      return null;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to refresh token...');
      // In a real app, this would be an API call to refresh the token
      // const response = await apiClient.post('/api/auth/refresh-token', { refreshToken: currentRefreshToken });
      // const newTokens = response.data.tokens as AuthTokens;

      // Mock token refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      const newTokens: AuthTokens = {
        accessToken: 'refreshed-mock-jwt-access-token-' + Date.now(),
        refreshToken: 'refreshed-mock-jwt-refresh-token-' + Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000), // Expires in 1 hour
      };
      
      storeTokens(newTokens);
      console.log('Token refreshed successfully.');
      return newTokens;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, logout the user
      logout();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);


  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);

      if (!accessToken || !expiresAt) {
        console.log('No access token or expiry found.');
        clearStoredUser();
        clearStoredTokens();
        return false;
      }

      if (Date.now() >= parseInt(expiresAt, 10)) {
        console.log('Access token expired, attempting refresh...');
        const newTokens = await refreshToken();
        if (!newTokens) {
          console.log('Token refresh failed, user not authenticated.');
          return false;
        }
        // If refresh was successful, new tokens are stored, proceed to fetch user
      }
      
      // At this point, we should have a valid (or newly refreshed) access token
      const currentAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!currentAccessToken) { // Should not happen if refresh worked
          return false;
      }

      const userData = await fetchUserProfile(currentAccessToken);
      if (userData) {
        storeUser(userData);
        // Ensure apiClient headers are set with current token
        if (apiClient.defaults.headers) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentAccessToken}`;
        }
        return true;
      } else {
        // Failed to fetch user profile even with a token
        logout(); // Clear inconsistent state
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout(); // Ensure clean state on error
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up interval for automatic token refresh before expiry
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const scheduleTokenRefresh = () => {
      const expiresAtString = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
      if (expiresAtString) {
        const expiresAt = parseInt(expiresAtString, 10);
        // Refresh 5 minutes before expiry, or immediately if already past that point but not yet expired
        const refreshTime = expiresAt - (5 * 60 * 1000); 
        const now = Date.now();
        
        if (refreshTime > now) {
          const timeoutDuration = refreshTime - now;
          console.log(`Scheduling token refresh in ${Math.round(timeoutDuration / 1000 / 60)} minutes.`);
          refreshInterval = setTimeout(async () => {
            console.log('Attempting scheduled token refresh...');
            await refreshToken();
            scheduleTokenRefresh(); // Reschedule after successful refresh
          }, timeoutDuration);
        } else if (expiresAt > now) { // Token is close to expiry or past refresh time but not expired
            console.log('Token is close to expiry, attempting immediate refresh...');
            refreshToken().then(() => scheduleTokenRefresh());
        } else {
            console.log('Token already expired, auth check will handle it.');
        }
      }
    };

    if (isAuthenticated) {
      scheduleTokenRefresh();
    }

    return () => {
      if (refreshInterval) {
        clearTimeout(refreshInterval);
      }
    };
  }, [isAuthenticated, refreshToken, tokens]);


  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call to authenticate
      // const response = await apiClient.post('/api/auth/login', credentials);
      // const { tokens: apiTokens, user: apiUser } = response.data;

      // Mock successful login for development
      if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
        const apiTokens: AuthTokens = {
          accessToken: 'mock-jwt-access-token-' + Date.now(),
          refreshToken: 'mock-jwt-refresh-token-' + Date.now(),
          expiresAt: Date.now() + (60 * 60 * 1000), // Expires in 1 hour
        };
        const apiUser: User = {
          id: '1',
          name: 'Demo User',
          email: credentials.email,
          role: 'user',
          avatar: `https://i.pravatar.cc/150?u=${credentials.email}`,
        };
        
        storeTokens(apiTokens);
        storeUser(apiUser);
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login failed:', err);
      throw new Error(errorMessage); // Re-throw for the component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (registrationData: RegistrationData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call to register
      // const response = await apiClient.post('/api/auth/register', registrationData);
      // const { tokens: apiTokens, user: apiUser } = response.data;
      
      // Mock successful registration
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const apiTokens: AuthTokens = {
        accessToken: 'mock-jwt-access-token-register-' + Date.now(),
        refreshToken: 'mock-jwt-refresh-token-register-' + Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000), // Expires in 1 hour
      };
      const apiUser: User = {
        id: 'new-user-' + Date.now(),
        name: registrationData.name,
        email: registrationData.email,
        role: 'user',
        avatar: `https://i.pravatar.cc/150?u=${registrationData.email}`,
      };
      
      storeTokens(apiTokens);
      storeUser(apiUser);
      // Typically, after registration, the user is logged in.
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration failed:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setIsLoading(true); // Indicate loading during logout process
    clearStoredTokens();
    clearStoredUser();
    // In a real app, you might want to call a /api/auth/logout endpoint
    // await apiClient.post('/api/auth/logout');
    console.log('User logged out.');
    setIsLoading(false);
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app: await apiClient.post('/api/auth/forgot-password', { email });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      console.log(`Password reset email sent to ${email}`);
      // Usually, you don't log the user in or out here, just send an email.
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset request failed.';
      setError(errorMessage);
      console.error('Forgot password failed:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (resetData: PasswordResetData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app: await apiClient.post('/api/auth/reset-password', resetData);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      console.log('Password has been reset.');
      // Optionally, log the user in after successful password reset, or redirect to login.
      // For now, we'll just clear any existing session.
      logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed.';
      setError(errorMessage);
      console.error('Reset password failed:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isAuthenticated = !!user && !!tokens?.accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        checkAuth,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
