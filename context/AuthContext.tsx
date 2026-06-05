
// context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { AuthProviderType, UserProfile } from '../types/auth';
import { usePersistedState } from '../hooks/usePersistedState';
import { audioService } from '../services/audioService';

interface AuthContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: AuthProviderType) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock User Data Generators
const mockUsers: Record<AuthProviderType, Partial<UserProfile>> = {
    github: {
        name: 'Dev_Architect',
        email: 'architect@github.user',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+Architect&background=0D1117&color=fff',
    },
    google: {
        name: 'Studio Admin',
        email: 'admin@studio.user',
        avatarUrl: 'https://ui-avatars.com/api/?name=Studio+Admin&background=DB4437&color=fff',
    },
    microsoft: {
        name: 'Corp User',
        email: 'user@corp.microsoft',
        avatarUrl: 'https://ui-avatars.com/api/?name=Corp+User&background=00A4EF&color=fff',
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Persist user session
    const [user, setUser] = usePersistedState<UserProfile | null>('auth_user_session', null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback(async (provider: AuthProviderType) => {
        setIsLoading(true);
        audioService.playSound('click');
        
        // Simulate OAuth network delay and handshake
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const mockUser: UserProfile = {
                    id: `${provider}_${Math.random().toString(36).substr(2, 9)}`,
                    provider,
                    role: 'developer',
                    ...mockUsers[provider]
                } as UserProfile;

                setUser(mockUser);
                setIsLoading(false);
                audioService.playSound('success');
                resolve();
            }, 2000); // 2 second simulation
        });
    }, [setUser]);

    const logout = useCallback(() => {
        setUser(null);
        audioService.playSound('tab_switch');
    }, [setUser]);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
