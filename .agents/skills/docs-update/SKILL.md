---
name: docs-update
description: Обновляет документацию после реализованной фичи: changelog, API notes, ADR/contracts, README/runbook, touched modules list, migration notes. Использовать после green implementation, если изменились поведение, контракты, API, setup, schema, permissions или операционные шаги.
---

Используй этот skill после успешной реализации, когда изменение влияет на:
- API;
- поведение пользователя;
- auth/permissions;
- tenant behavior;
- schema/migrations;
- runbook/setup;
- архитектурные контракты;
- список модулей или feature flags.

Не используй этот skill для:
- полностью локального рефакторинга без observable change;
- временных экспериментов, не вошедших в основной change;
- недоделанной фичи.

## Обязательный порядок работы

1. Прочитай:
   - план задачи;
   - verification report;
   - корневой и локальный `AGENTS.md`;
   - существующие docs conventions.

2. Определи, какие документы реально затронуты:
   - changelog;
   - API notes / OpenAPI / endpoint docs;
   - ADR / contract docs;
   - README / runbook;
   - migration notes;
   - touched modules list;
   - builder/runtime docs, если задача их затронула.

3. Обновляй только факты:
   - что уже реализовано;
   - что реально изменилось;
   - какие команды/шаги нужны теперь;
   - какие ограничения появились;
   - какие миграции/rollout steps нужны.

4. Если изменение архитектурное:
   - создай или обнови ADR;
   - явно укажи причину решения и влияние на систему.

5. Если изменение затрагивает API:
   - endpoint;
   - auth requirements;
   - tenant/admin context;
   - request/response shape;
   - error behavior;
   - migration/compatibility notes.

## Формат результата

Верни:

# Docs Update Summary

## Updated docs
- список файлов

## What changed
- кратко по каждому файлу

## Contracts/APIs updated
## Runbook / setup changes
## Migration / rollout notes
## Remaining docs gaps

## Правила
- Не описывай будущее как уже сделанное.
- Не придумывай архитектурные причины задним числом.
- Не обновляй unrelated docs “заодно”.
- Если реализация и docs расходятся, зафиксируй это явно.
