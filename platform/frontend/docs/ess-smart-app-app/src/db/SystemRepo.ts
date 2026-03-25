import logger from "../logger/Logger";
import { EssDatabase } from "./EssDatabase";

export interface ISystemRepo {
    all(): Promise<{ key: string, value: string }[]>;
    allByPrefix(prefix: string): Promise<{ key: string; value: string }[]>;
    add(key: string | null, data: any): Promise<void>;
    del(key: string): Promise<void>;
    get(key: string): Promise<any>;
    clear(): Promise<void>;
    clearByPrefix(prefix: string): Promise<void>;
}

export class SystemRepo implements ISystemRepo {
    private db: EssDatabase;

    constructor(db: EssDatabase) {
        this.db = db;
    }

    async all(): Promise<{ key: string, value: string }[]> {
        try {
            const obj = await this.db.getAllDataWithKeys<{ key: string; value: string }>("system");
            const result = Object.entries(obj).map(([key, value]) => ({
                key,
                value: typeof value === "string" ? value : JSON.stringify(value)
            }));

            return result;
        } catch (error) {
            logger.debug("Error fetching system: ", error);
            return [];
        }
    }

    async allByPrefix(prefix: string): Promise<{ key: string; value: string }[]> {
        const data = await this.all();
        return data.filter(({ key }) => key.startsWith(prefix));
    }


    async add(key: string | null, data: any): Promise<void> {
        try {
            await this.db.addData('system', key, data);
        } catch (error) {
            logger.debug("Error adding system: ", error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.db.deleteData('system', key);
        } catch (error) {
            logger.debug("Error deleting system: ", error);
        }
    }

    async get(key: string): Promise<any> {
        try {
            return await this.db.getData('system', key);
        } catch (error) {
            logger.debug("Error getting system: ", error);
            return null;
        }
    }

    async clear(): Promise<void> {
        try {
            await this.db.clearTable('system');
        } catch (error) {
            logger.debug("Error clear system: ", error);
        }
    }

    async clearByPrefix(prefix: string): Promise<void> {
        try {
            const items = await this.allByPrefix(prefix);
            await Promise.all(items.map(({ key }) => this.db.deleteData("system", key)));
        } catch (error) {
            logger.debug("Error clear system by prefix: ", error);
        }
    }

}