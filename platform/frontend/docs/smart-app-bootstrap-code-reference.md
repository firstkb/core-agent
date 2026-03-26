# Smart App: code reference для bootstrap/auth flow 1 к 1

## Зачем нужен этот документ

Документ [smart-app-bootstrap-1to1.md](./smart-app-bootstrap-1to1.md) описывает архитектуру и последовательность экранов.
Этот файл дополняет его **реальными фрагментами кода из проекта**, чтобы перенос в другой проект можно было сделать не по описанию, а по конкретным контрактам.

Если в целевом проекте сейчас есть только упрощённый `AuthShell`, то этого недостаточно для 1 к 1 переноса.
В smart app flow состоит не из одного экрана, а из нескольких отдельных слоёв:

- bootstrap config loader;
- auth state provider;
- auth guard;
- public/private layouts;
- fullscreen loader;
- login page shell;
- post-auth profile loader;
- main app shell.

## Что обязательно должно появиться в целевом проекте

Если этих модулей нет, перенос bootstrap/auth flow ещё не завершён:

- `GlobalConfigLoader`
- `AuthProvider`
- `RequestProvider`
- `Routes` с `auth guard`
- `PublicLayout`
- `PrivateLayout`
- `ClientConfigProvider`
- fullscreen `loader-container`
- login page shell с синим fullscreen background
- loader после авторизации до открытия главного экрана

## Важная оговорка по install flow

В этом reference есть `beforeinstallprompt`, `PWAInstall`, `manifest` и service worker, но в нашем текущем продукте это не надо трактовать как требование сделать offline-first PWA.

Актуальная реализация install/access layer больше не использует внешний runtime `pwa-install`.
Текущий source of truth:

- [install-helper-runtime.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/install-helper-runtime.md)
- [packages/install-helper](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/install-helper)

Для `Admin App` и `Tenant App` install flow нужен как вспомогательный UX-слой:

- показать кнопку `Install app` или инструкцию по установке;
- упростить быстрый доступ к приложению с desktop/mobile home screen;
- не менять базовое допущение, что приложение работает в online-режиме.

Если позже мы будем внедрять этот слой в текущий frontend, его нужно проектировать как install/access convenience layer, а не как обещание полноценной офлайн-работы.

## 1. Bootstrap entrypoint

Источник: `src/main.tsx`.

Это первый обязательный кусок donor flow. Он не просто монтирует `App`, а сначала:

- подготавливает donor PWA install prompt;
- показывает `GlobalConfigLoader`;
- только после загрузки конфигов импортирует и монтирует `App`.

```tsx
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
  root.render(<App />);
};

root.render(
  <GlobalConfigLoader onConfigLoaded={renderApp} />
);
```

### Контракт

В целевом проекте старт должен быть таким же:

1. full-screen loader;
2. загрузка `config.json`;
3. загрузка `client/config.json`;
4. только потом `App`.

Если `AuthShell` монтируется сразу, это уже не 1 к 1.

## 2. GlobalConfigLoader

Источник: `src/config/GlobalConfigLoader.tsx`.

Это отдельный bootstrap layer.
Он не связан с логином напрямую, он нужен до логина.

```tsx
const GlobalConfigLoader = ({ onConfigLoaded }: { onConfigLoaded: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init: RequestInit = navigator.onLine ? { cache: 'reload' } : {};

    const loadGlobalConfig = () => {
      return fetch(`/config.json`, init)
        .then(response => response.json())
        .then(configData => {
          Object.entries(configData).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
        });
    };

    const loadClientConfig = () => {
      return fetch(`/client/config.json`, init)
        .then(response => response.json())
        .then(configData => {
          Object.entries(configData).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
        });
    };

    loadGlobalConfig()
      .then(loadClientConfig)
      .then(() => {
        setLoading(false);
        onConfigLoaded();
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [onConfigLoaded]);

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
        <div style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Client not found.</div>
      </div>
    );
  }

  return null;
};
```

### Контракт

В целевом проекте должен быть **отдельный** loader до логина.
Он не заменяется самим login screen.

## 3. Fullscreen loader contract 1 к 1

Источник: `src/main.css`.

