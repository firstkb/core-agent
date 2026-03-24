# Smart App: PWA Install 1:1 Rebuild And Integration

## Зачем нужен этот документ

Этот документ фиксирует, как именно нужно:

- воспроизвести `PWA install` flow 1:1 относительно donor-приложения;
- встроить его в текущий frontend workspace;
- не перепутать install convenience layer с полноценной offline-first PWA стратегией.

Для нашего продукта это важно, потому что:

- `Admin App` и `Tenant App` должны уметь предлагать установку приложения;
- install нужен для быстрого доступа и удобства пользователя;
- базовое приложение при этом остаётся `online`-приложением.

## Исходные материалы

Основные reference-источники:

- [smart-app-bootstrap-1to1.md](./smart-app-bootstrap-1to1.md)
- [smart-app-bootstrap-code-reference.md](./smart-app-bootstrap-code-reference.md)
- локально сохранённый vendor source:
  - [platform/frontend/docs/pwa-install/package.json](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/pwa-install/package.json)
  - [platform/frontend/docs/pwa-install/README.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/pwa-install/README.md)
  - [platform/frontend/docs/pwa-install/src/react-legacy/pwa-install.react-legacy.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/pwa-install/src/react-legacy/pwa-install.react-legacy.ts)
  - [platform/frontend/docs/pwa-install/webpack/webpack.prod.react.js](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/pwa-install/webpack/webpack.prod.react.js)
  - [platform/frontend/docs/pwa-install/webpack/webpack.prod.js](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/pwa-install/webpack/webpack.prod.js)

## Что именно значит 1:1

В рамках этого frontend `1:1` означает не буквальное копирование всего demo-проекта, а сохранение следующих контрактов:

- используется библиотека `@khmyznikov/pwa-install`;
- React-обвязка берётся через `@khmyznikov/pwa-install/react-legacy`;
- install dialog получает `beforeinstallprompt` через `externalPromptEvent`;
- приложение само решает, когда показывать install surface;
- install flow может показывать кнопку или инструкцию по установке;
- `manifest` и service worker подключаются как техническая основа installability;
- это не трактуется как обязательство по полноценной offline-работе.

## Продуктовая трактовка

Для `Admin App` и `Tenant App` install layer нужен как UX-функция:

- показать `Install app`;
- при необходимости показать инструкцию установки;
- упростить запуск приложения с рабочего стола или home screen;
- сократить трение при повторных входах.

Не нужно трактовать этот слой так:

- как переход продукта в offline-first режим;
- как обещание работы без сети;
- как отдельный большой PWA-проект.

## Что видно в vendor source

### 1. Библиотека и версия

В vendor source зафиксирован пакет:

- `@khmyznikov/pwa-install`
- версия `0.4.4`

### 2. React wrapper

React wrapper строится из:

- `src/react-legacy/pwa-install.react-legacy.ts`

Там `pwa-install` оборачивается через `@lit/react` и экспортируется как React component.

Это важно сохранить, если мы хотим точное donor-compatible поведение.

### 3. Build outputs

Vendor source собирает:

- основной bundle
- module build
- UMD build
- React legacy build

Для React-интеграции нам важен именно output:

- `dist/react-legacy/pwa-install.react-legacy.js`

### 4. Async install mode

В `README.md` у библиотеки явно описан режим, когда:

- `beforeinstallprompt` ловится заранее;
- событие сохраняется;
- компонент получает его позже через `externalPromptEvent`.

Это ровно совпадает с donor flow и является основным контрактом для нашего внедрения.

## Текущее состояние нашего frontend

На момент написания документа:

- `admin` и `tenant` уже имеют public auth shell;
- install flow ещё не внедрён;
- `beforeinstallprompt` ещё не ловится в `main.tsx`;
- `vite-plugin-pwa` ещё не подключён в shared Vite helper;
- `useRegisterSW` ещё не используется;
- `PWAInstall` ещё не монтируется ни в `admin`, ни в `tenant`.

Текущие точки внедрения:

