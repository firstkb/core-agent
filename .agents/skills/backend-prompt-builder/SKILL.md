---
name: backend-prompt-builder
description: На основе backend-задачи создает готовый набор пошаговых промптов для Codex: audit, remediation, planning, implementation, security/verify, docs update, cleanup. Использовать, когда нужно не писать код сразу, а правильно упаковать Go backend-задачу в bounded workflow.
---

Используй этот skill, когда пользователь хочет:
- из текста backend-задачи получить готовые пошаговые prompts;
- правильно прогнать backend-задачу через audit -> plan -> implementation -> verify -> docs;
- разбить слишком широкую backend-задачу на bounded slices;
- подготовить prompt pack для Go backend, API, auth, profile, tenant context, migrations, services, repositories, jobs/runtime.

Не используй этот skill, если:
- нужно сразу писать код;
- задача frontend-only;
- нужен только короткий совет;
- задача только про мелкую документацию.

## Цель skill-а

Твоя задача — **не реализовать backend-изменение**, а создать для пользователя **правильный набор пошаговых промптов**, который он сможет выполнять по этапам в Codex.

Ты должен превратить сырой backend-запрос в:
1. bounded scope;
2. рекомендуемый workflow;
3. готовые prompts по шагам;
4. правила хранения durable и temporary artifacts;
5. критерии завершения.

## Режим работы

Всегда работай в таком порядке:

### Шаг 1. Классификация задачи
Определи основной тип backend-задачи:
- `audit`
- `remediation`
- `new feature`
- `auth/session`
- `profile/identity`
- `tenant context`
- `api contract`
- `storage/migration`
- `jobs/runtime`
- `bugfix`
- `refactor`
- `docs-sync`

Если задача смешанная, выбери основной тип и перечисли вторичные.

### Шаг 2. Scope control
Проверь, не слишком ли задача широкая.
Если слишком широкая — сначала предложи bounded split.

Примеры слишком широких задач:
- "сделай modular backend"
- "сделай auth и tenant isolation"
- "приведи в порядок все API"

В таком случае сначала верни:
- `Suggested split`
- `Recommended first bounded task`

И только потом prompt pack для первого bounded task.

### Шаг 3. Выбор workflow

#### A. Audit workflow
Когда нужно оценить текущее состояние без изменения кода.
Цепочка:
- `$create-plan`
- `foundation_explorer`
- `foundation_reviewer`
- audit persist
- remediation file

#### B. Remediation workflow
Когда есть audit/report и нужно взять один bounded backend task.
Цепочка:
- `$create-plan`
- `$backend-slice-go`
- `$verify-and-review`
- `foundation_reviewer` (optional)
- `$docs-update`
- cleanup

#### C. New feature workflow
Когда есть новая bounded backend feature.
Цепочка:
- `$create-plan`
- `foundation_explorer` (optional)
- `$backend-slice-go`
- `$verify-and-review`
- `foundation_reviewer` для sensitive changes
- `$docs-update`
- cleanup

#### D. Sensitive workflow
Для auth/session, permissions, tenant context, migrations, runtime handlers.
Цепочка:
- `$create-plan`
- `foundation_explorer`
- `$backend-slice-go`
- `$verify-and-review`
- `foundation_reviewer`
- `$docs-update`
- cleanup

### Шаг 4. Сгенерируй prompts
Для каждого этапа верни отдельный copy-paste prompt.

### Шаг 5. Артефакты
Всегда предложи:
- durable artifacts в `docs/...`
- temporary artifacts в `.tmp/ai/...`

### Шаг 6. Cleanup
Всегда добавляй cleanup prompt.

## Обязательные правила для генерируемых промптов

1. Каждый prompt должен быть bounded.
2. Каждый prompt должен явно задавать:
   - source of truth;
   - scope / non-goals;
   - touched packages/services/files;
   - tests / checks / rollback;
   - output file path.
3. Не генерируй prompts вида "сделай весь backend".
4. Для audit-задач всегда указывай `read-only` и `не менять код`.
5. Для implementation/remediation всегда указывай:
   - использовать `$backend-slice-go`;
   - не менять глобальную архитектуру без явного подтверждения;
   - соблюдать handler/service/repository boundaries;
   - auth и tenant context брать только из approved flow.
6. Для backend-задач особенно проверяй и закладывай в prompts:
   - app/service split;
   - DTO/error conventions;
   - auth/session/profile;
   - tenant context propagation;
   - migrations discipline;
   - storage contracts;
   - permissions and access checks;
   - jobs/runtime handlers.

## Формат ответа

# Backend Prompt Pack

## 1. Task classification
- primary type
- secondary types
- risk level: low / medium / high

## 2. Recommended workflow
Короткое объяснение, почему выбран именно этот workflow.

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
Список условий завершения.

## 7. Notes
Короткие рекомендации по рискам.

## Шаблоны, которые нужно использовать внутри промптов

### Для planning prompt
Всегда включай:
- source of truth
- bounded task selection
- scope / non-goals
- touched packages/services/files
- API / DB / migration / auth / tenant implications
- tests / checks / rollback
- output plan path

### Для implementation prompt
Всегда включай:
- использовать `$backend-slice-go`
- source of truth = approved plan
- не расширять scope
- не менять архитектуру без явного подтверждения
- raw notes только в `.tmp/ai/...`

### Для verify prompt
Всегда включай:
- использовать `$verify-and-review`
- сравнить diff с plan
- прогнать lint/test/build/migration checks по AGENTS.md
- отдельно проверить auth / permission / tenant context implications
- report в `.tmp/ai/...`

### Для docs prompt
Всегда включай:
- использовать `$docs-update`
- обновить API notes / README / runbook / ADR / contracts, если затронуто
- не записывать будущее как уже сделанное

### Для cleanup prompt
Всегда включай:
- сохранить durable artifacts
- удалить `.tmp/ai/...`
- сначала перенести важные summaries из temp в docs/reports, если это еще не сделано

## Специальное правило
Если пользователь просит один prompt, а задача включает planning + implementation + verify, все равно верни **пошаговый prompt pack** как основной рекомендуемый вариант. Один monolithic prompt можно дать только дополнительным разделом `Fast mode`, но не как default.
