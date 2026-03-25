import { FC, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import Logger from '../logger/Logger';

/*const isTokenExpired = (token: string) => {
    const decodedToken = JSON.parse(atob(token.split('.')[0]));
    const expiryTime = decodedToken.exp * 1000;
    return expiryTime < new Date().getTime();
}*/

interface DecodedToken {
    'custom:user_id'?: string;
    exp?: number;
    [k: string]: unknown;
}

const parseJwt = (token: string): DecodedToken | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(json) as DecodedToken;
    } catch (e) {
        Logger.warn('parseJwt failed', e);
        return null;
    }
};

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState(
        () => (typeof window !== 'undefined' ? localStorage.getItem('uid') ?? '' : '')
    );

    const uidRef = useRef(userId);
    useEffect(() => { uidRef.current = userId; }, [userId]);

    const extractUserId = useCallback((idToken: string) => {
        const decoded = parseJwt(idToken);
        return decoded?.['custom:user_id'] ?? '';
    }, []);


    const saveToken = async (accessToken: string, idToken: string, refreshToken: string): Promise<void> => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('refreshToken', refreshToken);

        const uid = extractUserId(idToken);
        localStorage.setItem('uid', uid);
        setUserId(uid);
        setIsAuthenticated(true);
    };

    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const idToken = localStorage.getItem('idToken');

            if (!accessToken && !refreshToken && !idToken) {
                return null;
            }

            if (!accessToken || !refreshToken || !idToken) {
                throw new Error('missing token(s)');
            }

            const uid = extractUserId(idToken);
            if (!uid) {
                throw new Error('uid not found in idToken');
            }

            //if (uidRef.current && uid !== uidRef.current) throw new Error('uid mismatch');
            if (uidRef.current && uid !== uidRef.current) {
                Logger.warn(
                    `Auth: uid changed from ${uidRef.current} to ${uid}, updating stored uid`
                );
            }

            if (uid !== uidRef.current) {
                localStorage.setItem('uid', uid);
                setUserId(uid);
            }

            return accessToken;
        } catch (err) {
            Logger.warn('Auth: invalid token set, logging out', err);
            await deleteToken();
            return null;
        }
    }, [extractUserId]);

    const deleteToken = async (): Promise<void> => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('uid');
        setIsAuthenticated(false);
        setUserId('');
    };

    const checkAuth = useCallback(async () => {
        const token = await getToken();
        setIsAuthenticated(!!token);
    }, [getToken]);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (alive) await checkAuth();
        })();
        return () => { alive = false; };
    }, [checkAuth]);

    const signOut = async (): Promise<void> => {
        await deleteToken();
    }

    const contextValue: AuthContextType = {
        isAuthenticated,
        userId,
        saveToken,
        getToken,
        deleteToken,
        checkAuth,
        signOut
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};