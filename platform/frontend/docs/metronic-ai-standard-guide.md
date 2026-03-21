# Metronic React → собственный эталон frontend для разработки с AI agent

## Цель

Этот документ описывает практический способ взять **полезное из Metronic React template**, убрать лишнее и построить **свой эталон frontend-разработки** для большого приложения с **Go modular monolith** на backend и **AI agent** в роли помощника при проектировании, кодинге, рефакторинге и миграции.

Ключевая идея:

> **Metronic использовать как донора UI и UX-паттернов, но не как источник архитектуры проекта.**

Иначе очень быстро получится не ваш продукт, а продукт, который живет по внутренней логике template-а.

---

## Короткий вывод

Для твоего сценария Metronic полезен как источник:

- layout-ов;
- готовых визуальных примитивов;
- паттернов dashboard/admin UI;
- примеров responsive-поведения;
- состояний интерфейса: empty / loading / error / auth / settings / notifications.

Но Metronic **не стоит брать как базовую архитектуру** целиком, потому что у него template-first устройство:

- расширение через `src/pages` и routing-конфиг;
- готовые demo-layouts;
- встроенный provider/auth слой;
- преднастроенные demo-сценарии;
- лишние для твоего Go backend зависимости и соглашения.

Твой эталон должен быть таким:

- **архитектура — своя**;
- **UI — частично заимствованный**;
- **контракты — свои**;
- **папочная структура — domain/feature-first**;
- **правила для AI agent — явные и машинопонятные**.

---

## Почему Metronic вообще стоит рассматривать

По официальной документации Metronic React — это boilerplate на **Vite + Tailwind CSS**, с UI-компонентами на базе **Radix UI primitives**, несколькими dashboard layout-ами, routing на **React Router v7**, provider-системой и готовой authentication-обвязкой на **Supabase**. Это делает его сильным стартовым набором для admin/dashboard интерфейсов, но одновременно показывает, что template уже приходит со своей "осью принятия решений". Поэтому брать нужно выборочно, а не целиком.

---

## Принцип №1. Что именно брать из Metronic

### 1. Layout-идеи и page shell

Оставляем как источник идей:

- sidebar + header + footer;
- auth shell;
- error shell;
- responsive-режимы sidebar/menu;
- breadcrumbs, page title area, page actions;
- top nav / horizontal menu, если действительно нужен.

Что важно: layout — это **визуальная оболочка**, а не место хранения бизнес-логики.

### 2. Чистые presentational-компоненты

Подходят для переноса:

- Button;
- Input / Select / Checkbox / Switch;
- Card / Panel / Section;
- Dialog / Drawer / Popover / Tooltip;
- Badge / Tabs / Pagination / Breadcrumbs;
- Table primitives;
- Form field wrappers;
- Empty state / Error state / Loading state.

Хороший кандидат на перенос — компонент, который:

- не знает ничего про auth, routing, demo config;
- не читает глобальные provider-состояния без необходимости;
- не делает API-вызовы;
- не содержит demo-data внутри;
- не завязан на конкретную страницу;
- может жить в Storybook как изолированный UI-блок.

### 3. Паттерны композиции экрана

Можно использовать как reference:

- фильтры над таблицей;
- toolbar страницы;
- карточки KPI;
- master-detail;
- settings screen;
- form layout с sidebar summary;
- таблицы со status badges, actions, bulk actions.

Но переносить нужно **не экран целиком**, а саму идею композиции.

### 4. Design language

Из template можно аккуратно вынести:

- spacing scale;
- typography scale;
- радиусы;
- elevation/shadow policy;
- palette и semantic tokens;
- плотность UI;
- иконографику;
- hover/focus/active/disabled states.

Это должно превратиться в **твои design tokens**, а не оставаться набором случайных классов из vendor-template.

### 5. Состояния интерфейса

Очень полезно перенести как стандарт:

- skeleton loading;
- empty state;
- partial failure;
- full-page error;
- unauthorized / forbidden;
- stale data indicator;
- row actions / destructive confirm.

