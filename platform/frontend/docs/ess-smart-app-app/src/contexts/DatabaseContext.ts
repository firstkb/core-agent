import { createContext, useContext } from 'react';
import { EssDatabase } from '../db/EssDatabase';

export const DatabaseContext = createContext<EssDatabase | null>(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
