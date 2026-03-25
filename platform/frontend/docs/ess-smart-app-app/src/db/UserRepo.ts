import { EssDatabase } from './EssDatabase';
import logger from "../logger/Logger";

export interface IUserRepo {
  getUserData(): Promise<User | null>;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isAccess: boolean;
  title: string;
}

export class UserRepo implements IUserRepo {
  private db: EssDatabase;

  constructor(db: EssDatabase) {
    this.db = db;
  }


  async getUserData(): Promise<User | null> {
    try {
      const userId = await this.db.getData<string>('system', 'users_id');
      const firstName = await this.db.getData<string>('system', 'users_firstname');
      const lastName = await this.db.getData<string>('system', 'users_lastname');
      const email = await this.db.getData<string>('system', 'users_email');
      const isAdmin = await this.db.getData<string>('system', 'users_admin');
      const isAccess = await this.db.getData<string>('system', 'users_access');
      const title = await this.db.getData<string>('system', 'users_title');

      if (userId && firstName && lastName && email) {
        return {
          id: parseInt(userId),
          firstName,
          lastName,
          email,
          isAdmin: Boolean(isAdmin),
          isAccess: Boolean(isAccess),
          title: title ? title : ''
        };
      }
      return null;
    } catch (error) {
      logger.debug("Error fetching user data from IndexedDB", error);
      return null;
    }
  }

}
