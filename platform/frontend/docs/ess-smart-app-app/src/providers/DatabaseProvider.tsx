import { FC, ReactNode, useEffect, useState } from 'react';
import { DatabaseContext } from '../contexts/DatabaseContext';
import { EssDatabase } from '../db/EssDatabase';
import { useAuth } from '../hooks/useAuth'; 

export const DatabaseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [database, setDatabase] = useState<EssDatabase | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      const newDbInstance = new EssDatabase(userId);
      setDatabase(newDbInstance);
      
      return () => {
        //newDbInstance.close();
      };
    }
  }, [userId]);

  /*if (!database) {
    return null;
  }*/

  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};