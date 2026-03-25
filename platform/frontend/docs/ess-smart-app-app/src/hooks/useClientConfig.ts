import { useContext } from 'react';
import { ClientConfigContext } from '../contexts/ClientConfigContext';

export const useClientConfig = () => {
    const context = useContext(ClientConfigContext);
    if (!context) {
        throw new Error("useClientConfig must be used within a ClientConfigProvider");
    }
    return context;
};
