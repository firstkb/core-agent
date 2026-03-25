import { createContext } from 'react';

// Define the type for the context value
type OnlineStatusContextType = boolean | undefined;

// Create the context
export const OnlineStatusContext = createContext<OnlineStatusContextType>(undefined);