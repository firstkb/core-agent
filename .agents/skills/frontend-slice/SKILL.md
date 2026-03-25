---
name: frontend-slice
description: Реализует bounded frontend-задачи в этом репозитории: page, shell, route, table, form, auth screen, profile page, drawer, modal, filters, list/detail UI. Не использовать для backend-only задач, больших архитектурных переделок или foundation-изменений без утвержденного плана.
---

Используй этот skill для локальных frontend-фич:
- новая страница;
- экран авторизации;
- protected route;
- shell/layout;
- list/detail page;
- form page;
- table/filter/toolbar;
- drawer/modal;
- profile view;
- page-level state и API wiring.

Не используй этот skill, если:
- задача backend-only;
- нужно менять глобальную архитектуру frontend;
- нужно redesign foundation без утвержденного плана;
- меняется auth contract или storage contract без backend/architecture согласования.

## Обязательный порядок работы

1. Прочитай:
   - корневой `AGENTS.md`;
   - ближайший `frontend/AGENTS.md` или аналогичный локальный файл;
   - принятый план задачи, если он есть.

2. Сначала определи:
   - entry route / page / layout;
   - feature module;
   - shared components;
   - hooks / state / API client;
   - auth guards;
   - docs/tests, которые нужно обновить.

3. Перед изменениями составь краткий frontend-mini-plan:
   - какие файлы меняются;
   - какой UI contract затрагивается;
   - какие состояния обязательны;
   - какие проверки запустишь после.

## Правила реализации

### A. Не ломай design system
- Сначала используй существующие tokens, primitives, shared components и contracts.
- Не хардкодь цвета, radius, spacing, typography, shadows, если для этого уже есть token или shared primitive.
- Если не хватает токена или примитива, добавляй минимальное foundation-изменение и явно укажи это в summary.

### B. Держи границы
- Page / route orchestration отдельно от presentational components.
- Бизнес-логика не должна расползаться по UI-компонентам.
- Если есть shared table/form engine, переиспользуй его, а не создавай локальную копию.

### C. Обязательные состояния
Для каждого нового UI surface проверь:
- loading;
- error;
- empty;
- success/ready state;
- disabled / readonly / pending, если есть.

### D. Auth и навигация
Если задача связана с auth или shell:
- проверь redirect behavior;
- protected route;
- logout / expired session UX;
- tenant/admin context, если применимо.

### E. Accessibility baseline
Минимум проверь:
- labels;
- focus visibility;
- keyboard reachability;
- aria/title для dialog/drawer/menu, если есть.

## Smoke-check checklist

После реализации выполни:
1. Точные frontend-команды из `AGENTS.md`:
   - lint
   - test
   - build
   - typecheck, если есть
2. Открой/протести путь фичи локально.
3. Проверь, что:
   - route открывается;
   - ошибки отображаются адекватно;
   - page не ломает shell;
   - shared styles не деградировали.

## Формат итогового summary

Верни:

# Frontend Slice Summary

## Goal
## Changed files
## UI states covered
## Shared components/tokens reused
## New tokens/primitives added (if any)
## Commands run
## Result
## Risks / follow-ups

## Ограничения
- Не переписывай unrelated frontend areas.
- Не делай “тихий” redesign соседних экранов.
- Не создавай новый локальный UI pattern, если есть подходящий существующий.
- Если задача вышла за пределы bounded slice, остановись и предложи split.