Это базовый визуальный контракт, который переиспользуется:

- на bootstrap;
- на auth guard;
- на profile loader.

```css
body {
  background-color: #1e63b8;
}

.loader-container {
  background-color: #1e63b8;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loader-logo {
  width: 150px;
  height: auto;
}
```

И JSX-контракт у него везде одинаковый:

```tsx
<div className="loader-container">
  <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
</div>
```

### Что значит 1 к 1

Если нужен перенос 1 к 1, то loader должен быть:

- fullscreen;
- без карточки;
- без spinner;
- с синим фоном `#1e63b8`;
- с логотипом по центру;
- с одной и той же визуальной реализацией на всех этапах.

## 4. AuthProvider

Источник: `src/providers/AuthProvider.tsx`.

Этот слой отвечает не за UI, а за auth state и токены.
Без него нельзя правильно разделить public/private flow.

```tsx
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('uid') ?? '' : '')
  );

  const saveToken = async (accessToken: string, idToken: string, refreshToken: string): Promise<void> => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);

    const uid = extractUserId(idToken);
    localStorage.setItem('uid', uid);
    setUserId(uid);
    setIsAuthenticated(true);
  };

  const getToken = useCallback(async (): Promise<string | null> => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const idToken = localStorage.getItem('idToken');

    if (!accessToken && !refreshToken && !idToken) {
      return null;
    }

    return accessToken;
  }, []);

  const deleteToken = async (): Promise<void> => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('uid');
    setIsAuthenticated(false);
    setUserId('');
  };

  const checkAuth = useCallback(async () => {
    const token = await getToken();
    setIsAuthenticated(!!token);
  }, [getToken]);

  const signOut = async (): Promise<void> => {
    await deleteToken();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, saveToken, getToken, deleteToken, checkAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Контракт

В целевом проекте должен быть централизованный auth state с методами:

- `saveToken`
- `getToken`
- `deleteToken`
- `checkAuth`
- `signOut`

Если `AuthShell` просто переключает локальный `isLoggedIn`, это не покрывает текущий контракт smart app.

## 5. Auth guard

Источник: `src/routes/Routes.tsx`.

Здесь реализован отдельный guard, а не условие прямо внутри страницы логина.

```tsx
const Routes: FC = () => {
  const { isAuthenticated, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setLoading(false);
    };
    verifyAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="loader-container">
        <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
      </div>
    );
  }

  return isAuthenticated ? <PrivateLayout /> : <PublicLayout />;
};
```

### Контракт

Нужен именно такой промежуточный этап:

- сначала loader;
- потом проверка токена;
- потом route split.

Без этого bootstrap/auth flow не совпадает с оригиналом.

## 6. PublicLayout и PrivateLayout

Источник: `src/components/layouts/PublicLayout.tsx`.

```tsx
const PublicLayout: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
```

Источник: `src/components/layouts/PrivateLayout.tsx`.

```tsx
const PrivateLayout: FC = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <ClientConfigProvider>
      <SyncServiceProvider>
        <Toolbar onDrawerOpen={() => setDrawerOpen(true)} />
        <DrawerComponent isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
        <Box component="main" sx={{ flexGrow: 1, pt: 1, pb: 4, marginTop: '55px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/page/:pageId/" element={<TablePage />} />
            <Route path="/edit/:pageId/:formId/" element={<Edit />} />
            <Route path="/sync/" element={<TableSync />} />
            <Route path="/setting/" element={<SettingPage />} />
            <Route path="/tutorial/" element={<TutorialPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </SyncServiceProvider>
    </ClientConfigProvider>
  );
};
```

### Контракт

В целевом проекте должны быть два раздельных layout слоя:

- public layout для login;
- private layout для main app.

Именно `PrivateLayout` должен запускать post-auth загрузку профиля через `ClientConfigProvider`.

## 7. Profile loader после авторизации

Источник: `src/providers/ClientConfigProvider.tsx`.

Это отдельный слой после логина и до главного экрана.

```tsx
export const ClientConfigProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useDatabase();
  const isOnline = useContext(OnlineStatusContext);
  const request = useContext(RequestContext);

  const [dictionary, setDictionary] = useState<{ [key: string]: DictionaryItem[] }>({});
  const [dictionaryObj, setDictionaryObj] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [schemes, setSchemes] = useState<{ [key: number]: any }>({});
  const [helpVideo, sethelpVideo] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    const configData = await request?.sendRequest('/profile', {}, 'GET');
    if (configData && typeof configData !== "string") {
      const { dictionary, schemes, user, aspkey, share, help } = configData;

      // сохранение в Dexie и localStorage

      if (aspkey) {
        localStorage.setItem("aspKey", typeof aspkey === 'string' ? aspkey : JSON.stringify(aspkey));
      }

      setLoading(false);
    } else {
      getDbConfig();
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="loader-container">
        <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
      </div>
    );
  }

  return (
    <ClientConfigContext.Provider value={{ dictionary, dictionaryObj, schemes, helpVideo, loading, fetchConfig }}>
      {children}
    </ClientConfigContext.Provider>
  );
};
```

### Контракт

После логина пользователь не должен попадать сразу на main screen.
Сначала должен быть отдельный fullscreen loader под загрузку `/profile`.

Именно этого слоя чаще всего не хватает в упрощённых auth shell реализациях.

## 8. RequestProvider

Источник: `src/providers/RequestProvider.tsx`.

Этот провайдер нужен, чтобы post-auth профильный запрос шёл через единый request layer.

```tsx
export const RequestProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken, saveToken, signOut } = useAuth();

  const sendRequest = async (action: string, data = {}, method = 'POST'): Promise<any | null> => {
    let token = await getToken();

    if (AuthService.isTokenExpired() && token) {
      const session = await AuthService.refreshAuthToken();
      await saveToken(
        session.getAccessToken().getJwtToken(),
        session.getIdToken().getJwtToken(),
        session.getRefreshToken().getToken()
      );
      token = await getToken();
    }

    const headers = new Headers({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': token ? `Bearer ${token}` : '',
    });

    const baseUrl = localStorage.getItem('appApiUrl');
    const url = new URL(`${baseUrl}${action}`);

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: method !== "GET" ? JSON.stringify(data) : null,
      mode: 'cors',
      cache: 'no-cache',
    });

    const jsonResponse = await response.json();
    return jsonResponse.status === "ok" ? jsonResponse.data : null;
  };

  return (
    <RequestContext.Provider value={{ sendRequest }}>
      {children}
    </RequestContext.Provider>
  );
};
```

### Контракт

Даже если в новом проекте auth mock, post-auth profile loader должен ходить не напрямую из экрана, а через отдельный request/service layer.

## 9. Login page shell 1 к 1

Источник: `src/pages/Login.tsx`.

### Fullscreen page shell

```tsx
<div className="login-page"
  style={{
    backgroundColor: '#1e63b8',
    minHeight: '100vh',
    height: '100dvh',
    overflowY: 'auto',
    paddingTop: 20,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}
>
  <div style={{ width: '100%', maxWidth: 520, margin: 'auto' }}>
    <div style={{ marginBottom: 20, textAlign: 'center' }}>
      <Typography style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'normal' }}>
        {t('login.tagLine')}
      </Typography>
    </div>

    <Box className="login-panel">
      <Box component="img" src={logoSrc} onError={handleImageError} alt="Logo" sx={{ width: 150, height: 50 }} />
      <Typography variant="h6" style={{ marginTop: 10, display: 'block' }}>{t('login.title')}</Typography>
      <Typography style={{ color: 'gray' }}>{t('login.info')}</Typography>
      ...
    </Box>
  </div>
