# Smart App: перенос bootstrap/auth flow 1 к 1

## Цель документа

Этот документ фиксирует, как в текущем проекте устроены:

- старт приложения;
- загрузка `app` и `client` конфигов;
- синий лоадер с логотипом;
- страница авторизации;
- загрузка профиля после авторизации;
- открытие главного экрана;
- PWA installer;
- `vite.config.ts`.

Отдельно отмечено, что для нового проекта:

- `Cognito` не переносим;
- авторизация будет через свой `auth` сервис;
- на первом этапе авторизация будет `mock`;
- загрузка `/profile` на старте после авторизации тоже будет `mock`.

## Важное уточнение

В репозитории **нет** файла `vite-config.json`.
Актуальная конфигурация Vite находится в файле `vite.config.ts`.

## 1. Текущий flow приложения

Текущая цепочка старта выглядит так:

1. `src/main.tsx`
   - регистрирует обработчик `beforeinstallprompt`;
   - если приложение открыто не как установленное PWA, кладёт в `sessionStorage` ключ `pwa-hide-install=false`;
   - сначала рендерит `GlobalConfigLoader`.
2. `src/config/GlobalConfigLoader.tsx`
   - делает `fetch('/config.json')`;
   - делает `fetch('/client/config.json')`;
   - сохраняет **все** поля из обоих JSON в `localStorage`;
   - во время загрузки показывает синий лоадер;
   - после успешной загрузки вызывает `onConfigLoaded()`.
3. `src/main.tsx`
   - динамически импортирует `App.tsx`;
   - монтирует основное приложение.
4. `src/App.tsx`
   - поднимает тему, i18n, online/offline state;
   - поднимает `AuthProvider`, `DatabaseProvider`, `RequestProvider`;
   - подключает `BrowserRouter`;
   - рендерит `Routes`;
   - подключает service worker и PWA installer.
5. `src/routes/Routes.tsx`
   - вызывает `checkAuth()` из `AuthProvider`;
   - пока идёт проверка, показывает такой же синий лоадер;
   - если токенов нет, открывает `PublicLayout`;
   - если токены есть, открывает `PrivateLayout`.
6. `src/components/layouts/PublicLayout.tsx`
   - рендерит только `/` -> `Login`.
7. `src/pages/Login.tsx`
   - показывает страницу авторизации;
   - отправляет код;
   - подтверждает код;
   - при успехе вызывает `saveToken(...)` из `AuthProvider`.
8. `src/providers/AuthProvider.tsx`
   - кладёт `accessToken`, `idToken`, `refreshToken` в `localStorage`;
   - достаёт `custom:user_id` из `idToken`;
   - сохраняет `uid` в `localStorage`;
   - выставляет `isAuthenticated=true`.
9. `src/providers/DatabaseProvider.tsx`
   - создаёт `Dexie` базу `ess_smart_<uid>`;
   - база создаётся **только если есть `userId`**.
10. `src/components/layouts/PrivateLayout.tsx`
    - оборачивает приватную часть в `ClientConfigProvider`;
    - после этого рендерит toolbar, drawer и маршруты приватного приложения.
11. `src/providers/ClientConfigProvider.tsx`
    - делает `GET /profile` через `RequestProvider`;
    - во время загрузки снова показывает синий лоадер;
    - раскладывает профильные данные в `Dexie` и частично в `localStorage`;
    - после завершения открывает главный экран.

Итого UX-цепочка сейчас такая:

`Старт -> loader -> login -> login success -> loader(profile) -> main screen`

Именно эту последовательность можно перенести в другой проект почти без изменений.

## 2. Какие конфиги читаются на старте

### 2.1 `public/config.json`

Сейчас содержит глобальные параметры приложения:

```json
{
  "userPoolId": "us-east-1_MsLfHpmbc",
  "appClientPhoneId": "5n7gv05cjcg382q0qj056cen9g",
  "appClientEmailId": "4489c1dngsl3jdrd8vvj0jofrj",
  "appApiUrl": "http://localhost:3000",
  "webApiUrl": "http://localhost:3100",
  "aspUrl": "http://ess103.local"
}
```

Для нового проекта без Cognito из этого реально нужны только поля уровня API/URL.
Например:

```json
{
  "appApiUrl": "http://localhost:3000",
  "webApiUrl": "http://localhost:3100",
  "aspUrl": "http://localhost:3200"
}
```

