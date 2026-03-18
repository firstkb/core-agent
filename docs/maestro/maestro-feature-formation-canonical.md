---
doc_status: future_target
doc_scope: target_architecture
doc_type: future_architecture
lang: ru
---

# Maestro / Module Orchestrator — целевая архитектура формирования feature

Этот документ фиксирует принятые решения по роли `module_orchestrator` (`Maestro`) в новом control-plane стеке и по правилам формирования feature для AI-oriented monorepo (backend + frontend + package/shared, модульный монолит).

Документ считается **future-target архитектурой**, а не live runtime контрактом текущего рабочего стека.

Если этот документ конфликтует с текущими рабочими документами из:

- `docs/maestro/module-orchestrator-v2-spec-pack/`

то для текущей реализации и текущих прогонов приоритет у working-set документов.

---

## 1. Зафиксированный стек

Базовый стек фиксируется в следующем виде:

- `module_orchestrator`
- optional `researcher`
- `solution_planner` (planner + technical design)
- `worker`
- `test_writer`
- `test_runner`
- `reviewer`
- `debugger`
- optional `documenter`

### Базовый маршрут

`Maestro -> solution_planner -> worker -> SecurityAuditor -> test_writer -> test_runner -> reviewer -> reporter`

### Маршрут при высокой неопределенности

`Maestro -> researcher -> solution_planner -> worker -> SecurityAuditor -> test_writer -> test_runner -> reviewer -> debugger -> reporter`

### Documenter (Это обсуждаемо)

`documenter` не является обязательной стадией для каждой feature.
Он запускается только по триггеру:

- изменился публичный API;
- изменилась архитектура;
- появились важные developer-facing decisions;
- изменилась конфигурация/процедура интеграции;
- нужна фиксация ADR / migration note / public docs.

---

## 2. Роль Maestro

`Maestro` — это **owner-facing control-plane agent**, который превращает пользовательский запрос в корректные bounded feature packets.

### Maestro обязан:

- вести discussion loop с owner;
- собирать и стабилизировать `brief.md`;
- понимать platform footprint задачи:
  - backend
  - frontend
  - package/shared
- видеть границы модулей и связей между ними;
- качественно дробить задачу на feature;
- определять тип каждой feature;
- понимать, нужен ли `researcher`;
- понимать, можно ли идти сразу в `solution_planner`;
- создавать `feature-index.md` и отдельные feature packets после freeze brief.

### Maestro не должен:

- делать глубокий technical design;
- выбирать низкоуровневую структуру реализации;
- писать code examples;
- выбирать классы, хуки, DTO и файловую организацию;
- строить длинный execution plan вместо хорошей декомпозиции;
- компенсировать плохую feature decomposition сложным downstream workflow.

### Короткая формула

`Maestro` = технически грамотный декомпозер и маршрутизатор, но не low-level solution designer.

---

## 3. Главный принцип feature formation

### Каноническое правило

**Одна feature = один bounded execution packet = по умолчанию один implementation pass.**

Если после review нужен повторный прогон, это считается не новой внутренней фазой, а:

- `attempt-001`
- `attempt-002`
- `attempt-003`

внутри **той же feature**.

### Следствие

Planner / `solution_planner` не должен по умолчанию резать feature на несколько внутренних slices.

Он должен выбирать один из трех режимов:

- `single_pass`
- `staged_execution`
- `split_required`

### Норма

- `single_pass` — default;
- `staged_execution` — редкое исключение;
- `split_required` — если feature слишком большая или имеет плохую границу.

---

## 4. Как Maestro должен дробить задачу

Maestro не дробит задачу автоматически по слоям (`backend`, `frontend`, `package`).

### Плохая декомпозиция

Разделять на отдельные feature только потому, что задача затрагивает:

- backend
- frontend
- package

### Правильная декомпозиция

Разделять по:

- завершенному outcome;
- bounded scope;
- одной основной review-точке;
- одному execution packet;
- одной ожидаемой implementation story.

### Maestro должен сначала ответить на 5 вопросов

