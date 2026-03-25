---
name: frontend-audit
description: Проводит read-only аудит текущего frontend foundation: UI kit, tokens, shell, routes, auth flow, table/form patterns, reusability, design-system consistency, Admin/Tenant app scalability. Использовать, когда нужно оценить текущее состояние фронтенда и получить структурированные рекомендации без внесения изменений в код. Не использовать для реализации фичи или рефакторинга.
---

Используй этот skill для аудита текущего состояния frontend-кодовой базы без внесения изменений в код.

Подходит для задач вида:
- оценить UI kit;
- оценить shell/layout architecture;
- проверить route/page organization;
- проверить consistency design system;
- оценить auth-related frontend flow;
- оценить table/form patterns;
- понять readiness foundation для дальнейшей разработки.

Не подходит для задач вида:
- реализовать фичу;
- сделать рефакторинг;
- добавить страницу, компонент или API wiring;
- исправить баги прямо в ходе аудита.

## Режим работы
- Read-only.
- Не изменяй код, конфиги, docs и assets.
- Не предлагай большой redesign без привязки к текущей кодовой базе.
- Давай рекомендации только после анализа реальных файлов и структуры проекта.

## Обязательный порядок работы

1. Прочитай:
   - корневой `AGENTS.md`;
   - ближайший `frontend/AGENTS.md` или аналогичный локальный файл;
   - связанные docs по shell, UI kit, routing, auth, если они есть.

2. Собери карту frontend foundation:
   - entry points;
   - app shell;
   - layout hierarchy;
   - route organization;
   - shared UI kit / primitives / tokens;
   - table/form infrastructure;
   - auth/protected-route flow;
   - shared hooks/state/api client, если это относится к фронтенду.

3. Оцени систему по этим блокам:
   - design system consistency;
   - token discipline;
   - component reuse;
   - shell scalability for Admin App / Tenant App;
   - route/layout boundaries;
   - auth UX and session behavior;
   - page composition quality;
   - table/form readiness;
   - maintainability and duplication;
   - readiness for orchestration stage.

4. Для каждого найденного замечания укажи:
   - где именно это видно;
   - почему это риск;
   - насколько это срочно;
   - что делать: `now / soon / later`.

## Что искать обязательно

### UI Kit / Design System
- есть ли единые tokens;
- нет ли hardcoded colors / spacing / radius / shadows;
- есть ли дублирующиеся primitives;
- consistent ли button/input/card/form states;
- отделен ли foundation от page-level styling.

### Shell / Layout
- есть ли единый app shell;
- не смешана ли product navigation с page actions;
- правильно ли разделены Admin shell и Tenant shell;
- нет ли nested scroll anti-patterns;
- не разрастается ли shell в хаос.

### Routes / Pages
- route tree понятна;
- protected routes организованы последовательно;
- page boundaries ясны;
- layout composition не размазана по случайным файлам.

### Auth flow
- login / logout / refresh / expired session UX;
- protected route behavior;
- tenant/admin context switching, если есть;
- нет ли логики auth прямо в UI-компонентах без нормальной границы.

### Tables / Forms
- есть ли повторное использование table/form primitives;
- есть ли consistency в list/detail/create/edit patterns;
- есть ли готовность к schema-driven runtime;
- нет ли локальных page-specific table/form решений, которые ломают масштабирование.

## Формат результата

Верни результат строго так:

# Frontend Audit Report

## 1. Executive summary
Краткая оценка состояния foundation.

## 2. Current architecture snapshot
- shell
- routes
- UI kit
- auth
- tables/forms

## 3. What is already strong
Сильные стороны.

## 4. Key risks
Список рисков с приоритетом.

## 5. Findings by area
### UI kit
### Shell/layout
### Routes/pages
### Auth flow
### Tables/forms
### Reusability / duplication

Для каждого finding:
- evidence
- impact
- priority: now / soon / later
- recommendation

## 6. Readiness assessment
Оценка готовности foundation к следующему этапу разработки.

## 7. Recommended next actions
От 5 до 10 конкретных действий в порядке приоритета.

## 8. Out of scope / unknowns
Что осталось неясным.

## Правила
- Не меняй код.
- Не скрывай слабые места.
- Не давай абстрактные советы без указания мест в кодовой базе.
- Не предлагай полный redesign, если проблемы точечные.
- Если видишь architectural drift, назови его прямо.