### 2.2 `public/client/config.json`

Сейчас содержит клиентский конфиг:

```json
{
  "clientId": "1047",
  "name": "Gateway"
}
```

Этот JSON тоже полностью складывается в `localStorage`.

### 2.3 Как именно конфиги подтягиваются

Логика в `src/config/GlobalConfigLoader.tsx` очень простая:

- читается `/config.json`;
- потом `/client/config.json`;
- каждая пара `key/value` сохраняется в `localStorage`;
- дальше всё приложение читает конфиги уже из `localStorage`.

Это важно: в текущей реализации конфиги не живут в React state или context, они используются как глобальный runtime storage через `localStorage`.

## 3. Лоадер: синий фон + логотип компании

Общий базовый стиль находится в `src/main.css`:

```css
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

Сейчас этот лоадер используется минимум в трёх местах:

- `src/config/GlobalConfigLoader.tsx`
- `src/routes/Routes.tsx`
- `src/providers/ClientConfigProvider.tsx`

Во всех случаях используется один и тот же JSX:

```tsx
<div className="loader-container">
  <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
</div>
```

### Что важно для переноса 1 к 1

- фон: `#1e63b8`;
- логотип: сейчас это `/assets/logo-dark.svg`;
- размер логотипа: `150px`;
- loader не содержит spinner, только логотип на фоне.

### Важная деталь

На login-странице и в toolbar используется **клиентский логотип** из `/client/logo-light.svg` или `/client/logo-dark.svg`, а на loader используется общий логотип `/assets/logo-dark.svg`.

Если в новом проекте нужен один и тот же логотип везде, это можно упростить и использовать один asset.

## 4. Как построена страница авторизации

Текущая реализация находится в `src/pages/Login.tsx`.

### 4.1 Общая структура страницы

Страница состоит из:

- синего фона на всю высоту окна;
- верхнего tagline;
- белой карточки `login-panel`;
- логотипа клиента;
- заголовка и вспомогательного текста;
- переключателя метода входа `email/phone`;
- поля ввода email или phone;
- кнопки `Send Code`;
- на втором шаге поля для кода и кнопки `Verify Code`;
- блока ошибок;
- ссылки на video tutorial;
- QR-кода текущего URL;
- копирайта.

Основной контейнер страницы строится инлайн-стилями:

```tsx
<div
  className="login-page"
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
```

Карточка логина стилизована через `src/App.css`:

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

### 4.2 Состояния формы

Ключевые state в `Login.tsx`:

- `codeSent`
  переключает UI между шагом "ввести email/phone" и шагом "ввести код";
- `methodValue`
  `email` или `phone`;
- `inputValue`
  email или phone;
- `codeValue`
  введённый verification code;
- `isLoading`
  блокировка кнопок на время запроса;
- `textError`
  текст ошибки;
- `logoSrc`
  источник логотипа клиента;
- `banner`
  опциональное сообщение над формой.

### 4.3 Как выбирается логотип

На login-странице логотип зависит от темы:

```tsx
setLogoSrc(`/client/logo-${mode === 'dark' ? 'dark' : 'light'}.svg`);
```

Если клиентский логотип не найден, используется fallback:

```tsx
setLogoSrc(`/assets/logo-light.svg`);
```

### 4.4 Как работает текущая авторизация

Сейчас `Login.tsx` использует `AuthService` и двухшаговый процесс:

1. `sendCode()`
   - проверяет online state;
   - проверяет `clientId`;
   - проверяет непустой email/phone;
   - вызывает `AuthService.initiateAuth(...)`;
   - при успехе переводит форму в состояние `codeSent=true`.
2. `verifyCode()`
   - проверяет наличие кода;
   - вызывает `AuthService.confirmAuth(...)`;
   - при успехе вызывает `saveToken(accessToken, idToken, refreshToken)`.

### 4.5 Что в этой странице не относится к обязательному минимуму

Для переноса flow 1 к 1 **необязательны**:

- banner сверху;
- `Trouble with Signin?`;
- iframe help modal;
- video tutorial modal;
- QR-code;
- переключение `email/phone`.

Обязательный минимум для повторения UX:

- синий фон;
- карточка логина;
- логотип;
- поля ввода;
- submit;
- переход в authenticated state;
- переход к loader профиля;
- открытие главного экрана.

