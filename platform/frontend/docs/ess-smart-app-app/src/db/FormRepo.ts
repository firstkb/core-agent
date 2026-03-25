import { EssDatabase } from './EssDatabase';
import logger from "../logger/Logger";

export interface IFormRepo {
    get(id: string): Promise<Form | null>;
    readyForSync(): Promise<Form[] | null>;
    notIsSynced(): Promise<Form[] | null>;
    getFromTableId(id: string): Promise<Form[] | null>;
    getFromPageId(id: string): Promise<Form[] | null>;
    update(id: string, data: Form): Promise<void>;
    add(id: string, data: Form): Promise<void>;
    delete(id: string): Promise<void>;
    countByPageIds(ids: string[]): Promise<Record<string, number>>;
}

export interface Parent {
    mainGuid: string;
    mainTable: string;
    table: string;
    guid: string;
}

export interface Form {
    id: number;
    guid: string;
    pageId: string;
    isSynced: number;  // 1 - true, 0 - false
    isEdit: number;    // 1 - true, 0 - false
    isValid: number;    // 1 - true, 0 - false
    isReadOnly: number; // 1 - true, 0 - false
    tableId: string;
    modified: number;
    created: number;
    operation: string;
    rowstamp: string;
    data: any;
    finish: string;
    log: any[];
    parent?: Parent;
}

export class FormRepo implements IFormRepo {
    private db: EssDatabase;

    constructor(db: EssDatabase) {
        this.db = db;
    }

    async get(id: string): Promise<Form | null> {
        try {
            const data = await this.db.getData<Form>('forms', id);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching form: ", error);
            return null;
        }
    }

    async readyForSync(): Promise<Form[] | null> {
        try {
            const data = await this.db.getFormIndex('forms', '[isSynced+isEdit+isValid]', [0, 0, 1]);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching forms by index: ", error);
            return null;
        }
    }

    async notIsSynced(): Promise<Form[] | null> {
        try {
            const data = await this.db.getFormIndex('forms', 'isSynced', 0);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching forms by index: ", error);
            return null;
        }
    }

    async getFromTableId(id: string): Promise<Form[] | null> {
        try {
            const data = await this.db.getFormIndex('forms', 'tableId', id);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching forms by tableId: ", error);
            return null;
        }
    }

    async getFromPageId(id: string): Promise<Form[] | null> {
        try {
            const data = await this.db.getFormIndex('forms', 'pageId', id);
            return data || null;
        } catch (error) {
            logger.debug("Error fetching forms by pageId: ", error);
            return null;
        }
    }

    async update(id: string, data: Form): Promise<void> {
        try {
            await this.db.updateData('forms', id, data);
        } catch (error) {
            logger.debug("Error updating form: ", error);
        }
    }

    async add(id: string, data: Form): Promise<void> {
        try {
            await this.db.addData('forms', id, data);
        } catch (error) {
            logger.debug("Error adding form: ", error);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.db.deleteData('forms', id);
        } catch (error) {
            logger.debug("Error deleting form: ", error);
        }
    }

    async countByPageIds(ids: string[]): Promise<Record<string, number>> {
        try {
            const result: Record<string, number> = {};
            for (const id of ids) {
                const rows = await this.db.getFormIndex('forms', 'pageId', id);
                result[id] = rows ? rows.length : 0;
            }
            return result;
        } catch (e) {
            logger.debug('Error counting forms by pageId', e);
            return {};
        }
    }
}
