import { useState, useEffect, FC, useContext, useMemo } from 'react';
import { ClientConfigContext } from '../contexts/ClientConfigContext';
import { OnlineStatusContext } from '../contexts/OnlineStatusContext';
import { useDatabase } from '../hooks/useDatabase';
import { RequestContext } from "../contexts/RequestContext";
import { useIsDesktop } from '../hooks/useIsDesktop';
import Logger from '../logger/Logger';
import { Scheme } from '../db/SchemeRepo';
import { resolveViewMode } from '../utils/view';

interface DictionaryItem {
    label: string;
    f?: string;
    [key: string]: any; // Для поддержки дополнительных свойств
}

export const ClientConfigProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const db = useDatabase();
    const isOnline = useContext(OnlineStatusContext);
    const request = useContext(RequestContext);
    const isDesktop = useIsDesktop();
    const viewMode = useMemo(resolveViewMode, []);
    //const [preDictionary, setPreDictionary] = useState<{ [key: string]: { [key: string]: DictionaryItem } }>({});
    const [dictionary, setDictionary] = useState<{ [key: string]: DictionaryItem[] }>({});
    const [dictionaryObj, setDictionaryObj] = useState<{ [key: string]: { [key: string]: string } }>({});
    const [schemes, setSchemes] = useState<{ [key: number]: any }>({});
    const [helpVideo, sethelpVideo] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState(true);
    //const [error, setError] = useState<string | null>(null);

    const fetchConfig = async () => {

        try {
            const configData = await request?.sendRequest('/profile', {}, 'GET');
            if (configData && typeof configData !== "string") {
                const { dictionary, schemes, user, aspkey, share, help } = configData;

                await Promise.all([
                    db?.dictionaryRepo.clear(),
                    db?.schemeRepo.clear(),
                    db?.systemRepo.clearByPrefix("helpv_")
                ]);

                if (dictionary) {
                    /*const dictionaryPre: { [key: string]: { [key: string]: DictionaryItem } } = {}
                    await Promise.all(Object.entries(dictionary).map(async ([key, value]) => {
                        const items = value as { [key: string]: DictionaryItem };
                        await db?.dictionaryRepo.add(null, { key: key, value: value });
                        dictionaryPre[key] = items;
                    }));

                    setPreDictionary(dictionaryPre);*/

                    const dictionaryLocal: { [key: string]: DictionaryItem[] } = {};
                    const dictionaryObjLocal: { [key: string]: { [key: string]: string } } = {};
                    await Promise.all(Object.entries(dictionary).map(async ([key, value]) => {
                        await db?.dictionaryRepo.add(null, { key: key, value: value });
                        const items = value as { [key: string]: DictionaryItem };
                        const itemsObj: { [key: string]: string } = {};
                        Object.values(items).forEach((item) => {
                            item.f = item.label.toLowerCase();
                            if (item.desc) {
                                item.f += ' ' + item.desc.toLowerCase();
                            }
                            itemsObj[item.id] = item.label;
                        });
                        dictionaryLocal[key] = Object.values(items);
                        dictionaryObjLocal[key] = itemsObj;
                    }));
                    setDictionary(dictionaryLocal);
                    setDictionaryObj(dictionaryObjLocal);
                }

                if (schemes) {
                    const schemesLocal: { [key: number]: Scheme } = {};
                    await Promise.all(schemes.map(async (item: any) => {
                        await db?.schemeRepo.add(null, { key: item.info.id, value: item });
                        schemesLocal[item.info.id] = item;
                    }));
                    setSchemes(schemesLocal);
                }

                if (user) {
                    await Promise.all(Object.entries(user).map(async ([key, value]) => {
                        await db?.systemRepo.add(key, value);
                    }));
                }

                if (aspkey) {
                    localStorage.setItem("aspKey", typeof aspkey === 'string' ? aspkey : JSON.stringify(aspkey));
                }

                if (share) {
                    localStorage.setItem("share_links", typeof share === 'string' ? share : JSON.stringify(share));
                }

                if (help) {
                    const helpLocal: { [key: string]: any } = {};
                    await Promise.all(help.map(async (item: any) => {
                        await db?.systemRepo.add("helpv_" + item.id, item.url);
                        helpLocal["helpv_" + item.id] = item.url;
                    }));
                    sethelpVideo(helpLocal)
                }

                const activeSchemeCount =
                    Array.isArray(schemes)
                        ? schemes.filter((s: Scheme) => s?.info?.active === 'true').length
                        : 0;

                const needRedirect =
                    activeSchemeCount === 0 ||
                    (isDesktop && viewMode !== 'mobile');

                if (
                    needRedirect &&
                    !window.location.pathname.startsWith('/web')
                ) {
                    window.location.replace('/web/');
                    //return null;
                } else {
                    setLoading(false);
                }



            } else {
                throw new Error("Invalid config data");
            }
        } catch (error: any) {
            Logger.error("Error loading client config:", error);
            //setError(error.message || "Unknown error");
            getDbConfig();
            setLoading(false);
        }

    };

    const getDbConfig = async () => {

        const dictionaryDB = await db?.dictionaryRepo.all();
        if (Array.isArray(dictionaryDB)) {
            const dictionaryLocal: { [key: string]: DictionaryItem[] } = {};
            const dictionaryObjLocal: { [key: string]: { [key: string]: string } } = {};
            dictionaryDB.forEach(item => {
                const items = item.value as { [key: string]: DictionaryItem };
                const itemsObj: { [key: string]: string } = {};
                Object.values(items).forEach((itemValue) => {
                    itemValue.f = itemValue.label.toLowerCase();
                    if (itemValue.desc) {
                        itemValue.f += ' ' + itemValue.desc.toLowerCase();
                    }
                    itemsObj[itemValue.id] = itemValue.label;
                });

                dictionaryLocal[item.key] = Object.values(items);
                dictionaryObjLocal[item.key] = itemsObj;
            });
            setDictionary(dictionaryLocal);
            setDictionaryObj(dictionaryObjLocal);
        }


        const schemesDB = await db?.schemeRepo.all();
        if (Array.isArray(schemesDB)) {
            const schemesLocal: { [key: number]: Scheme } = {};
            schemesDB.forEach(item => {
                schemesLocal[parseInt(item.key)] = item.value;
            });
            setSchemes(schemesLocal);
        }

        const helpVideoDB = await db?.schemeRepo.all();
        if (helpVideoDB && Array.isArray(helpVideoDB)) {
            const helpVideoDBLocal: { [key: number]: Scheme } = {};
            helpVideoDB.forEach(item => {
                helpVideoDBLocal[parseInt(item.key)] = item.value;
            });
            sethelpVideo(helpVideoDBLocal);
        }

        setLoading(false);

    };

    useEffect(() => {
        if (db) {
            if (!isOnline) {
                getDbConfig();
            } else {
                fetchConfig();
            }
        }
    }, [db]);

    /*useEffect(() => {
        Logger.debug("Updated Dictionary:", dictionary);
    }, [dictionary]);

    useEffect(() => {
        Logger.debug("Updated Schemes:", schemes);
    }, [schemes]);*/


    if (loading) {
        return (
            <div className="loader-container">
                <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
            </div>
        );
    }

    /*if (error) {
        return (
            <div className="loader-container">
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <strong>Error loading Client configuration.</strong>
                    <div>{error}</div>
                </div>
            </div>
        );
    }*/
    //error,
    return (
        <ClientConfigContext.Provider value={{ dictionary, dictionaryObj, schemes, helpVideo, loading, fetchConfig }}>
            {children}
        </ClientConfigContext.Provider>
    );
};
