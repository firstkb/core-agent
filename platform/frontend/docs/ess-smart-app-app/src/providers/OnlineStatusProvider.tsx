import {FC,  useState, useEffect, ReactNode } from 'react';
import { OnlineStatusContext } from '../contexts/OnlineStatusContext';

interface OnlineStatusProviderProps {
    children: ReactNode;
}

export const OnlineStatusProvider: FC<OnlineStatusProviderProps> = ({ children }) => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <OnlineStatusContext.Provider value={isOnline}>
            {children}
        </OnlineStatusContext.Provider>
    );
};
