import Dexie, { PromiseExtended } from 'dexie';
import Logger from "../logger/Logger";

import { FormRepo, IFormRepo, Form } from './FormRepo';
import { FileRepo, IFileRepo, File } from './FileRepo';
import { SupportRepo, ISupportRepo, Support } from './SupportRepo';
import { DictionaryRepo, IDictionaryRepo } from './DictionaryRepo';
import { SchemeRepo, ISchemeRepo } from './SchemeRepo';
import { UserRepo, IUserRepo } from './UserRepo';
import { SystemRepo, ISystemRepo } from './SystemRepo';

export interface BaseData {
  key: string;
  value: any;
}

interface SystemData extends BaseData {
  value: string;
}

const DB_VERSION = 8;
export class EssDatabase extends Dexie {
  system: Dexie.Table<BaseData, string>;
  scheme: Dexie.Table<BaseData, string>;
  dictionary: Dexie.Table<BaseData, string>;
  forms: Dexie.Table<Form, number>;
  files: Dexie.Table<File, number>;
  support: Dexie.Table<Support, number>;
  isReady: PromiseExtended<Dexie>;

  formRepo: IFormRepo;
  fileRepo: IFileRepo;
  dictionaryRepo: IDictionaryRepo;
  schemeRepo: ISchemeRepo;
  userRepo: IUserRepo;
  systemRepo: ISystemRepo;
  supportRepo: ISupportRepo;

  constructor(userId: string = "") {
    const userDbName = userId ? "ess_smart_" + userId : "ess_smart";
    super(userDbName);
    this.version(DB_VERSION).stores({
      system: '',
      scheme: '&key',
      dictionary: '&key',
      forms: '&,guid,id,pageId,tableId,isSynced,isEdit,isReadOnly,[isSynced+isEdit+isValid]',
      files: '&,id,mainGuid,parentId,parentGuid,table,isSynced,isDelete,[isSynced+isDelete]',
      support: '&'
    }).upgrade(async (transaction) => {
      const forms = transaction.table<Form>('forms');
      await forms.toCollection().modify((form) => {
        if (form.isValid === undefined) {
          form.isValid = 1;
        }
      });
    });

    Logger.debug("DB version", DB_VERSION, "user_id", userId);

    this.system = this.table("system");
    this.scheme = this.table("scheme");
    this.dictionary = this.table("dictionary");
    this.forms = this.table("forms");
    this.files = this.table("files");
    this.support = this.table("support");

    this.isReady = this.open();

    // init services
    this.formRepo = new FormRepo(this);
    this.fileRepo = new FileRepo(this);
    this.dictionaryRepo = new DictionaryRepo(this);
    this.schemeRepo = new SchemeRepo(this);
    this.userRepo = new UserRepo(this);
    this.systemRepo = new SystemRepo(this);
    this.supportRepo = new SupportRepo(this);
  }

  async addData<T>(tableName: keyof EssDatabase, key: string | null, value: T) {
    const table = this.table<T, string>(tableName);
    if (key === null) {
      await table.put(value);
    } else {
      await table.put(value, key);
    }
  }

  async getData<T>(tableName: keyof EssDatabase, key: number | string): Promise<T | undefined> {
    const table = this.table<T, number | string>(tableName);
    return table.get(key);
  }

  async updateData(tableName: keyof EssDatabase, key: number | string, value: Partial<SystemData | BaseData | Form | File>) {
    const table = this.table(tableName);
    await table.update(key, value);
  }

  async getFormIndex(storeName: keyof EssDatabase, indexName: keyof Form | '[isSynced+isEdit+isValid]', key: any) {
    const table = this.table(storeName);
    return table.where(indexName).equals(key).toArray();
  }

  async getFileIndex(storeName: keyof EssDatabase, indexName: keyof File | '[isSynced+isDelete]', key: any) {
    const table = this.table(storeName);
    return table.where(indexName).equals(key).toArray();
  }

  async deleteData(tableName: keyof EssDatabase, key: string) {
    const table = this.table(tableName);
    await table.delete(key);
  }

  async getAllData<T>(tableName: keyof EssDatabase): Promise<T[]> {
    const table = this.table<T, number | string>(tableName);
    return table.toArray();
  }

  async getAllDataWithKeys<T extends { key: string; value: any }>(
    tableName: keyof EssDatabase
  ): Promise<{ [key: string]: any }> {
    const table = this.table<T>(tableName);
    const dataObject: { [key: string]: any } = {};
    const keys = await table.toCollection().primaryKeys();

    await Promise.all(keys.map(async (key) => {
      const stringKey = String(key);
      const item = await table.get(key);
      if (item) {
        dataObject[stringKey] = item;
      }
    }));

    return dataObject;
  }

  async clearTable(tableName: keyof EssDatabase): Promise<void> {
    const table = this.table(tableName);
    return table.clear();
  }

}