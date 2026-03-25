---
name: backend-audit
description: Проводит read-only аудит текущего backend foundation на Go: app/service split, package boundaries, auth, tenant context, API shape, DTO/errors, migrations, module readiness, Control Plane vs Tenant Data boundaries. Использовать, когда нужно оценить текущее состояние backend и получить структурированные рекомендации без внесения изменений в код.
---

Используй этот skill для аудита backend-кодовой базы без внесения изменений в код.

Подходит для задач вида:
- оценить текущую backend foundation;
- понять, насколько удачно разделены app/service boundaries;
- проверить readiness к modular backend и дальнейшей AI-driven разработке;
- проверить auth, `/profile`, tenant context;
- проверить API conventions, DTO, errors, migrations;
- выявить архитектурные риски до запуска orchestration.

Не подходит для задач вида:
- реализовать новый endpoint;
- исправлять баги по ходу аудита;
- делать широкую архитектурную миграцию;
- менять схемы БД или писать код.

## Режим работы
- Read-only.
- Не изменяй код, миграции, конфиги и docs.
- Не предлагай новую архитектуру без анализа существующих пакетов и сервисов.
- Давай рекомендации только после просмотра реальной структуры backend.

## Обязательный порядок работы

1. Прочитай:
   - корневой `AGENTS.md`;
   - ближайший `backend/AGENTS.md`;
   - docs по backend architecture, auth, tenant model, API contracts, если они есть.

2. Собери карту backend foundation:
   - какие app/service уже есть;
   - package/module structure;
   - transport/handler layer;
   - service/use-case layer;
   - repository/storage layer;
   - auth/session/token flow;
   - tenant context resolution;
   - migrations / schema management;
   - shared packages;
   - jobs/runtime integration, если есть.

3. Оцени систему по этим блокам:
   - separation of concerns;
   - modularity;
   - readiness for Control Plane / Tenant Data split;
   - auth correctness;
   - tenant isolation discipline;
   - API consistency;
   - DTO / error model consistency;
   - migration discipline;
   - testability;
   - readiness for orchestration stage.

4. Для каждого замечания укажи:
   - evidence;
   - impact;
   - urgency;
   - concrete recommendation.

## Что искать обязательно

### Service boundaries
- есть ли понятное разделение на app/service/domain layers;
- не смешаны ли handler, business logic и storage;
- не слишком ли много shared package-ов без ясной ответственности;
- не начался ли premature microservice split.

### Auth / Session / Profile
- корректно ли организованы login / refresh / logout / token parsing;
- `/profile` и похожие endpoint-ы не раскрывают лишнего;
- identity берется из trusted context, а не из client input;
- admin и tenant semantics не смешаны.

### Tenant context
- есть ли ясный tenant-scoping подход;
- нет ли скрытого доступа к данным через несвязанные query params;
- подготовлена ли база для pooled/dedicated model;
- есть ли единый подход для tenant resolution.

### API contracts
- consistent ли routes, DTO, errors, pagination/filtering;
- есть ли случайные ad-hoc response shapes;
- не размазаны ли contract decisions по handler-ам.

### DB / Migrations
- есть ли единый migration flow;
- нет ли ad-hoc schema edits;
- storage model соответствует заявленной архитектуре;
- reference data и dynamic/runtime data не смешаны хаотично.

### Testability / Maintainability
- можно ли тестировать сервисы отдельно;
- есть ли очевидные seams для unit/integration tests;
- нет ли чрезмерной связанности;
- нет ли code paths, которые будет тяжело отдавать агентам на feature delivery.

## Формат результата

Верни результат строго так:

# Backend Audit Report

## 1. Executive summary
Краткая оценка состояния backend foundation.

## 2. Current architecture snapshot
- apps/services
- package structure
- auth/session
- tenant context
- API layer
- DB/migrations

## 3. What is already strong
Сильные стороны.

## 4. Key risks
Список главных рисков с приоритетом.

## 5. Findings by area
### Service boundaries
### Auth/session/profile
### Tenant context
### API contracts
### DB/migrations
### Testability / maintainability

Для каждого finding:
- evidence
- impact
- priority: now / soon / later
- recommendation

## 6. Readiness assessment
Оценка готовности backend foundation к следующему этапу разработки.

## 7. Recommended next actions
От 5 до 10 конкретных действий в порядке приоритета.

## 8. Out of scope / unknowns
Что осталось неясным.

## Правила
- Не меняй код.
- Не скрывай архитектурные слабости.
- Не давай общие советы без привязки к конкретным пакетам и слоям.
- Не требуй сложного redesign, если можно предложить staged improvement.
- Если видишь архитектурную путаницу между Control Plane и Tenant Data, выдели это отдельно.
