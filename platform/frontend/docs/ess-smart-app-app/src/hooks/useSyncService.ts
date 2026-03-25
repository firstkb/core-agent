import { useContext } from 'react';
import { SyncServiceContext } from '../contexts/SyncServiceContext';

export const useSyncService = () => {
    const context = useContext(SyncServiceContext);
    if (!context) {
        throw new Error('useSyncService must be used within a SyncServiceProvider');
    }
    return context;
};
