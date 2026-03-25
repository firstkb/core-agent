---
name: backend-slice-go
description: Реализует bounded backend-задачи на Go: handler/service/repository, endpoint, auth/profile, tenant-scoped CRUD, jobs/runtime hook, migration, DTO/errors. Не использовать для широкого архитектурного редизайна, изменения tenant model или cross-service реорганизации без утвержденного плана.
---

Используй этот skill для backend-фич:
- новый endpoint;
- корректировка handler/service/repository;
- auth/profile;
- tenant/admin context;
- migration в рамках принятого плана;
- jobs/runtime handler;
- permissions / access check в пределах уже утвержденной модели.

Не используй этот skill, если:
- меняется архитектура сервисов;
- меняется tenant isolation strategy;
- меняется модель auth/session без отдельного плана;
- нужен cross-service redesign.

## Обязательный порядок работы

1. Прочитай:
   - корневой `AGENTS.md`;
   - ближайший `backend/AGENTS.md`;
   - план задачи;
   - существующие package conventions;
   - API / contract docs, если они есть.

2. Сначала определи target area:
   - Control Plane API;
   - Tenant Data API;
   - Jobs / Runtime;
   - shared package / transport / middleware / auth / repository.

3. Составь backend-mini-plan:
   - endpoint / handler;
   - service changes;
   - repository/storage changes;
   - migration changes;
   - tests needed;
   - security/tenant implications.

## Правила реализации

### A. Слои
Сохраняй границы:
- transport/handler;
- service/use-case;
- repository/storage.

Не помещай SQL или storage logic в handler.
Не тащи request/response DTO прямо в storage layer.

### B. DTO и ошибки
- Request/response DTO отдельно от persistence model.
- Следуй repo-standard для error model.
- Не вводи новый error shape без явной причины.

### C. Auth и tenant context
- Identity бери из auth middleware/context, а не из недоверенного client input.
- Tenant scope не должен silently приходить из query/body, если по модели он должен приходить из token/session/context.
- Admin и Tenant semantics не смешивай.

### D. Migrations
- Используй только утвержденную директорию и формат миграций.
- Не делай ad-hoc schema edits вне migration flow.
- Если миграция нужна, укажи rollback path.

### E. /profile и похожие эндпоинты
Если задача про `/profile`:
- endpoint возвращает текущего principal;
- не раскрывай лишние поля;
- не давай cross-tenant access;
- response shape должен быть стабильным и минимальным.

## Обязательные тесты

Минимум проверь:
- service/unit tests для бизнес-логики, если это принято в repo;
- handler/API tests;
- negative case по auth/permission/tenant scope для security-sensitive endpoint;
- migration smoke, если менялась БД.

## Формат итогового summary

Верни:

# Backend Slice Summary

## Goal
## Target app/service
## Changed packages/files
## API changes
## DB/migration changes
## Auth/tenant implications
## Tests added/updated
## Commands run
## Result
## Risks / follow-ups

## Ограничения
- Не меняй архитектуру без явного подтверждения.
- Не меняй unrelated packages.
- Не добавляй новый shared contract “заодно”, если он не нужен для текущей фичи.
- Если задача требует architecture gate, остановись и зафиксируй это явно.
