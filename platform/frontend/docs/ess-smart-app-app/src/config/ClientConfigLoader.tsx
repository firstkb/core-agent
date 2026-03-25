import { useEffect, useState, ReactNode, FC, useCallback } from 'react';
import logger from "../logger/Logger";
import { useDatabase } from '../hooks/useDatabase';

interface ClientConfigLoaderProps {
    children: ReactNode;
}

const ClientConfigLoader: FC<ClientConfigLoaderProps> = ({ children }) => {
    const db = useDatabase();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        if (db) {
            const apiUrl = localStorage.getItem('appApiUrl');
            const accessToken = localStorage.getItem('accessToken');

            const headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            });

            const fetchOptions: RequestInit = {
                method: "GET",
                headers: headers,
                mode: 'cors',
                cache: 'no-cache',
            };

            if (!apiUrl) {
                setError("API URL not found in localStorage");
                setLoading(false);
                return;
            }

            fetch(`${apiUrl}/profile`, fetchOptions)
                .then(response => {
                    if (response.status !== 200) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(async configData => {
                    if (configData && configData.data) {
                        const { dictionary, schemes, user, aspkey } = configData.data;

                        await Promise.all([
                            db.dictionaryRepo.clear(),
                            db.schemeRepo.clear()
                        ]);

                        if (dictionary) {
                            await Promise.all(Object.entries(dictionary).map(async ([key, value]) => {
                                await db.dictionaryRepo.add(key, value);
                            }));
                        }

                        if (schemes) {
                            await Promise.all(schemes.map(async (item: any) => {
                                await db.schemeRepo.add(item.info.id, item);
                            }));
                        }

                        if (user) {
                            await Promise.all(Object.entries(user).map(async ([key, value]) => {
                                await db.systemRepo.add(key, value);
                            }));
                        }

                        if (aspkey) {
                            localStorage.setItem("aspKey", typeof aspkey === 'string' ? aspkey : JSON.stringify(aspkey));
                        }

                        setLoading(false);

                    } else {
                        throw new Error("Invalid config data");
                    }
                })
                .catch(error => {
                    logger.error("Error loading client config:", error);
                    setError(error.message);
                    setLoading(false);
                });
        }
    }, [db]);

    useEffect(() => {
        if (db) {
            fetchConfig();
        }
    }, [db, fetchConfig]);

    if (loading) {
        return (
            <div className="loader-container">
                <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="loader-container">
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <strong>Error loading Client configuration.</strong>
                    <div>{error}</div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ClientConfigLoader;