AI agent лучше работает там, где для состояний уже есть готовые стандартизованные блоки.

---

## Принцип №2. Что из Metronic нужно убрать

### Удалять почти сразу

- demo dashboards и demo pages, не относящиеся к продукту;
- Supabase auth слой, если backend у тебя на Go и auth будет своя;
- demo menu config;
- demo seed/mock data;
- preview/marketing/app concept pages, которые не входят в scope продукта;
- provider-ы, которые нужны template-у, но не нужны тебе;
- глобальный settings panel, если он не утвержден как часть продукта;
- utility/hooks, созданные только для обслуживания demo-layouts;
- vendor-specific обвязки вокруг меню, progress bar, темы и демо-навигации.

### Не делать источником истины

- `src/pages` как центральную ось архитектуры;
- готовый `routing` template-а как финальную модель роутинга;
- встроенную auth-структуру template-а;
- menu config как единственное место, где “живет архитектура продукта”.

### Переписать под свою модель

- auth;
- session management;
- navigation model;
- route guards;
- server-state/data fetching;
- API client;
- form validation;
- permissions/roles;
- page composition.

---

## Правило отбора: оставить как есть / обернуть / переписать / удалить

Для каждого файла из Metronic делай только одно из четырех решений.

## 1. Оставить как есть

Подходит, если компонент:

- чисто визуальный;
- typed и читаемый;
- не зависит от demo-config;
- не тянет business logic;
- легко переносится в `packages/ui`;
- проходит Storybook и smoke test без дополнительных костылей.

Примеры:

- простая кнопка;
- badge;
- card header;
- divider;
- avatar group;
- пустое состояние.

## 2. Обернуть

Подходит, если базовая реализация хорошая, но нужно привести к своему API.

Когда оборачивать:

- пропсы слишком vendor-specific;
- нужно унифицировать `size`, `variant`, `tone`, `loading`, `disabled`;
- нужно добавить `data-testid`;
- нужен JSDoc для AI agent и Storybook manifests;
- нужно убрать прямые импорты из template-структуры.

Примеры:

- таблица;
- date picker;
- dialog;
- select;
- sidebar nav item.

## 3. Переписать

Переписывать нужно, если компонент:

- связан с `RequireAuth`, `useSettings`, `useMenu`, demo layout hooks;
- знает о `MENU_SIDEBAR`, demo-конфиге, `basename`, demo routes;
- смешивает UI и API;
- содержит жестко вшитые тексты или demo-data;
- трудно тестируется;
- невозможно сделать reusable без сложного наследования от template.

Примеры:

- auth flow;
- app shell с menu config + providers + guards;
- demo dashboard page;
- сложные таблицы с vendor-specific внутренним состоянием;
- navigation layer.

## 4. Удалить

Удаляй без сожалений, если код:

- не используется в продукте;
- попал в проект только как часть demo;
- дублирует более простое решение;
- создает лишнюю когнитивную нагрузку для команды и агента.

---

## Целевая архитектура: что должно получиться в итоге

Ниже — целевой skeleton, который лучше подходит для большого frontend и AI-agent разработки.

```txt
repo/
  AGENTS.md
  docs/
    adr/
    vendor/
  apps/
    web/
      src/
        app/
        pages/
        widgets/
        features/
        entities/
        shared/
  packages/
    ui/
    api-client/
    config/
    mocks/
```

### Назначение слоев

#### `app/`

Только application bootstrap:

- router;
- providers;
- theme bootstrap;
- query client;
- app shell wiring;
- global error boundary;
- app-level navigation.

#### `pages/`

Только route-level композиция.

Страница не должна:

- содержать бизнес-логику фичи;
- делать raw API calls;
- знать детали UI primitives;
- превращаться в God component.

#### `widgets/`

Крупные page-блоки:

- orders-table-widget;
- account-summary-widget;
- dashboard-kpi-widget.

#### `features/`

Конкретные use-case модули:

