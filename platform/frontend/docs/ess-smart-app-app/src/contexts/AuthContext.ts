import { createContext } from 'react';

export type AuthContextType = {
    isAuthenticated: boolean;
    userId: string;
    saveToken: (token: string, idToken: string, refreshToken: string) => Promise<void>;
    getToken: () => Promise<string | null>;
    deleteToken: () => Promise<void>;
    checkAuth: () => Promise<void>;
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);