1. Какой **outcome** должен получить owner?
2. Можно ли описать задачу как **одну завершенную feature**?
3. Есть ли **один основной контракт изменения**?
4. Реалистично ли пройти задачу в **один implementation pass**?
5. Можно ли принять результат через **один технический review gate**?

Если на эти вопросы нет уверенного положительного ответа, feature надо либо:

- split на несколько feature;
- либо пометить как `staged_execution` только при явном техническом обосновании.

---

## 5. Когда оставлять одну feature

Feature остается одной, если одновременно верно:

- есть один owner-visible outcome;
- есть одна основная цель;
- change можно описать одним `packet.md`;
- change реалистично выполнить в один pass;
- review можно провести как одно техническое решение;
- revise / retry логика едина;
- зависимости между backend/frontend/package не требуют отдельных acceptance gates.

### Важное правило

Full-stack feature допустима и нормальна.

Если для одного outcome нужны:

- backend endpoint,
- frontend UI,
- shared/package contract,

это **не значит автоматически**, что надо создавать три feature.

---

## 6. Когда надо split feature

Feature нужно дробить, если:

- outcomes независимы;
- части можно принимать отдельно;
- одна часть является reusable package work;
- одна часть может быть выполнена независимо от другой;
- packet становится слишком широким;
- review становится слишком размытым;
- для выполнения уже на уровне Maestro видно, что нужен не один bounded pass, а несколько крупных самостоятельных ходов;
- появляется отдельный shared contract, который будет переиспользоваться многими модулями.

### Жесткое правило

Если feature не помещается в один bounded packet и один ожидаемый implementation pass,
**Maestro сначала пытается split feature**, а не перекладывает проблему в downstream plan.

---

## 7. Feature types

Для текущего стека фиксируются 5 типов feature:

- `backend`
- `frontend`
- `package`
- `full_stack`
- `cross_cutting`

### Правила интерпретации

#### `backend`
Изменение живет в серверной части и не требует отдельного UI/contract rollout.

#### `frontend`
Изменение локально для интерфейса и не требует новых backend/package решений.

#### `package`
Изменение касается shared contracts, shared libs, utilities, schemas, common AI abstractions.

#### `full_stack`
Один вертикальный outcome естественно проходит через backend + frontend + при необходимости package/shared.

#### `cross_cutting`
Редкий тип. Используется только когда изменение действительно затрагивает несколько областей как системное правило, а не как одна локальная бизнес-фича.

---

## 8. Platform footprint

У каждой feature фиксируются два измерения:

### 8.1. Primary platform

Одно значение:

- `backend`
- `frontend`
- `package`
- `full_stack`
- `cross_cutting`

### 8.2. Affected surfaces

Список реально затронутых областей:

- `backend`
- `frontend`
- `package`

### Пример

```yaml
primary_platform: full_stack
affected_surfaces:
  - backend
  - frontend
  - package
```

Это позволяет Maestro учитывать платформу и архитектуру, не уходя в low-level design.

---

## 9. Separate feature packet after brief freeze

### Решение зафиксировано

**Feature packet должен быть отдельным markdown-документом, вынесенным отдельно от `brief.md`.**

Но это делается **не во время живого discussion**, а **после freeze brief**.

### Во время discussion

Существует только один живой owner-facing document:

- `brief.md`

Feature decomposition в этот момент может временно жить внутри `brief.md`.

### После owner approval и freeze brief

Maestro обязан:

1. freeze `brief.md`;
2. создать `feature-index.md`;
3. создать для каждой feature отдельный `packet.md`.

### Причина

Это убирает два параллельных mutable источника правды.

До freeze:
- один живой документ = `brief.md`

После freeze:
- `brief.md` frozen
- `feature-index.md` frozen
- каждый `packet.md` frozen execution input

---

## 10. Почему packet, а не feature.md

Каноническое имя feature-документа:

- `packet.md`

Допустимый вариант:

- `feature-packet.md`

### Почему не `feature.md`

Имя `feature.md` звучит как еще один живой narrative document.

Имя `packet.md` подчеркивает, что это:

- execution input;
- bounded artifact;
- frozen packet;
- не место для бесконечных правок.

---

## 11. Каноническое содержимое packet.md