- `auth/sign-in-with-password`;
- `orders/create-order`;
- `users/change-role`;
- `billing/download-invoice`.

#### `entities/`

Бизнес-сущности:

- session;
- user;
- order;
- invoice;
- project.

#### `shared/`

Только действительно shared-вещи:

- base ui wrappers;
- config;
- env;
- utility helpers;
- schema helpers;
- formatting;
- generic hooks.

#### `packages/ui/`

Твоя дизайн-система и reusable UI library.

Только здесь должны жить:

- primitives;
- composite reusable UI;
- layout shells;
- typography;
- icons policy;
- stories;
- UI docs.

#### `packages/api-client/`

Только generated и thin handwritten слой вокруг OpenAPI-контракта backend.

---

## Как перенести Metronic в эту архитектуру

## Этап 0. Сделать инвентаризацию

До первого реального переноса создай файл:

`docs/vendor/metronic-inventory.md`

Для каждого крупного каталога зафиксируй:

- путь;
- назначение;
- используется ли реально;
- решение: keep / wrap / rewrite / delete;
- целевая папка в новом skeleton;
- зависимость от auth/layout/provider/demo config.

### Что нужно проинвентаризировать первым

- `src/layouts`
- `src/pages`
- `src/routing`
- `src/auth`
- `src/providers`
- `src/components`
- `src/hooks`
- `src/config`
- `src/errors`

На этом этапе **нельзя переносить все подряд**.

---

## Этап 1. Создать чистый target repo

Не развивай продукт внутри исходного Metronic-дерева.

Правильнее так:

1. создать чистый monorepo/skeleton;
2. завести `packages/ui`;
3. завести `apps/web`;
4. завести `packages/api-client`;
5. описать правила в `AGENTS.md`;
6. только потом начинать перенос по частям.

### Почему это важно

Если развивать продукт прямо внутри template, агент и команда будут постоянно путаться:

- где demo, а где production code;
- что vendor-owned, а что product-owned;
- куда добавлять новую feature;
- что можно удалять без риска.

---

## Этап 2. Сначала вынести design tokens

Metronic нельзя тащить в продукт только как набор Tailwind-классов. Сначала выдели собственные design decisions:

- color roles;
- spacing;
- radius;
- shadow;
- z-index policy;
- typography;
- icon sizes;
- motion/transition policy.

Создай минимум:

```txt
packages/
  ui/
    src/
      tokens/
        colors.css
        spacing.css
        radius.css
        typography.css
        motion.css
```

### Результат этапа

После этого любой перенесенный компонент уже будет садиться **на твои токены**, а не на vendor-хаос.

---

## Этап 3. Вынести UI primitives в `packages/ui`

Переносить в первую очередь нужно не страницы, а строительные блоки.

Порядок:

1. button
2. input
3. select
4. checkbox / switch
5. card / panel
6. table primitives
7. dialog / drawer
8. badge / alert / toast wrappers
9. empty / loading / error states
10. page section / toolbar / filter bar

### Правила переноса UI-компонента

Каждый компонент после переноса обязан иметь:

- нормальное имя;
- чистый экспорт;
- понятный props API;
- Storybook story;
- базовый тест или interaction test;
- JSDoc на компоненте и ключевых пропсах;
- отсутствие зависимостей на demo-route, auth, provider, menu config.

### Пример структуры компонента

```txt
packages/ui/src/components/button/
  button.tsx
  button.stories.tsx
  button.test.tsx
  index.ts
```

---

## Этап 4. Пересобрать layout как свои shell-компоненты

Из Metronic layouts нужно сделать **твои** shell-компоненты.

### Вместо demo-layouts

Было:

- Demo1Layout
- Demo2Layout
- Demo3Layout
- AuthLayout
- ErrorLayout

Должно стать:

- `AppShell`
- `AuthShell`
- `ErrorShell`
- при необходимости `SplitPaneShell`, `SettingsShell`, `WorkspaceShell`

### Главное правило

Shell не должен знать ничего про demo-конфиг template-а.

