import { createContext } from 'react';

export interface ClientConfigContextType {
    dictionary: { [key: string]: any };
    dictionaryObj: { [key: string]: any };
    schemes: { [key: number]: any };
    helpVideo: { [key: string]: any };
    loading: boolean;
    fetchConfig: () => Promise<void>;
}

export const ClientConfigContext = createContext<ClientConfigContextType | null>(null);