## 5. Шаблон авторизации для нового проекта

Так как `Cognito` не нужен, переносить надо **не реализацию**, а **контракт поведения**.

### 5.1 Что оставить как есть по архитектуре

Можно сохранить:

- `Login.tsx` как экран;
- `AuthProvider` как источник `isAuthenticated`;
- `Routes.tsx` как переключатель `public/private`;
- `ClientConfigProvider` как шаг "загрузить профиль после входа";
- loader UX без изменений.

### 5.2 Что заменить

Нужно заменить:

- `src/services/AuthService.ts` -> на свой `MockAuthService` или `AuthService`;
- `src/config/UserPool.ts` -> убрать;
- Cognito refresh logic в `RequestProvider` -> либо упростить, либо заменить на свой refresh.

### 5.3 Ключевой технический момент

Сейчас `AuthProvider.saveToken(...)` достаёт `userId` из claim `custom:user_id` внутри `idToken`.
Если в новом проекте этот claim не будет приходить, то:

- `userId` останется пустым;
- `DatabaseProvider` не создаст базу;
- `ClientConfigProvider` может работать не так, как ожидается.

Поэтому есть два варианта:

1. Сохранить текущий контракт и генерировать mock `idToken` с `custom:user_id`.
2. Упростить `AuthProvider` и хранить `userId` отдельно без JWT-парсинга.

Для переноса 1 к 1 проще вариант `1`.

### 5.4 Пример mock auth сервиса

Ниже минимальный пример, который сохраняет текущую механику UX, но не использует Cognito:

```ts
const makeFakeJwt = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
};

class MockAuthService {
  async requestCode(_login: string) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true };
  }

  async verifyCode(_code: string) {
    await new Promise((r) => setTimeout(r, 600));

    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    const accessToken = makeFakeJwt({ username: "demo", exp });
    const idToken = makeFakeJwt({
      "custom:user_id": "demo-user-1",
      exp
    });
    const refreshToken = "mock-refresh-token";

    return { accessToken, idToken, refreshToken };
  }

  isTokenExpired() {
    return false;
  }

  async refreshAuthToken() {
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    return {
      accessToken: makeFakeJwt({ username: "demo", exp }),
      idToken: makeFakeJwt({ "custom:user_id": "demo-user-1", exp }),
      refreshToken: "mock-refresh-token"
    };
  }
}

export const authService = new MockAuthService();
```

### 5.5 Пример упрощённого login flow

```tsx
const sendCode = async () => {
  setIsLoading(true);
  setTextError("");

  try {
    await authService.requestCode(inputValue);
    setCodeSent(true);
  } catch {
    setTextError("Failed to send code");
  } finally {
    setIsLoading(false);
  }
};

const verifyCode = async () => {
  setIsLoading(true);
  setTextError("");

  try {
    const tokens = await authService.verifyCode(codeValue);
    await saveToken(tokens.accessToken, tokens.idToken, tokens.refreshToken);
  } catch {
    setTextError("Invalid code");
  } finally {
    setIsLoading(false);
  }
};
```

## 6. Как работает загрузка профиля после авторизации

Текущая реализация находится в `src/providers/ClientConfigProvider.tsx`.

### 6.1 Когда она запускается

Она монтируется только внутри `PrivateLayout`, то есть только после успешной авторизации.

### 6.2 Что она делает

`ClientConfigProvider`:

- берёт `RequestContext`;
- делает `GET /profile`;
- получает:
  - `dictionary`;
  - `schemes`;
  - `user`;
  - `aspkey`;
  - `share`;
  - `help`;
- очищает старые данные в IndexedDB;
- складывает данные в `Dexie`;
- часть значений кладёт в `localStorage`;
- по завершении снимает `loading`.

Пока `loading=true`, пользователь видит тот же синий loader.

### 6.3 Что нужно для нового проекта с mock profile

Для первого этапа достаточно вернуть объект такой формы:

```ts
const mockProfile = {
  dictionary: {},
  schemes: [],
  user: {
    id: "demo-user-1",
    firstName: "Demo",
    lastName: "User",
    email: "demo@example.com",
    title: "Tester"
  },
  aspkey: "mock-asp-key",
  share: {},
  help: []
};
```

### 6.4 Пример mock profile loader

Если нужен перенос flow без реального backend, можно временно заменить сетевой вызов:

```ts
const fetchConfig = async () => {
  await new Promise((r) => setTimeout(r, 800));
  const configData = mockProfile;

  setDictionary({});
  setDictionaryObj({});
  setSchemes({});
  sethelpVideo({});

  localStorage.setItem("aspKey", configData.aspkey);
  setLoading(false);
};
```

Если Dexie в новом проекте пока не нужен, можно вообще убрать запись в IndexedDB и оставить только state + loader.

## 7. Как работает `RequestProvider`

`src/providers/RequestProvider.tsx` сейчас делает следующее:

- получает токен из `AuthProvider`;
- если токен протух, пытается обновить его через `AuthService.refreshAuthToken()`;
- добавляет `Authorization: Bearer <token>`;
- берёт базовый URL из `localStorage.appApiUrl`;
- для `webApi` переключается на `localStorage.webApiUrl`;
- для `aspServer` использует `localStorage.aspUrl`.

### Что важно для нового проекта

Если Cognito больше нет, то в `RequestProvider` есть два пути:

1. Оставить текущий контракт и сделать совместимый `authService.refreshAuthToken()`.
2. Временно убрать refresh ветку и всегда использовать mock token как валидный.

Для mock этапа проще второй вариант.

## 8. PWA installer: как работает и какую библиотеку использует

### 8.1 Используемая библиотека

В проекте используется библиотека:

- `@khmyznikov/pwa-install`

В React она подключена так:

```ts
import PWAInstall from '@khmyznikov/pwa-install/react-legacy';
```

### 8.2 Как работает текущая схема

1. В `src/main.tsx` ловится событие `beforeinstallprompt`.
2. Событие не показывается браузером автоматически:

```ts
e.preventDefault();
window.deferredPrompt = e;
```

3. В `src/App.tsx` это событие кладётся в state `promptEvent`.
4. `PWAInstall` получает его через `externalPromptEvent={promptEvent}`.

Итог: приложение само управляет моментом показа install prompt.

### 8.3 Дополнительно по PWA

В `App.tsx` ещё есть:

- `useRegisterSW` из `virtual:pwa-register/react`;
- проверка обновления service worker раз в минуту;
- snackbar с кнопкой `Update`.

То есть PWA состоит из двух частей:

1. установка приложения через `@khmyznikov/pwa-install`;
2. service worker и manifest через `vite-plugin-pwa`.

### 8.4 Как трактовать install flow в новом проекте

Для нашего нового frontend это нужно трактовать узко и прагматично:

- install flow нужен не как отдельная offline-first PWA стратегия;
- install flow нужен как удобный способ быстро добавить приложение на устройство;
- UI может показывать кнопку `Install app` или инструкцию по установке;
- основное приложение при этом остаётся online-приложением и продолжает зависеть от сети;
- наличие `PWAInstall`, `manifest` и install prompt не означает, что мы берём на себя обязательство по полноценной offline-работе.

Иными словами, в текущем scope install нужен прежде всего для:

- быстрого доступа к `Admin App` и `Tenant App`;
- более удобного входа с рабочего стола или домашнего экрана;
- сокращения трения для пользователя при повторных входах.

## 9. Как устроен `vite.config.ts`

Файл: `vite.config.ts`.

### 9.1 Плагины

Подключены:

- `@vitejs/plugin-react`
- `vite-plugin-pwa`
- кастомный plugin `inject-client-tags`

### 9.2 Что делает `inject-client-tags`

Плагин дописывает в `index.html` ссылку:

```html
<link rel="stylesheet" href="/client/style.css?v=<buildDate>">
```

То есть клиентский CSS подключается автоматически на этапе build/runtime HTML transform.

Сейчас `public/client/style.css` почти пустой, но механизм готов под white-label кастомизацию.

### 9.3 Что делает `vite-plugin-pwa`

Плагин:

- генерирует `sw.js`;
- генерирует `manifest.json`;
- использует `registerType: 'prompt'`;
- настраивает иконки PWA;
- настраивает Workbox cache.

Ключевые параметры:

- `cacheId: smart-pwa-v${version}`
- `navigateFallback: '/index.html'`
- denylist для `/api/`, `/app`, `/web`, `/Files`, `/files`

### 9.4 Какие build-time глобальные константы определены

Через `define` прокидываются:

- `__APP_VERSION__`
- `__APP_ENV__`
- `__BUILD_TIMESTAMP__`
- `global: {}`