Shell может знать:

- где header;
- где sidebar;
- где content slot;
- где secondary panel;
- как выглядит responsive collapse.

Shell не должен знать:

- какие именно пункты меню есть у продукта;
- какие роли есть у пользователя;
- как авторизуется пользователь;
- как зовутся demo pages.

### Где живут меню и навигация

Не внутри template-layout файла, а отдельно:

```txt
apps/web/src/app/navigation/
  main-nav.ts
  account-nav.ts
  role-nav.ts
```

---

## Этап 5. Заменить auth и providers на свои

Это один из самых важных этапов. Официальная документация Metronic React показывает встроенную auth-систему на Supabase. Для твоего случая с Go backend это не база, а технический долг в упаковке.

### Что делать

Удалить как источник истины:

- Supabase Provider;
- Supabase Adapter;
- template auth helpers;
- template protected route logic, если она завязана на их auth model.

Вместо этого собрать свою схему:

```txt
apps/web/src/
  entities/
    session/
      model/
      lib/
      index.ts
  features/
    auth/
      sign-in-with-password/
      sign-out/
      refresh-session/
  app/
    providers/
      auth-provider.tsx
      query-provider.tsx
      theme-provider.tsx
```

### Правило

`entities/session` описывает доменную модель сессии.

`features/auth/*` описывают use cases.

`packages/api-client` — единственный источник HTTP-контрактов с backend.

Никаких raw `fetch('/api/...')` в page- или ui-слое.

---

## Этап 6. Переносить не страницы, а фичи

Документация Metronic показывает сценарий "добавь страницу в `src/pages`, пропиши route в `src/routing/app-routing-setup.tsx`, добавь ссылку в навигацию". Для template это нормально, но для большого продукта и AI agent это слишком page-centric модель.

Вместо этого новую функциональность переносим так:

### Было

`src/pages/orders/list-page.tsx`

### Должно стать

```txt
apps/web/src/
  pages/
    orders/
      orders-list-page.tsx
  widgets/
    orders-table-widget/
  features/
    orders/
      filter-orders/
      export-orders/
      change-order-status/
  entities/
    order/
      model/
      api/
      ui/
```

### Практическое правило

- `page` собирает экран;
- `widget` собирает крупный page-блок;
- `feature` делает действие пользователя;
- `entity` хранит смысловую модель;
- `shared` и `packages/ui` дают инструменты;
- `app` ничего не знает о деталях конкретной бизнес-фичи.

---

## Mapping: что куда переносить из Metronic

## `src/layouts/*`

Переносить выборочно в:

- `packages/ui/src/layouts/*` — если это reusable layout shell;
- `apps/web/src/app/layouts/*` — если это app-specific shell.

Не переносить demo names и demo-specific config.

## `src/pages/*`

Не переносить как есть.

Использовать только как источник:

- layout composition;
- UX pattern;
- блоков, которые можно разрезать на `page/widget/feature/entity`.

## `src/routing/*`

Переписать под свой router setup в:

- `apps/web/src/app/router/*`

В routing-слое не должно остаться vendor-specific basename/demo redirects без прямой необходимости.

## `src/auth/*`

Почти всегда rewrite.

Целевая раскладка:

- `entities/session/*`
- `features/auth/*`
- `app/providers/auth-provider.tsx`
- `packages/api-client/*`

## `src/providers/*`

Переносить только после ревизии.

Оставлять по необходимости:

- query provider;
- theme provider;
- i18n provider;
- error boundary/provider.

Удалять или переписывать:

- settings provider без утвержденной продуктовой роли;
- auth provider template-а;
- providers, обслуживающие demo navigation/layout state.

## `src/components/ui/*`

Это лучший кандидат на extraction в `packages/ui`, но только после ревизии API и удаления зависимостей на template internals.

## `src/hooks/*`

Разобрать по назначению:

- generic hooks → `shared/lib` или `packages/ui`;
- layout-only hooks → рядом с shell;
- feature hooks → внутрь конкретной feature;
- auth hooks → в `entities/session` или `features/auth`.

