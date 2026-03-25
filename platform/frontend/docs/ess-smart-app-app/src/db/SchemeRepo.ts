import { EssDatabase } from './EssDatabase';
import logger from "../logger/Logger";

export interface ISchemeRepo {
    all(): Promise<{ key: string, value: Scheme }[]>;
    get(schemeId: string | undefined): Promise<Scheme | null>;
    add(key: string | null, data: any): Promise<void>;
    clear(): Promise<void>;
}

export interface Scheme {
    dictionary: any;
    grid: any;
    info: any;
    scheme: any;
    ui: any;
}

export class SchemeRepo implements ISchemeRepo {
    private db: EssDatabase;

    constructor(db: EssDatabase) {
        this.db = db;
    }

    async all(): Promise<{ key: string, value: Scheme }[]> {
        try {
            const schemes = await this.db.getAllData<{ key: string, value: Scheme }>('scheme');
            return schemes;
        } catch (error) {
            logger.debug("Error fetching schemes: ", error);
            return [];
        }
    }

    async get(schemeId: string | undefined): Promise<Scheme | null> {
        if (schemeId === undefined) {
            return null;
        }
        try {
            const scheme = await this.db.getData<Scheme>('scheme', schemeId);
            if (scheme) {
                return scheme;
            } else {
                logger.debug("Scheme not found with ID:", schemeId);
                return null;
            }
        } catch (error) {
            logger.debug("Error fetching scheme: ", error);
            return null;
        }
    }

    async add(key: string | null, data: any): Promise<void> {
        try {
            await this.db.addData('scheme', key, data);
        } catch (error) {
            logger.debug("Error add scheme: ", error);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.db.clearTable('scheme');
        } catch (error) {
            logger.debug("Error clear scheme: ", error);
        }
    }

}