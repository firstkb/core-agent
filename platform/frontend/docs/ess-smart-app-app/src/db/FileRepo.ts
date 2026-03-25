import { EssDatabase } from './EssDatabase';
import logger from "../logger/Logger";

export interface IFileRepo {
    get(id: string): Promise<File | null>;
    add(id: string, data: File): Promise<void>;
    getFromMainGuid(id: string): Promise<File[] | null>;
    getFromParentGuid(id: string): Promise<File[] | null>;
    getFromParentId(id: string): Promise<File[] | null>;
    getNoSync(): Promise<File[] | null>;
    readyForDelete(): Promise<File[] | null>;
    delete(id: string): Promise<void>;
    update(id: string, data: File): Promise<void>;
}

export interface Parent {
    mainGuid: string;
    mainTable: string;
    table: string;
    guid: string;
}

export interface File {
    id: string;
    parentId: number;
    parentGuid: string;
    mainGuid: string;
    name: string;
    isSynced: number;  // 1 - true, 0 - false
    isDelete: number;  // 1 - true, 0 - false
    table: string;
    modified: number;
    created: number;
    operation: string;
    source: string;
    log: any[];
    parent?: Parent;
}

export class FileRepo implements IFileRepo {
    private db: EssDatabase;

    constructor(db: EssDatabase) {
        this.db = db;
    }

    async get(id: string): Promise<File | null> {
        try {
            const data = await this.db.getData<File>('files', id);
            return data || null;
        } catch (error) {
            logger.debug("Error adding file: ", error);
            return null;
        }
    }

    async add(id: string, data: File): Promise<void> {
        try {
            await this.db.addData('files', id, data);
        } catch (error) {
            logger.debug("Error adding file: ", error);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.db.deleteData('files', id);
        } catch (error) {
            logger.debug("Error deleting files: ", error);
        }
    }

    async update(id: string, data: File): Promise<void> {
        try {
            await this.db.updateData('files', id, data);
        } catch (error) {
            logger.debug("Error updating file: ", error);
        }
    }

    async getFromParentGuid(id: string): Promise<File[] | null> {
        try {
            const data = await this.db.getFileIndex('files', 'parentGuid', id);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching files by parentGuid: ", error);
            return null;
        }
    }

    async getFromMainGuid(id: string): Promise<File[] | null> {
        try {
            const data = await this.db.getFileIndex('files', 'mainGuid', id);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching files by mainGuid: ", error);
            return null;
        }
    }

    async getFromParentId(id: string): Promise<File[] | null> {
        try {
            const data = await this.db.getFileIndex('files', 'parentId', id);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching files by parentId: ", error);
            return null;
        }
    }

    async getNoSync(): Promise<File[] | null> {
        try {
            const data = await this.db.getFileIndex('files', 'isSynced', 0);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching files by isSynced: ", error);
            return null;
        }
    }

    async readyForDelete(): Promise<File[] | null> {
        try {
            const data = await this.db.getFileIndex('files', '[isSynced+isDelete]', [1, 1]);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching file by index: ", error);
            return null;
        }
    }

}