import { createContext } from 'react';

export interface RequestState {
  sendRequest: (action: string, data?: object, method?: string, aspServer?: boolean, webApi?: boolean) => Promise<any | null>;
}

export const RequestContext = createContext<RequestState | undefined>(undefined);