Они используются, например, в `GlobalConfigLoader.tsx` и `Login.tsx`.

### 9.5 Dev server

Сейчас dev server настроен так:

```ts
server: {
  host: "140.smart.my",
  port: 3010,
}
```

Для нового проекта это почти наверняка надо менять.

## 10. Что реально переносить в другой проект 1 к 1

### 10.1 Минимальный набор файлов/слоёв

Если цель именно повторить flow, нужен такой набор:

- `src/main.tsx`
- `src/config/GlobalConfigLoader.tsx`
- `src/App.tsx`
- `src/providers/AuthProvider.tsx`
- `src/routes/Routes.tsx`
- `src/components/layouts/PublicLayout.tsx`
- `src/components/layouts/PrivateLayout.tsx`
- `src/pages/Login.tsx`
- `src/providers/ClientConfigProvider.tsx`
- `src/providers/RequestProvider.tsx`
- `src/main.css`
- `src/App.css`
- `vite.config.ts`
- `public/config.json`
- `public/client/config.json`
- `public/assets/...`
- `public/client/logo-light.svg`
- `public/client/logo-dark.svg`

### 10.2 Что можно не переносить на первом этапе

Можно не переносить сразу:

- Cognito (`AuthService.ts`, `UserPool.ts`);
- banner с `aspUrl`;
- help iframe;
- video modal;
- QR code;
- offline fallback через Dexie, если он пока не нужен;
- часть сложной бизнес-логики приватных экранов.

## 11. Рекомендуемая схема для нового проекта

Ниже схема, которая максимально близка к текущему UX, но без Cognito:

1. `main.tsx`
   - прочитать `/config.json` и `/client/config.json`;
   - показать loader на синем фоне;
   - сохранить конфиги в `localStorage`;
   - смонтировать `App`.
2. `Routes`
   - проверить наличие токена;
   - если токена нет, открыть `Login`;
   - если токен есть, открыть `PrivateLayout`.
3. `Login`
   - показать форму;
   - вызвать mock auth service;
   - сохранить mock токены;
   - переключить приложение в authenticated state.
4. `PrivateLayout`
   - сразу показать loader профиля;
   - запросить `mockProfile`;
   - сохранить профильные данные;
   - открыть главный экран.

Эта схема ровно соответствует запросу:

- старт app;
- считывание конфигов приложения и client;
- лоадер синий фон с логотипом;
- страница авторизации;
- после авторизации;
- лоадер с запросом `profile`;
- открытие главного экрана приложения.

## 12. Практическая рекомендация по реализации mock этапа

Чтобы не ломать текущую архитектуру, лучше сделать так:

1. Оставить `AuthProvider` почти без изменений.
2. Подменить только `AuthService` на mock-compatible сервис.
3. В `RequestProvider` временно отключить Cognito refresh branch.
4. В `ClientConfigProvider` заменить реальный `/profile` на mock response.
5. После появления настоящего backend:
   - вернуть реальный `AuthService`;
   - вернуть реальный `/profile`;
   - сохранить ту же UX-цепочку без переделки экранов.

## 13. Что ещё стоит учесть

### `ClientConfigLoader.tsx`

В проекте есть `src/config/ClientConfigLoader.tsx`, но сейчас фактически используется не он, а `src/providers/ClientConfigProvider.tsx`.

Для переноса нужно ориентироваться именно на `ClientConfigProvider`.

### `public/client/style.css`

Этот файл автоматически инжектится в страницу через Vite plugin и может использоваться для white-label кастомизации клиента.
Сейчас он почти пустой, но механизм уже встроен.

### `postbuild`

В `package.json` после build есть очистка:

- `dist/locales`
- `dist/client`
- `dist/config.json`
- `dist/manifest.json`

Это нестандартное поведение.
Если в новом проекте нужны runtime JSON и клиентские assets в `dist`, этот шаг надо пересмотреть отдельно.

## Итог

Для переноса в другой проект 1 к 1 важна не Cognito-специфика, а последовательность экранов и точек загрузки:

`Global config loader -> Login -> save token -> Profile loader -> Main app`

Если сохранить этот контракт и заменить:

- `Cognito auth` -> на `mock/custom auth service`;
- `GET /profile` -> на `mock profile`;

то весь нужный flow можно воспроизвести почти без изменения UI-структуры текущего приложения.
