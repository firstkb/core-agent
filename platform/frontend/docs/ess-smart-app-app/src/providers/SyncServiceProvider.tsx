import { FC, ReactNode, useEffect, useState, useRef, useContext } from 'react';
import { SyncServiceContext } from '../contexts/SyncServiceContext';
import { RequestContext } from "../contexts/RequestContext";
import { useDatabase } from '../hooks/useDatabase';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import Logger from '../logger/Logger';

export const SyncServiceProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const db = useDatabase();
    const isOnline = useOnlineStatus();
    const request = useContext(RequestContext);
    const isOnlineRef = useRef(isOnline);
    const [isRunning, setIsRunning] = useState(false);
    const [isRunningRecords, setIsRunningRecords] = useState(false);
    const saveTimeoutRef = useRef<number | null>(null);
    const syncLocks = new Map<string, boolean>();
    const GLOBAL_LOCK_PREFIX = 'syncLock_';

    const syncUnsyncedRecords = async () => {
        const items = await db?.formRepo.readyForSync();
        if (items && items.length > 0) {
            Logger.info("Syncing unsynced records...");
            setIsRunningRecords(true)
            for (const item of items) {

                const globalLock = await db?.systemRepo.get(GLOBAL_LOCK_PREFIX + item.guid);
                if (syncLocks.has(item.guid) || globalLock) {
                    Logger.info(`Record ${item.guid} is already syncing (global or local lock). Skipping.`);
                    continue;
                }

                syncLocks.set(item.guid, true);
                await db?.systemRepo.add(GLOBAL_LOCK_PREFIX + item.guid, { timestamp: Date.now() });

                let canProceed = true;

                if (item.parent) {
                    const formId = item.parent.mainGuid;
                    const formData = await db?.formRepo.get(formId);
                    if (formData != null && formData.id === 0 && (formData.isEdit === 1 || formData.isSynced === 0)) {
                        canProceed = false;
                    }
                }

                if (item.log.length > 1) {
                    canProceed = false;
                }

                if (!canProceed) {
                    syncLocks.delete(item.guid);
                    await db?.systemRepo.del(GLOBAL_LOCK_PREFIX + item.guid);
                    continue;
                }

                try {
                    const responseData = await request?.sendRequest(`/sync`, item, "PUT");
                    if (responseData && responseData.dataNew) {
                        const dataNew = responseData.dataNew;
                        const tableId = item.tableId;
                        item.data = dataNew;
                        item.isSynced = 1;
                        item.modified = Date.now();
                        item.operation = "server";
                        item.finish = "";
                        item.log = [];
                        item.rowstamp = dataNew['ExtDB' + tableId + '_rowstamp'];
                        item.id = dataNew['ExtDB' + tableId + '_id'];
                        await db?.formRepo.update(item.guid, item);
                    } else if (responseData) {
                        item.log.push(responseData);
                        if (item.log.length > 5) {
                            item.log = item.log.slice(-5);
                        }
                        await db?.formRepo.update(item.guid, item);
                    }
                } catch (error) {
                    Logger.error(`Failed to sync item with guid ${item.guid}:`, error);
                } finally {
                    syncLocks.delete(item.guid);
                    await db?.systemRepo.del(GLOBAL_LOCK_PREFIX + item.guid);
                }
            }
            setIsRunningRecords(false)
        }
        return;
    };

    const syncCachedImages = async () => {
        const items = await db?.fileRepo.getNoSync();
        if (items && items.length > 0) {
            Logger.debug("Syncing unsynced files...");
            for (const item of items) {

                let canProceed = true;

                if (item.mainGuid) {
                    const formId = item.mainGuid;
                    await db?.formRepo.get(formId).then(async (formData) => {
                        if (formData !== null && (formData.isEdit === 1 || formData.isSynced === 0)) {
                            canProceed = false;
                        }
                    });
                }

                if (item.log.length > 1) {
                    canProceed = false;
                }

                if (!canProceed) continue;

                try {
                    const responseData = await request?.sendRequest(`/smart/file/`, item, "POST", true);
                    if (responseData) {
                        if (responseData && responseData.dataNew) {
                            const dataNew = responseData.dataNew;
                            if (item.isDelete === 1) {
                                await db?.fileRepo.delete(item.id);
                            } else {
                                item.isSynced = 1;
                                item.source = dataNew.source;
                                item.modified = Date.now();
                                item.operation = "server";
                                item.log = [];
                                item.parentId = dataNew.parentId;
                                await db?.fileRepo.update(item.id, item);
                            }
                        } else if (responseData) {
                            item.log.push(responseData);
                            if (item.log.length > 5) {
                                item.log = item.log.slice(-5);
                            }
                            await db?.fileRepo.update(item.id, item);
                            /*if (item.log.length > 1 && typeof responseData.message !== "undefined" && responseData.message == "not found id in table") {
                                await db?.fileRepo.delete(item.id);
                            }*/
                        }
                    }
                } catch (error) {
                    Logger.error(`Failed to sync file with id ${item.id}:`, error);
                }

            }
        }
        return;
    };

    const syncSupportRecords = async () => {
        const items = await db?.supportRepo.all();
        if (items && items.length > 0) {
            Logger.info("Syncing support records...");
            setIsRunningRecords(true)
            for (const item of items) {
                Logger.debug(item);
                try {
                    const responseData = await request?.sendRequest(`/support`, item, "PUT");
                    if (responseData) {
                        if (responseData && responseData.status) {
                            await db?.supportRepo.delete(item.guid);
                        }
                    }
                } catch (error) {
                    Logger.error(`Failed to support record with guid ${item.guid}:`, error);
                }

            }
        }
        return;
    };

    const cleanupFiles = async () => {
        const filesToDelete = await db?.fileRepo.readyForDelete();
        if (filesToDelete) {
            for (const file of filesToDelete) {
                await db?.fileRepo.delete(file.id);
            }
        }
    };

    const runSyncCycle = async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        if (isRunning) return;
        setIsRunning(true);

        try {
            if (isOnlineRef.current) {
                await Promise.all([syncUnsyncedRecords(), syncCachedImages(), cleanupFiles(), syncSupportRecords()]);
            } else {
                Logger.debug("Offline, postponing sync.");
            }
        } catch (error) {
            Logger.error("Error during sync cycle:", error);
            setIsRunning(false);
            if (!saveTimeoutRef.current && isOnlineRef.current) {
                const newTimerId = window.setTimeout(() => runSyncCycle(), 10000);
                saveTimeoutRef.current = newTimerId;
                Logger.debug("Next sync cycle scheduled after error.");
            }
        } finally {
            setIsRunning(false);
            if (!saveTimeoutRef.current && isOnlineRef.current) {
                const newTimerId = window.setTimeout(() => runSyncCycle(), 10000);
                saveTimeoutRef.current = newTimerId;
                //Logger.debug("Next sync cycle scheduled.");
            }
        }
    };

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
                Logger.debug("Sync service stopped, timer cleared.");
            }
        };
    }, []);

    useEffect(() => {
        Logger.debug('Network status changed: isOnline = ', isOnline);
        isOnlineRef.current = isOnline;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        const debouncedRun = setTimeout(() => {
            runSyncCycle();
        }, 2000);
        saveTimeoutRef.current = debouncedRun;

        return () => clearTimeout(debouncedRun);
    }, [isOnline]);

    return (
        <SyncServiceContext.Provider value={{ isRunning, isRunningRecords, runSyncCycle }}>
            {children}
        </SyncServiceContext.Provider>
    );
};
