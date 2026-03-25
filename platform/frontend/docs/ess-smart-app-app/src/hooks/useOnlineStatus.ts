import { useContext } from 'react';
import { OnlineStatusContext } from '../contexts/OnlineStatusContext';

export const useOnlineStatus = (): boolean => {
    const context = useContext(OnlineStatusContext);
    if (context === undefined) {
        throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
    }
    return context;
};