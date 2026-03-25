import { useEffect, useState } from 'react';
import Logger from '../logger/Logger';

const GlobalConfigLoader = ({ onConfigLoaded }: { onConfigLoaded: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init: RequestInit = navigator.onLine
      ? { cache: 'reload' }
      : {};
    /*const initVersion = navigator.onLine
      ? `?v=${__APP_VERSION__}`
      : "";*/

    const loadGlobalConfig = () => {
      return fetch(`/config.json`, init)
        .then(response => response.json())
        .then(configData => {
          Object.entries(configData).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
          Logger.debug('Global configuration loaded.');
        })
        .catch(error => {
          throw new Error("Error loading global config: " + error.message);
        });
    };

    const loadClientConfig = () => {
      return fetch(`/client/config.json`, init)
        .then(response => response.json())
        .then(configData => {
          Object.entries(configData).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
          Logger.debug('Client configuration loaded.');
        })
        .catch(error => {
          throw new Error("Error loading client config: " + error.message);
        });
    };

    loadGlobalConfig()
      .then(loadClientConfig)
      .then(() => {

        Logger.debug('__APP_VERSION__:', __APP_VERSION__ || '');
        Logger.debug('__BUILD_TIMESTAMP__:', __BUILD_TIMESTAMP__ || '');
        Logger.debug('__APP_ENV__:', __APP_ENV__ || '');

        setLoading(false);
        onConfigLoaded();
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [onConfigLoaded]);

  if (loading) {
    return (
      <div className="loader-container">
        <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
      </div>
    ); //<div>Loading...</div>
  }

  if (error) {
    return (
      <div className="loader-container">
        <div style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Client not found.</div>
      </div>
    );
  }

  return null;
};

export default GlobalConfigLoader;