</div>
```

### Card contract

Источник: `src/App.css`.

```css
.login-panel {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  background-color: white;
  border-radius: 5px;
  margin: 5px;
  box-sizing: border-box;
}
```

### Step 1: send code

```tsx
const sendCode = async () => {
  if (!isOnline) {
    setTextError(t('general.offline'));
    return;
  }
  if (!clientId) {
    setTextError(t('login.error.emptyClientId'));
    return;
  }
  if (!inputValue.trim()) {
    setTextError(methodValue === 'email' ? t('login.error.emptyEmail') : t('login.error.emptyPhone'));
    return;
  }

  setIsLoading(true);
  setTextError('');

  await AuthService.initiateAuth(
    methodValue,
    clientId,
    inputValue,
    () => {
      setCodeSent(true);
      setIsLoading(false);
    },
    (error) => {
      setTextError(t('login.error.authFailed') + ': ' + error.message);
      setIsLoading(false);
    }
  );
};
```

### Step 2: verify code

```tsx
const verifyCode = async () => {
  if (!isOnline) {
    setTextError(t('general.offline'));
    return;
  }
  if (!codeValue.trim()) {
    setTextError(t('login.error.emptyCode'));
    return;
  }

  setIsLoading(true);
  setTextError('');

  await AuthService.confirmAuth(
    codeValue,
    (result) => {
      setCodeSent(false);
      setIsLoading(false);
      setCodeValue('');
      setInputValue('');
      saveToken(
        result.getAccessToken().getJwtToken(),
        result.getIdToken().getJwtToken(),
        result.getRefreshToken().getToken()
      );
    },
    () => {
      setTextError(`${t('login.error.varifyFailed')}: ${t('login.error.codeNotCorrect')}`);
      setCodeSent(false);
      setIsLoading(false);
      setCodeValue('');
    }
  );
};
```

### Контракт

Login page 1 к 1 в целевом проекте должен иметь:

- fullscreen синий background;
- white card шириной до `500px`;
- логотип сверху карточки;
- минимум двухсостоячный UI: `enter login` -> `enter code`;
- auth success не должен открывать main screen напрямую;
- после success должен включаться profile loader.

## 10. App composition

Источник: `src/App.tsx`.

Важно не только наличие логина, но и точный порядок провайдеров:

```tsx
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
    <PWAInstall
      disableDescription={true}
      disableScreenshots={true}
      icon="/icon/pwa-192x192.png"
      manifestUrl="/manifest.json"
      externalPromptEvent={promptEvent}
    />
  </div>
