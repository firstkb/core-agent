---
name: frontend-prompt-builder
description: На основе frontend-задачи создает готовый набор пошаговых промптов для Codex: audit, remediation, planning, implementation, verify/review, docs update, cleanup. Использовать, когда нужно не писать код сразу, а правильно упаковать задачу в bounded workflow для foundation-stage или controlled feature delivery.
---

Используй этот skill, когда пользователь хочет:
- из текста задачи получить готовые промпты для Codex;
- понять, как правильно прогнать frontend-задачу через audit -> plan -> implementation -> verify -> docs;
- разбить слишком широкую frontend-задачу на bounded slices;
- подготовить reusable prompt pack для shell, routes, auth UI, tables, forms, pages, UI kit, tokens, dialogs, drawers, navigation.

Не используй этот skill, если:
- нужно сразу писать код;
- задача backend-only;
- нужен только краткий совет без prompt pack;
- задача чисто про документацию без реализации.

## Цель skill-а

Твоя задача — **не реализовать frontend-изменение**, а создать для пользователя **правильный набор пошаговых промптов**, которые он сможет вставлять в Codex по этапам.

Ты должен превратить сырой запрос пользователя в:
1. корректный bounded scope;
2. рекомендуемый workflow;
3. набор готовых prompts по шагам;
4. правила для временных и durable артефактов;
5. критерии завершения.

## Режим работы

Всегда работай в таком порядке:

### Шаг 1. Классификация задачи
Сначала определи тип задачи. Выбери один основной тип:
- `audit`
- `remediation`
- `new feature`
- `route/layout`
- `auth flow`
- `ui-kit/design-system`
- `table/form patterns`
- `bugfix`
- `refactor`
- `docs-sync`

Если задача смешанная, выбери основной тип и явно перечисли вторичные.

### Шаг 2. Scope control
Проверь, не слишком ли задача широкая.
Если она слишком широкая, сначала предложи bounded split.

Примеры слишком широких задач:
- "приведи в порядок весь frontend"
- "сделай auth, routes и shell"
- "унифицируй все forms и tables"

В таком случае сначала верни:
- `Suggested split`
- `Recommended first bounded task`

И только потом генерируй prompt pack для первого bounded task.

### Шаг 3. Выбери workflow
Для frontend используй один из режимов:

#### A. Audit workflow
Когда нужно оценить текущее состояние без изменения кода.
Базовая цепочка:
- `$create-plan`
- `foundation_explorer`
- `foundation_reviewer`
- audit persist
- remediation file

#### B. Remediation workflow
Когда есть audit/report и нужно превратить его в plan и исправление.
Базовая цепочка:
- `$create-plan`
- `$frontend-slice`
- `$verify-and-review`
- `foundation_reviewer` (optional)
- `$docs-update`
- cleanup

#### C. New feature workflow
Когда есть новая bounded frontend feature.
Базовая цепочка:
- `$create-plan`
- `foundation_explorer` (optional)
- `$frontend-slice`
- `$verify-and-review`
- `$docs-update`
- cleanup

#### D. Refactor / risky change workflow
Когда задача чувствительная: shell, auth UI, route guards, token cleanup, shared patterns.
Базовая цепочка:
- `$create-plan`
- `foundation_explorer`
- `$frontend-slice`
- `$verify-and-review`
- `foundation_reviewer`
- `$docs-update`
- cleanup

### Шаг 4. Сгенерируй готовые prompts
Для каждого этапа сгенерируй отдельный prompt block, который пользователь может копировать как есть.

### Шаг 5. Артефакты
Всегда предложи:
- **durable artifacts** в `docs/...`
- **temporary artifacts** в `.tmp/ai/...`

### Шаг 6. Cleanup
Всегда добавляй финальный cleanup prompt.

## Обязательные правила для генерируемых промптов

1. Каждый prompt должен быть **bounded**.
2. Каждый prompt должен явно указывать:
   - source of truth;
   - scope;
   - ограничения;
   - ожидаемый output.
3. Не генерируй промпты вида "исправь всё".
4. Если задача слишком большая, сначала генерируй prompt на split/planning.
5. Для audit-задач всегда указывай `read-only` и `не менять код`.
6. Для remediation/new feature всегда указывай:
   - не расширять scope;
   - не трогать unrelated files;
   - использовать existing tokens/primitives/patterns.
7. Для frontend-задач фокусируйся на:
   - UI kit
   - tokens
   - shell/layout
   - routes/pages
   - auth-related UI lifecycle
   - tables/forms
   - reusability
   - app-local vs shared ownership

## Формат ответа

Отвечай строго в такой структуре:

# Frontend Prompt Pack

## 1. Task classification
- primary type
- secondary types
- risk level: low / medium / high

## 2. Recommended workflow
Коротко объясни, какой workflow выбран и почему.

## 3. Suggested bounded scope
- in scope
- out of scope
- если нужно: suggested split

## 4. Artifact plan
### Durable artifacts
Список файлов в `docs/...`

### Temporary artifacts
Список файлов в `.tmp/ai/...`

## 5. Copy-paste prompts
Дай промпты отдельными блоками в порядке выполнения.
Названия блоков:
- `Prompt 1 — Audit planning` или `Prompt 1 — Planning`
- `Prompt 2 — Explorer` (если нужен)
- `Prompt 3 — Persist audit` (если нужен)
- `Prompt 4 — Remediation planning` или `Implementation`
- `Prompt 5 — Verify and review`
- `Prompt 6 — Docs update`
- `Prompt 7 — Cleanup`

## 6. Done criteria
Список условий, когда задача считается завершенной.

## 7. Notes
Короткие рекомендации по рискам и ограничениям.

## Шаблоны, которые нужно использовать внутри промптов

### Для planning prompt
Используй внутри промпта логику:
- цель
- source of truth
- scope / non-goals
- touched areas
- tests / smoke / rollback
- output file path

### Для implementation prompt
Всегда добавляй:
- использовать `$frontend-slice`
- source of truth = approved plan
- не расширять scope
- не ломать design system
- raw notes только в `.tmp/ai/...`

### Для verify prompt
Всегда добавляй:
- использовать `$verify-and-review`
- сравнить diff с plan
- прогнать lint/test/build/typecheck/smoke
- report в `.tmp/ai/...`
- в чат вернуть только короткий verdict

### Для docs prompt
Всегда добавляй:
- использовать `$docs-update`
- обновлять только факты
- если изменились routes/auth/contracts, отразить это в docs

### Для cleanup prompt
Всегда добавляй:
- что сохраняем
- что удаляем
- проверить, что important summaries уже перенесены в durable files

## Специальное правило
Если пользователь просит "сделай мне промпт" в единственном числе, а задача на самом деле многосоставная, все равно верни **пошаговый prompt pack**, а не один oversized prompt. Один monolithic prompt разрешен только как дополнительный раздел `Fast mode`, но не как основной рекомендуемый вариант.
