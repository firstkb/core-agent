import { createContext } from 'react';

interface SyncServiceContextType {
    isRunning: boolean,
    isRunningRecords: boolean,
    runSyncCycle: () => void,
}

export const SyncServiceContext = createContext<SyncServiceContextType | undefined>(undefined);
