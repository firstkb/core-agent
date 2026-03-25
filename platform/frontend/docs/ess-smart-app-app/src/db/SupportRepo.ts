import { EssDatabase } from './EssDatabase';
import logger from "../logger/Logger";

export interface ISupportRepo {
    all(): Promise<Support[]>;
    add(id: string, data: Support): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface Support {
    guid: string;
    type: string;
    priority: string;
    description: string;
    version: string;
}

export class SupportRepo implements ISupportRepo {
    private db: EssDatabase;

    constructor(db: EssDatabase) {
        this.db = db;
    }


    async all(): Promise<Support[]> {
        try {
            const items = await this.db.getAllData<Support>('support');
            return items;
        } catch (error) {
            logger.debug("Error fetching support: ", error);
            return [];
        }
    }

    async add(id: string, data: Support): Promise<void> {
        try {
            await this.db.addData('support', id, data);
        } catch (error) {
            logger.debug("Error adding support: ", error);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.db.deleteData('support', id);
        } catch (error) {
            logger.debug("Error deleting support: ", error);
        }
    }
}