## `src/config/*`

Разделить на:

- design/config → `packages/ui`;
- app config → `app/config`;
- navigation config → `app/navigation`;
- env → `shared/config`.

Не хранить архитектуру продукта внутри одного giant `menu.config.ts`.

---

## Как выглядит твой эталон после очистки Metronic

Ниже — рабочий минимальный стандарт.

### Стек

- React + TypeScript strict
- Vite
- React Router
- TanStack Query
- OpenAPI-generated client
- Storybook
- Vitest
- Playwright

### Основные правила

1. **UI отдельно от бизнеса.**
2. **Server state отдельно от local UI state.**
3. **API только через generated client.**
4. **Pages тонкие.**
5. **Features маленькие и изолированные.**
6. **Shared не превращается в свалку.**
7. **Design system живет отдельно.**
8. **Новые знания для агента лежат в `AGENTS.md`, Storybook, ADR и README пакетов.**

---

## Правила для AI agent

Чтобы AI agent реально ускорял разработку, проект должен быть для него не только кодовой базой, но и системой четких правил.

## Что обязательно должно быть в корне

- `AGENTS.md`
- `docs/adr/`
- `packages/ui/README.md`
- `packages/api-client/README.md`
- `docs/vendor/metronic-inventory.md`
- `docs/vendor/metronic-version.md`

## Что должен знать агент до начала работы

1. Где source of truth.
2. Куда класть новый код.
3. Какие файлы generated и их нельзя редактировать руками.
4. Через что ходить в API.
5. Как добавлять route.
6. Как добавлять feature.
7. Как добавлять shared UI.
8. Какие команды проверки запускать перед завершением задачи.

---

## Рекомендуемый `AGENTS.md`

```md
# Project Agent Rules

## Source of truth
- This file
- docs/adr/*
- package READMEs
- Storybook stories and docs
- generated API client contracts

## Architecture
- App is a modular frontend monolith.
- Do not use Metronic project structure as the source of truth.
- Pages are thin route compositions.
- Business actions live in features.
- Business models live in entities.
- Shared is only for truly generic code.

## UI rules
- Reuse packages/ui first.
- If a new UI primitive is needed, add it to packages/ui.
- Every shared UI component must have a story.
- Prefer wrapping extracted Metronic components instead of importing vendor internals directly.

## Data rules
- Do not use raw fetch or ad-hoc API URLs in app code.
- Use packages/api-client only.
- Do not edit generated files manually.

## Migration rules
- Never add new production code to temporary vendor or metronic folders.
- For each migrated file choose one status: keep / wrap / rewrite / delete.
- Remove demo data and demo routes during migration.

## Quality gates
- Run typecheck, lint, unit tests, and build before finishing.
```

---

## Почему Storybook обязателен для AI agent

Storybook полезен не только как каталог компонентов, но и как машиночитаемая карта UI.

### Практические правила

- на каждый reusable shared component — story;
- одна story = один use case;
- в story описывай не только `what`, но и `why`;
- добавляй JSDoc к компонентам и ключевым пропсам;
- документируй forbidden usage, если компонент легко использовать неправильно;
- исключай из AI manifests учебные или временные stories, если они не должны влиять на агента.

### Минимальный набор story для shared-компонента

- default;
- disabled;
- loading;
- destructive / success / warning, если есть tone;
- icon-only, если применимо;
- a11y-critical states;
- long content / overflow case.

---

## Стандарт миграции одного компонента из Metronic

### Definition of Done для UI-компонента

Компонент считается перенесенным корректно, если:

- он лежит вне vendor/template каталога;
- имеет свой export через `index.ts`;
- не зависит от demo config;
- не зависит от auth/provider template-а;
- имеет Storybook story;
- имеет понятный TS API;
- не тянет raw text, если проект использует i18n;
- использует твои design tokens;
- не импортируется deep import-ом из чужих внутренних путей;
- при необходимости имеет тест или interaction story.