- [platform/frontend/tooling/vite/create-app-config.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/tooling/vite/create-app-config.ts)
- [platform/frontend/apps/platform-admin-web/src/main.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/main.tsx)
- [platform/frontend/apps/tenant-web/src/main.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/main.tsx)
- [platform/frontend/packages/app-shell/src/public-auth-shell.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/public-auth-shell.tsx)

## Целевой контракт для нашего repo

### 1. Shared, а не дублированная интеграция

Install layer нужно строить как shared-поверхность:

- общая логика в `packages/app-shell`;
- общая техническая основа в `tooling/vite`;
- app-level остаются только branding, copy и placement.

### 2. Два независимых аспекта

Нужно разделять:

- `Install app` UX layer;
- service worker / manifest / update infrastructure.

Они связаны технически, но не должны смешиваться в продуктовой формулировке.

### 3. Online-first ограничение

Даже если мы подключаем:

- `manifest`
- `service worker`
- `vite-plugin-pwa`

это делается ради installability и controlled update flow.

Это не означает, что мы объявляем:

- offline caching как продуктовую фичу;
- offline data model;
- offline conflict resolution.

## Рекомендуемая схема внедрения

### Шаг 1. Подключить зависимости

В frontend workspace должны появиться:

- `@khmyznikov/pwa-install`
- `vite-plugin-pwa`

Также могут понадобиться типы:

- `@types/dom-chromium-installation-events`
- `@types/web-app-manifest`

### Шаг 2. Поймать `beforeinstallprompt` как можно раньше

Ловить его нужно на старте runtime, до того как пользователь откроет install UI.

Рекомендуемое место:

- `apps/platform-admin-web/src/main.tsx`
- `apps/tenant-web/src/main.tsx`

Что должен делать этот слой:

- слушать `beforeinstallprompt`;
- вызывать `preventDefault()`;
- сохранять событие в shared state или на `window`;
- очищать его после успешной установки.

### Шаг 3. Добавить shared hook/provider

В `packages/app-shell` нужен shared слой наподобие:

- `pwa-install-provider.tsx`
- `use-pwa-install.ts`
- `pwa-install-dialog.tsx`
- `pwa-update-prompt.tsx`

Минимальный контракт provider:

- `promptEvent`
- `isInstallAvailable`
- `isInstalled`
- `showInstallDialog()`
- `hideInstallDialog()`
- `clearPromptEvent()`

### Шаг 4. Смонтировать `PWAInstall`

Сам `PWAInstall` должен жить в shared слое, а не в app-specific копиях.

Лучший вариант:

- монтировать его один раз в `app-shell`;
- app-level передавать только `icon`, `manifestUrl`, copy overrides и placement policy.

### Шаг 5. Вывести install CTA в UI

Для текущего продукта install CTA лучше трактовать как secondary action.

Подходящие места:

- public auth shell;
- floating auth panel;
- user menu после авторизации;
- help / utility surface.

Для первой версии достаточно одного placement.

Наиболее безопасный старт:

- показывать install CTA на public auth shell;
- позже при необходимости дублировать в private shell.

### Шаг 6. Подключить `vite-plugin-pwa`

Это нужно сделать в shared helper:

- [platform/frontend/tooling/vite/create-app-config.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/tooling/vite/create-app-config.ts)

Нужный результат:

- обе app получают одинаковую installability infrastructure;
- `manifest` и `sw` генерируются единообразно;
- dev/prod поведение не расходится без причины.

### Шаг 7. Добавить update prompt

Если мы хотим повторить donor flow ближе к 1:1, нужно подключить:

- `useRegisterSW` из `virtual:pwa-register/react`;
- soft prompt с кнопкой `Update`.

Но это надо делать аккуратно:

- без MUI;
- на наших shared primitives;
- без перегрузки auth flow техническими сообщениями.

## Рекомендуемое размещение файлов в текущем repo

### Shared app-shell

Новые shared поверхности логично положить сюда:

- `platform/frontend/packages/app-shell/src/pwa-install-provider.tsx`
- `platform/frontend/packages/app-shell/src/pwa-install-dialog.tsx`
- `platform/frontend/packages/app-shell/src/pwa-update-prompt.tsx`
- `platform/frontend/packages/app-shell/src/use-pwa-install.ts`

Экспорты:

- `platform/frontend/packages/app-shell/src/index.ts`

