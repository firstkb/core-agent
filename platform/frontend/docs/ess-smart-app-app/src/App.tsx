import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter as Router } from 'react-router-dom';
import i18n from './i18n.js';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PWAInstall from '@khmyznikov/pwa-install/react-legacy';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { OnlineStatusProvider } from './providers/OnlineStatusProvider';
import { AuthProvider } from './providers/AuthProvider';
import { RequestProvider } from './providers/RequestProvider'
import Routes from './routes/Routes';
import { createAppTheme } from './theme/theme';
import './App.css'
import Logger from './logger/Logger.js';

declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

function App() {

  const [promptEvent, setPromptEvent] = useState<any>(null);

  useEffect(() => {
    if (window.deferredPrompt) {
      Logger.debug('Using deferred beforeinstallprompt event');
      setPromptEvent(window.deferredPrompt);
    }

    const handleAppInstalled = () => {
      Logger.debug('App installed');
      setPromptEvent(null);
      window.deferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const [theme, setTheme] = useState(createAppTheme('light'));
  const [themeClassName, setThemeClassName] = useState('light-theme');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const themeListener = (e: MediaQueryListEvent) => {
      const newTheme = createAppTheme(e.matches ? 'dark' : 'light');
      setTheme(newTheme);
      setThemeClassName(e.matches ? 'dark-theme' : 'light-theme');
    };

    mediaQuery.addEventListener('change', themeListener);

    const initialTheme = createAppTheme(mediaQuery.matches ? 'dark' : 'light');
    setTheme(initialTheme);
    setThemeClassName(mediaQuery.matches ? 'dark-theme' : 'light-theme');

    return () => mediaQuery.removeEventListener('change', themeListener);
  }, []);

  const intervalMS = 1 * 60 * 1000;

  const [showReload, setShowReload] = useState(false);

  const {
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    swUrl: `/sw.js`,
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      //console.log('Service Worker registered:', registration);
      if (registration) {
        setInterval(() => {
          //console.log('Checking for SW update');
          registration.update();
        }, intervalMS);
      }
    },
    onNeedRefresh() {
      //console.log('New content is available; please refresh.');
      setShowReload(true);
    },
    onRegisterError(error: any) {
      console.error('Service worker registration error:', error);
    },
  });

  useEffect(() => {
    //console.log('needRefresh changed:', needRefresh);
    if (needRefresh === true) {
      setShowReload(true);
    }
  }, [needRefresh]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={"app " + themeClassName}>
        <I18nextProvider i18n={i18n}>
          <OnlineStatusProvider>
            <AuthProvider>
              <DatabaseProvider>
                <RequestProvider>
                  <Router>
                    <Routes />
                  </Router>
                </RequestProvider>
              </DatabaseProvider>
            </AuthProvider>
          </OnlineStatusProvider>
        </I18nextProvider>
        <Snackbar
          open={showReload}
          message="New version of the application is available."
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            mb: `calc(env(safe-area-inset-bottom) + 20px)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap',
          }}
          ContentProps={{
            sx: {
              flexGrow: 1,
              flexWrap: 'nowrap',
            },
          }}
          action={
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => {
                updateServiceWorker(true);
                setShowReload(false);
              }}
            >
              Update
            </Button>
          }
        />
        <PWAInstall
          disableDescription={true}
          disableScreenshots={true}
          icon="/icon/pwa-192x192.png"
          manifestUrl="/manifest.json"
          externalPromptEvent={promptEvent}
        />
      </div>
    </ThemeProvider>
  );
}


export default App;