import logger from "../logger/Logger";
import { EssDatabase } from "./EssDatabase";

export interface IDictionaryRepo {
  add(key: string | null, data: any): Promise<void>;
  clear(): Promise<void>;
  all(): Promise<{ key: string, value: any }[]>;
  getAllCache(): Promise<{ [key: string]: any }>;
}

export class DictionaryRepo implements IDictionaryRepo {
  private db: EssDatabase;
  private dictionaryCache = new Map<string, any>();

  constructor(db: EssDatabase) {
    this.db = db;
  }

  /*async all(): Promise<{ [key: string]: any }> {
      try {
        const dictionaries = await this.db.getAllDataWithKeys<{ key: string; value: any }>('dictionary');
        return dictionaries;
      } catch (error) {
        logger.debug("Error fetching dictionaries: ", error);
        return {};
      }
  }*/

  async all(): Promise<{ key: string, value: any }[]> {
    try {
      const dictionaries = await this.db.getAllData<{ key: string, value: any }>('dictionary');
      return dictionaries;
    } catch (error) {
      logger.debug("Error fetching dictionaries: ", error);
      return [];
    }
  }

  async add(key: string | null, data: any): Promise<void> {
    try {
      await this.db.addData('dictionary', key, data);
    } catch (error) {
      logger.debug("Error add dictionarie: ", error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.db.clearTable('dictionary');
    } catch (error) {
      logger.debug("Error clear dictionarie: ", error);
    }
  }

  async getAllCache(): Promise<{ [key: string]: any }> {
    if (this.dictionaryCache.size > 0) {
      return Object.fromEntries(this.dictionaryCache);
    }

    try {
      await this.db.isReady;
      const dictionaries = await this.db.getAllDataWithKeys<{ key: string; value: any }>('dictionary');

      Object.entries(dictionaries).forEach(([key, value]) => {
        this.dictionaryCache.set(key, value);
      });

      return dictionaries;
    } catch (error) {
      logger.debug("Error fetching dictionaries: ", error);
      return {};
    }
  }

}