---

## Standard of Done для migrated feature

Фича считается перенесенной корректно, если:

- UI разрезан на page / widget / feature / entity;
- нет прямой зависимости на demo route tree;
- нет зависимости на Supabase/template auth;
- API-вызовы идут через `packages/api-client`;
- есть loading / empty / error states;
- навигация и permissions решены через app/domain модель, а не через vendor menu magic;
- удалены все временные импорты из старого template-path.

---

## Практический workflow с AI agent

## Задача 1. Аудит каталога Metronic

Используй такой prompt:

```txt
Проведи аудит каталога <PATH> из Metronic React template.
Для каждого файла или подкаталога укажи:
1. назначение,
2. зависимости на auth/layout/provider/demo-config,
3. решение: keep / wrap / rewrite / delete,
4. целевую папку в нашей архитектуре,
5. риски переноса.
Не предлагай копировать страницы как есть.
Смотри на код с позиции modular frontend monolith и AI-friendly architecture.
```

## Задача 2. Извлечение UI-компонента

```txt
Возьми компонент <COMPONENT_NAME> из Metronic.
Сделай vendor-free extraction в packages/ui.
Требования:
- новый публичный props API,
- никакой зависимости на demo config,
- storybook story,
- JSDoc для компонента и ключевых props,
- index.ts export,
- сохранение визуального поведения,
- список отличий от оригинала.
```

## Задача 3. Перенос экрана без копирования страницы

```txt
Возьми экран <PAGE_NAME> из Metronic только как reference.
Не копируй page as-is.
Разрежь его на:
- page,
- widgets,
- features,
- entities,
- shared ui dependencies.
Покажи новую структуру файлов и каркас компонентов.
Соблюдай наш modular monolith frontend standard.
```

## Задача 4. Чистка template-зависимостей

```txt
Найди в модуле зависимости на:
- Supabase,
- RequireAuth,
- useSettings,
- useMenu,
- demo layouts,
- menu.config,
- demo routes,
- vendor-only helpers.
Предложи безопасный план удаления и переписывания.
```

---

## Анти-паттерны

### 1. Переносить экран целиком

Это создает новый большой нечитаемый блок, внутри которого смешаны:

- layout;
- data fetching;
- page state;
- таблицы;
- фильтры;
- actions;
- permissions;
- demo imports.

### 2. Оставить `src/pages` главным слоем продукта

Это делает архитектуру screen-first, а не business-first.

### 3. Хранить навигацию, роли и permissions внутри sidebar-конфига

Навигация — это представление политики доступа, а не сама политика.

### 4. Оставить template auth «временно»

Чаще всего “временно” превращается в долго живущий архитектурный долг.

### 5. Тянуть новые shared-компоненты прямо в app из старых vendor-папок

Так ты никогда не получишь полноценный `packages/ui`.

### 6. Разрешить raw API calls в любом месте

Это быстро ломает контракты, типизацию и предсказуемость для агента.

### 7. Смешивать production code и vendor code в одном каталоге

Агент и команда перестают понимать, что можно менять без последствий.

---

## Полезная политика обновления Metronic после extraction

Если ты все же купил/используешь Metronic, его нужно вести как внешний источник, а не как сердце проекта.

### Делай так

- зафиксируй версию template в `docs/vendor/metronic-version.md`;
- храни список импортированных компонентов;
- при выходе новой версии сравни changelog и решай, что реально стоит забрать;
- переноси security/package updates отдельно от UI migration;
- не делай массовый overwrite своего репозитория новым дропом template-а.

### Не делай так

- не заливай новую версию Metronic поверх production-кода;
- не синхронизируй автоматически все изменения template-а;
- не обновляй demo-архитектуру вместе со своими feature-модулями.

---

## Быстрый чеклист: как превратить Metronic в полезный донор, а не в архитектурную ловушку

### Шаг 1

Создай чистый repo/skeleton и запрети добавлять новый production code в исходные vendor-папки.

