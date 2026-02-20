import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

export type KYCStatus = 'unverified' | 'pending' | 'verified';

export interface UserProfile {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    kycStatus: KYCStatus;
    twoFactorEnabled: boolean;
    isAdmin: boolean;
    preferredVault?: string;
    phoneNumber?: string;
    address?: {
        street: string;
        city: string;
        zipCode: string;
        country: string;
    };
    walletBalance: number;
}

interface AuthContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (tokens: { access: string; refresh: string }) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.get('/users/profile/me/');
            // Transform backend snake_case to frontend camelCase if needed
            // Or assume backend serializes as is (it does snake_case by default usually)
            // But we can map it here.

            const userData = response.data;
            const addressData = userData.addresses?.[0];
            const mappedUser: UserProfile = {
                id: userData.id,
                email: userData.email,
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                isEmailVerified: userData.is_email_verified,
                kycStatus: userData.kyc_status,
                twoFactorEnabled: userData.two_factor_enabled,
                isAdmin: userData.is_staff,
                preferredVault: userData.preferred_vault,
                phoneNumber: userData.phone_number,
                address: addressData ? {
                    street: addressData.street,
                    city: addressData.city,
                    zipCode: addressData.zip_code,
                    country: addressData.country,
                } : undefined,
                walletBalance: Number(userData.wallet?.cash_balance || 0)
            };

            setUser(mappedUser);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (tokens: { access: string; refresh: string }) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        await checkAuth();
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (updates: Partial<UserProfile>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoading,
            login,
            logout,
            checkAuth,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
