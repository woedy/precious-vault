import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { setTokens, clearTokens, isAuthenticated, getUserFromToken } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUserFromToken();
        if (userData && userData.user_id && userData.email) {
          setUser({
            id: userData.user_id,
            email: userData.email,
            first_name: (userData.first_name as string) || '',
            last_name: (userData.last_name as string) || '',
            is_staff: (userData.is_staff as boolean) || false,
            is_superuser: (userData.is_superuser as boolean) || false,
          });
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Call the JWT create endpoint
      const response = await axios.post('/api/auth/jwt/create/', {
        email,
        password,
      });

      const { access, refresh } = response.data;

      // Store tokens
      setTokens(access, refresh);

      // Decode token to get user info
      const userData = getUserFromToken();
      
      // Verify user has admin privileges
      if (!userData || !userData.user_id || !userData.email) {
        clearTokens();
        throw new Error('Invalid token data');
      }

      if (!userData.is_staff && !userData.is_superuser) {
        clearTokens();
        throw new Error('Insufficient permissions. Admin access required.');
      }

      setUser({
        id: userData.user_id,
        email: userData.email,
        first_name: (userData.first_name as string) || '',
        last_name: (userData.last_name as string) || '',
        is_staff: (userData.is_staff as boolean) || false,
        is_superuser: (userData.is_superuser as boolean) || false,
      });
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  const logout = (): void => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
