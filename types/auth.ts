
export type AuthProviderType = 'github' | 'google' | 'microsoft';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    provider: AuthProviderType;
    role: 'user' | 'admin' | 'developer';
}

export interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading: boolean;
    error: string | null;
}