Стили:

- `platform/frontend/packages/app-shell/src/styles.css`

### Shared Vite wiring

- `platform/frontend/tooling/vite/create-app-config.ts`

### App entrypoints

- `platform/frontend/apps/platform-admin-web/src/main.tsx`
- `platform/frontend/apps/tenant-web/src/main.tsx`

### App-specific branding

Если install surface потребует app-specific branding, оно должно оставаться в app code:

- `platform/frontend/apps/platform-admin-web/src/app/*`
- `platform/frontend/apps/tenant-web/src/app/*`

## Что нужно сохранить 1:1 из donor flow

Если мы хотим минимально конфликтный перенос, нужно сохранить:

- capture `beforeinstallprompt` до показа UI;
- ручную передачу события в `PWAInstall`;
- `manifestUrl`;
- `icon`;
- скрытие install prompt после `appinstalled`;
- ручной контроль момента показа.

Если мы это сохраняем, UX-поведение останется близким donor-приложению даже при другой визуальной оболочке.

## Что можно упростить относительно donor

Можно не переносить 1:1:

- MUI `Snackbar`;
- MUI `ThemeProvider` и `CssBaseline`;
- donor logging;
- donor-specific helpers;
- сложные offline формулировки в копирайте;
- лишние install screenshots, если они не нужны в первой версии.

## Когда нужен настоящий fork / rebuild vendor plugin

В большинстве случаев нам не нужен локальный fork.

Предпочтительный путь:

- использовать пакет из npm;
- локальную папку `platform/frontend/docs/pwa-install` держать как reference;
- собственную логику строить вокруг package integration, а не вокруг переписывания vendor source.

Fork нужен только если:

- надо менять поведение самого install dialog;
- надо править platform-specific инструкции внутри компонента;
- надо зафиксировать patched build, который нельзя получить настройками снаружи.

## Как пересобрать vendor plugin 1:1

Если всё же нужен буквальный rebuild из сохранённого source:

Рабочая папка:

- `platform/frontend/docs/pwa-install`

Базовый процесс:

1. установить зависимости;
2. выполнить vendor build;
3. получить `dist/*`;
4. при необходимости использовать React legacy output.

Ключевые команды из vendor `package.json`:

- `npm run build`
- `npm run build:noloc`
- `npm run dev`

Ключевые build outputs:

- `dist/pwa-install.es.js`
- `dist/pwa-install.bundle.js`
- `dist/react-legacy/pwa-install.react-legacy.js`

Важно:

- vendor source использует `webpack`, а не наш Vite runtime;
- это отдельная библиотечная сборка;
- её не нужно переносить в основной frontend build pipeline без реальной причины.

## Риски и оговорки

### React 19

Наш frontend уже на React 19.

Donor import использует:

- `@khmyznikov/pwa-install/react-legacy`

Начинать нужно именно с него, потому что это ближе всего к donor 1:1.

Если всплывёт несовместимость с React 19, fallback путь такой:

- импортировать сам web component;
- сделать тонкий local wrapper в `app-shell`.

### Service worker не равен offline support

Даже если в repo появится service worker, это ещё не значит, что продукт официально поддерживает работу без сети.

Для продукта нужно продолжать считать систему online-first, пока отдельно не спроектированы:

- offline boundaries;
- caching policy;
- data sync model;
- conflict handling.

## Acceptance criteria для будущего внедрения

Внедрение можно считать корректным, если:

- install prompt не показывается браузером самопроизвольно;
- приложение само управляет показом install surface;
- `Admin App` и `Tenant App` используют один shared install layer;
- install CTA может быть показан как кнопка или инструкция;
- после `appinstalled` install surface корректно исчезает;
- installability не ломает auth flow;
- система по-прежнему трактуется как online-приложение.

## Короткий вывод

Для текущего repo правильный путь такой:

1. не форкать библиотеку без необходимости;
2. использовать `@khmyznikov/pwa-install/react-legacy` как donor-compatible основу;
3. внедрять install flow как shared слой в `app-shell`;
4. подключить `vite-plugin-pwa` только как техническую основу installability и updates;
5. не смешивать это решение с полноценной offline-first стратегией.