### Шаг 2

Проведи inventory всего template-а и классифицируй код по `keep / wrap / rewrite / delete`.

### Шаг 3

Сначала выдели design tokens.

### Шаг 4

Потом перенеси primitives в `packages/ui`.

### Шаг 5

Из layout-ов сделай свои shell-компоненты.

### Шаг 6

Перепиши auth и API integration под Go backend.

### Шаг 7

Переноси не страницы, а фичи и доменные блоки.

### Шаг 8

Все reusable UI покрывай stories и JSDoc.

### Шаг 9

Зафиксируй правила для AI agent в `AGENTS.md`.

### Шаг 10

Постепенно удаляй весь код template-а, который не стал частью твоего стандарта.

---

## Финальный эталон, к которому стоит прийти

В зрелом состоянии твой frontend должен отвечать на такие вопросы без споров и догадок:

### Где живет бизнес-логика?

В `features/` и `entities/`.

### Где живет shared UI?

В `packages/ui`.

### Где живет API?

В `packages/api-client`.

### Где добавлять новый route?

В `app/router`, а не в vendor-template-routing.

### Где лежит page composition?

В `pages/` и `widgets/`.

### Где инструкции для AI agent?

В `AGENTS.md`, ADR, Storybook, README пакетов.

### Что делать с новым кодом из Metronic?

Только одно из четырех: keep / wrap / rewrite / delete.

Если команда и агент могут однозначно ответить на эти вопросы, значит эталон реально сформирован.

---

## Приложение: рекомендуемая структура feature-модуля

```txt
apps/web/src/features/orders/change-order-status/
  api/
    mutate.ts
  model/
    use-change-order-status.ts
  ui/
    change-order-status-button.tsx
    change-order-status-dialog.tsx
  lib/
    map-status-options.ts
  index.ts
```

### Правила

- `api/` — только обращение к typed client;
- `model/` — orchestration/use-case state;
- `ui/` — конкретный интерфейс действия;
- `lib/` — локальные pure helpers;
- `index.ts` — public API модуля.

---

## Приложение: минимальная структура `packages/ui`

```txt
packages/ui/
  src/
    components/
      button/
      input/
      card/
      badge/
      dialog/
      table/
    layouts/
      app-shell/
      auth-shell/
      error-shell/
    patterns/
      empty-state/
      loading-state/
      error-state/
      page-toolbar/
    tokens/
      colors.css
      spacing.css
      radius.css
      typography.css
```

---

## Источники и опорные материалы

Ниже — официальные материалы, на которые опирается эта инструкция.

- Metronic React Introduction — обзор стека, layout-ов, provider-архитектуры и auth: <https://docs.keenthemes.com/metronic-react>
- Metronic React Routing — структура `app-routing`, `app-routing-setup`, `RequireAuth`: <https://docs.keenthemes.com/metronic-react/guides/routing>
- Metronic React Layouts — dashboard/auth/error layouts и их назначение: <https://docs.keenthemes.com/metronic-react/guides/layouts>
- Metronic React Adding a New Page — page-centric способ расширения template-а: <https://docs.keenthemes.com/metronic-react/guides/adding-new-page>
- Metronic React Providers — provider system и использование React Router hooks: <https://docs.keenthemes.com/metronic-react/guides/providers>
- Metronic React Authentication — встроенная auth-система на Supabase: <https://docs.keenthemes.com/metronic-react/guides/authentication>
- Metronic React Changelog — версия шаблона и зависимостей: <https://docs.keenthemes.com/metronic-react/getting-started/changelog>
- Next.js AI Coding Agents — практическая идея `AGENTS.md` как входной инструкции для агента: <https://nextjs.org/docs/app/guides/ai-agents>
- Storybook AI Best Practices — как писать stories, полезные для AI agent: <https://storybook.js.org/docs/ai/best-practices>
- Storybook Manifests — как Storybook отдает машиночитаемое описание компонентов для AI workflow: <https://storybook.js.org/docs/ai/manifests>