</ThemeProvider>
```

### Контракт

Если `AuthShell` живёт сам по себе вне этого порядка, он не воспроизводит поведение smart app.

## 11. Почему текущий `AuthShell` недостаточен

Если в целевом проекте есть только простой `AuthShell`, то у него обычно отсутствуют:

- предзагрузка `config.json` и `client/config.json`;
- отдельный bootstrap loader до `App`;
- отдельный auth guard loader;
- разделение на `PublicLayout` и `PrivateLayout`;
- post-auth `profile loader`;
- общий fullscreen loader contract;
- единый request provider;
- auth provider с долговременным токенным состоянием.

То есть по факту он покрывает только часть `Login`, но не весь bootstrap/auth flow.

## 12. Что нужно добавить в целевой проект

Минимальный набор файлов по аналогии со smart app:

- `src/main.tsx`
- `src/config/GlobalConfigLoader.tsx`
- `src/providers/AuthProvider.tsx`
- `src/providers/RequestProvider.tsx`
- `src/routes/Routes.tsx`
- `src/components/layouts/PublicLayout.tsx`
- `src/components/layouts/PrivateLayout.tsx`
- `src/providers/ClientConfigProvider.tsx`
- `src/pages/Login.tsx`
- `src/main.css`
- `src/App.css`

Если авторизация и профиль пока mock, можно заменить только внутреннюю реализацию сервисов, но не убирать эти слои.

## 13. Минимальный contract sequence для переноса

Целевой проект должен работать так:

1. `main.tsx` показывает fullscreen loader.
2. `GlobalConfigLoader` читает `/config.json` и `/client/config.json`.
3. После этого монтируется `App`.
4. `Routes` через auth guard показывает loader и проверяет токены.
5. Если токена нет, открывается `PublicLayout -> Login`.
6. Login сохраняет токены через `AuthProvider`.
7. Открывается `PrivateLayout`.
8. `ClientConfigProvider` показывает fullscreen loader и грузит `/profile`.
9. Только после этого открывается главный экран.

Именно это и есть bootstrap/auth page контракт 1 к 1 относительно текущего smart app.