Каждый `packet.md` должен содержать только то, что необходимо для корректного routing и downstream execution.

### Рекомендуемая структура

```md
# Feature Packet

## Identity
- module_id
- feature_id
- title
- primary_platform
- affected_surfaces

## Outcome
- desired outcome
- business/technical value

## Scope
- in scope
- out of scope

## Affected areas
- modules
- apps
- packages
- contracts

## Constraints
- architecture constraints
- platform constraints
- standards to follow

## Acceptance criteria
- outcome checks
- technical checks

## Dependencies
- depends on
- blocked by

## Routing
- research_required: yes/no
- recommended_next_agent: solution_planner
- execution_expectation: single_pass | split_required

## Owner decisions already fixed
- approved assumptions
- rejected options
```

### Ограничение

`packet.md` не должен содержать:

- low-level implementation design;
- code examples;
- file-by-file change lists;
- внутреннюю структуру классов/хуков;
- детализированный technical plan реализации.

Это территория `solution_planner`.

---

## 12. Routing logic from Maestro

После создания `packet.md` Maestro выбирает следующий шаг:

### Вариант A — packet достаточно ясен

`packet -> solution_planner`

### Вариант B — высокая неопределенность

`packet -> researcher -> solution_planner`

### Когда нужен researcher

- root cause неочевиден;
- зона кода малоизвестна;
- есть legacy/unknown behavior;
- есть внешняя интеграция или неясные ограничения;
- есть риск построить ложный solution plan без предварительного исследования.

### Когда researcher не нужен

- feature ложится на известный паттерн;
- bounded area уже понятна;
- brief и packet дают достаточно контекста;
- риск architectural ambiguity низкий.

---

## 13. What Maestro must never do

Ни при каких условиях Maestro не должен:

- строить длинные внутренние execution phases для плохо сформированной feature;
- пытаться решать плохую декомпозицию downstream plan'ом;
- превращать packet в design document;
- брать на себя работу `solution_planner`;
- писать implementation examples;
- принимать split по слоям только из-за структуры репозитория.

---

## 14. Control questions for Maestro before packet emission

Перед созданием `packet.md` Maestro должен проверить:

1. Есть ли один четкий outcome?
2. Можно ли принять результат как одну feature?
3. Не является ли package/shared change отдельной reusable feature?
4. Не перегружен ли scope?
5. Реалистичен ли `single_pass`?
6. Нужен ли `researcher` до `solution_planner`?
7. Не ушел ли packet в low-level design?

Если ответ на вопрос 4 или 5 проблемный — сначала split.
Если ответ на вопрос 6 положительный — routing через `researcher`.
Если ответ на вопрос 7 положительный — packet надо упростить.

---

## 15. Canonical directory impact

На уровне модуля:

```text
artifacts/<module>/
  brief.md
  status.json
  feature-index.md
  features/
    <feature>/
      packet.md
      status.json
```

Далее downstream artifacts живут уже внутри feature:

```text
artifacts/<module>/features/<feature>/
  packet.md
  status.json
  research/
  solution/
  implementation/
  review/
```

---

## 16. Final fixed policy

Фиксируется следующая политика:

1. `Maestro` — не solution designer, а сильный технический декомпозер и маршрутизатор.
2. Во время discussion существует только один mutable owner-facing document: `brief.md`.
3. Отдельные feature markdown files materialize только после freeze brief.
4. Канонический feature document — `packet.md`.
5. `packet.md` — frozen execution input, а не живой документ.
6. `Maestro` обязан дробить по outcome и bounded scope, а не по слоям репозитория.
7. Default policy: `1 feature = 1 bounded packet = 1 expected implementation pass`.
8. Повторные прогоны реализации — это `attempts`, а не planner slices.
9. `solution_planner` определяет только:
   - `single_pass`
   - `staged_execution`
   - `split_required`
10. `researcher` — optional preflight capability, а не обязательная стадия.

---

## 17. Next specification items

Следующими документами для фиксации должны стать:

1. `feature-packet.contract.md`
2. `maestro-split-rules.md`
3. `solution_planner.output-contract.md`
4. `routing-matrix.md`
