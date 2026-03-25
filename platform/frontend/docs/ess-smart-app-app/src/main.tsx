import ReactDOM from 'react-dom/client';
import GlobalConfigLoader from './config/GlobalConfigLoader';
import './main.css';
import Logger from './logger/Logger.ts';

declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

const isInWebApp = (): boolean => {
  const isInWebAppiOS = window.navigator.standalone === true;
  const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
  return isInWebAppiOS || isInWebAppChrome;
};

if (!isInWebApp()) {
  window.sessionStorage.setItem('pwa-hide-install', 'false');
}

window.addEventListener('beforeinstallprompt', (e) => {
  Logger.debug('beforeinstallprompt event fired', e);
  e.preventDefault();
  window.deferredPrompt = e;
});

const root = ReactDOM.createRoot(document.getElementById('root')!);

const renderApp = async () => {
  const App = (await import('./App.tsx')).default;

  root.render(
    <App />
  );
};

root.render(
  <GlobalConfigLoader onConfigLoaded={renderApp} />
);
