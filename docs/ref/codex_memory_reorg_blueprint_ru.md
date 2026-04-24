# Blueprint: локальная память и реорганизация docs для Codex / Atlas

Статус: proposed
Дата: 2026-04-16

## 1. Цель

Этот документ задает целевую структуру для:
- локальной памяти AI Agent / Codex
- локальных frontend/backend документов
- последующего выноса памяти и документов в отдельный knowledge-repo
- сохранения code-repo чистым: в remote push уходит только код, а memory/docs/agent overlay остаются локальными

Документ рассчитан на workflow с Codex и Atlas как orchestration layer.

---

## 2. Ключевой вывод

Да, структуру нужно реорганизовать.

Текущая схема уже сильная по идее:
- есть разделение на durable memory, prompts, templates, runs
- есть Atlas как first-touch orchestrator
- есть lane-specific FE/BE правила
- есть read order и memory update rules

Но для более продуктивной работы памяти нужно:
1. сильнее разделить durable truth, operational scaffolds и historical artifacts
2. убрать лишнюю “горячую” нагрузку с frontend/backend docs
3. сделать отдельный compact memory index
4. добавить lessons / episodic layer
5. подготовить layout, который удобно держать локально и потом вынести в отдельный repo

---

## 3. Базовый принцип

### 3.1 Что должно жить рядом с кодом
Рядом с кодом агенту нужны только:
- минимальные auto-discovery surfaces для Codex
- skill routing
- локальная project-specific override-инструкция
- ссылки на локальные memory/docs surfaces

### 3.2 Что не должно считаться “кодовой” частью репо
Не считать частью code-repo:
- shared durable AI memory
- lane run artifacts
- agent prompts/templates/contracts
- execution archives
- draft handoffs
- active planning docs
- memory lessons / episodic notes
- deep FE/BE research docs

### 3.3 Главный operational принцип
Code repo = код и минимальная discoverability.
Knowledge repo / local overlay = память, orchestration, docs, run history, prompts, plans, lessons.

---

## 4. Рекомендуемая целевая модель

Есть 2 рабочих варианта.

## Вариант A — переходный, самый практичный
Все живет локально внутри code-repo, но целиком gitignored.

### Плюсы
- максимально просто внедрить
- Codex легко подхватывает AGENTS.override.md, .agents/skills и .codex
- later migration в отдельный repo делается почти без изменения структуры

### Минусы
- физически knowledge-слой пока рядом с кодом
- требуется аккуратный .gitignore

### Рекомендуемая структура

```text
repo-root/
  AGENTS.md                     # очень короткий, можно оставить минимальным
  AGENTS.override.md            # local-only, gitignored

  .codex/                       # local-only, gitignored
    config.toml
    agents/
      atlas.toml
    contracts/
      atlas/
        routing-contract.md
        memory-contract.md
    standards/
      doc-taxonomy.md
      memory-lifecycle.md
    templates/
      plan-template.md
      lesson-template.md

  .agents/                      # local-only, gitignored
    skills/
      ramp-conductor/
        SKILL.md
        agents/openai.yaml
        references/
        assets/

  ai-local/                     # local-only, gitignored
    memory/
      index/
        memory-index.yaml
      durable/
        repo-map.md
        current-state.md
        decisions-log.md
        canonical-docs.md
        platform-contract.md
        module-index.md
      modules/
        shared/
        frontend/
        backend/
      lessons/
        frontend/
        backend/
        shared/
      working/
        active/
      runs/
        active/
        archive/
      archive/
        superseded/
        historical/

    docs/
      frontend/
        README.md
        modules/
        contracts/
        guides/
        archive/
      backend/
        README.md
        modules/
        contracts/
        guides/
        archive/

    scripts/
      memory-lint.py
      memory-pack.py
      archive-run.py
```

## Вариант B — целевой
Два repo:
- code-repo
- knowledge-repo

### Идея
`knowledge-repo` содержит:
- AGENTS override
- .codex
- .agents/skills
- durable memory
- docs
- runs
- archive
- plans
- lessons

А в `code-repo` остаются только:
- код
- возможно минимальный `AGENTS.md`
- возможно symlink или bootstrap script

### Рекомендуемая целевая структура knowledge-repo

```text
repo-ai/
  AGENTS.override.md
  .codex/
  .agents/
  memory/
    index/
    durable/
    modules/
    lessons/
    working/
    runs/
    archive/
  docs/
    frontend/
    backend/
  scripts/
    bootstrap-links.sh
    memory-lint.py
    memory-pack.py
```

### Как подключать к code-repo
Есть 3 способа:

#### Способ 1 — symlink overlay
В code-repo:
```text
AGENTS.override.md -> ../repo-ai/AGENTS.override.md
.codex -> ../repo-ai/.codex
.agents -> ../repo-ai/.agents
ai-local -> ../repo-ai
```

#### Способ 2 — bootstrap script
Скрипт раскладывает локальные symlink'и или копирует шаблоны.

#### Способ 3 — CODEX_HOME profile
Часть конфигурации держится в project-specific `CODEX_HOME`, но repo-local AGENTS override все равно желательно иметь для project routing.

---

## 5. Что я рекомендую именно тебе

Для твоего сценария лучший путь такой:

### Этап 1
Перейти на Вариант A:
- `AGENTS.override.md` local-only
- `.agents/skills/ramp-conductor` local-only
- `.codex/` local-only
- все FE/BE docs и memory перенести в `ai-local/`
- добавить строгий `.gitignore`

### Этап 2
Когда схема стабилизируется:
- вынести `ai-local/` в отдельный `repo-ai`
- оставить в code-repo только symlink/bootstrapping
- не менять внутреннюю структуру memory/docs повторно

Это даст:
- минимум перестроек
- удобную локальную работу
- готовность к later split

---

## 6. Как разделить память

Ниже — обязательное разделение по четырем типам памяти.

## 6.1 Procedural memory
Это то, как агент работает.

Сюда входят:
- `AGENTS.override.md`
- `.codex/agents/*.toml`
- `.codex/contracts/atlas/*`
- `.codex/standards/*`
- `.codex/templates/*`
- `.agents/skills/ramp-conductor/*`

Эта память:
- меняется редко
- versioned intentionally
- не должна быть смешана с project facts
- не должна хранить временные планы и эпизоды

## 6.2 Semantic memory
Это долгоживущая project truth.

Сюда входят:
- `memory/durable/current-state.md`
- `memory/durable/decisions-log.md`
- `memory/durable/module-index.md`
- `memory/durable/canonical-docs.md`
- `memory/durable/platform-contract.md`
- `memory/modules/**`
- `docs/frontend/contracts/**`
- `docs/backend/contracts/**`

Эта память:
- должна содержать stable facts и accepted contracts
- не должна хранить raw task history
- должна иметь state labels

## 6.3 Episodic memory
Это lessons, incidents, repeated pitfalls, successful patterns.

Сюда входят:
- `memory/lessons/**`
- distilled lessons из run closeout
- short incident notes
- reusable warnings

Эта память:
- не равна run history
- должна быть короткой
- должна использоваться перед risky actions

## 6.4 Working memory
Это memory текущей активной задачи.

Сюда входят:
- `memory/working/active/<task-id>/`
- live plan
- open questions
- local checkpoints
- unresolved blockers

Эта память:
- существует только пока задача активна
- после завершения или архивируется, или дистиллируется, или удаляется

---

## 7. Новая doc taxonomy для frontend/backend

Сейчас основная проблема не в том, что docs много.
Проблема в том, что в них смешаны разные роли.

Нужно разделить FE/BE docs на 4 класса.

## 7.1 Contract docs
Это спецификации и boundaries.
Храним в:
- `docs/frontend/contracts/`
- `docs/backend/contracts/`

Примеры:
- API contract
- schema contract
- auth/session contract
- runtime boundary
- package boundary
- tenancy contract

### Правило
Если документ определяет durable behavior — это contract doc.

## 7.2 Module docs
Это компактная актуальная картина по модулю.
Храним в:
- `docs/frontend/modules/<module>/`
- `docs/backend/modules/<module>/`

На каждый модуль желательно иметь максимум:
- `README.md`
- `contract.md`
- `state.md`
- `lessons.md`
- `archive/`

### Правило
У модуля не должно быть 12 равноправных “живых” документов.
Должен быть один entrypoint.

## 7.3 Guide docs
Это implementation/reference/guides.
Храним в:
- `docs/frontend/guides/`
- `docs/backend/guides/`

Сюда попадает:
- local bootstrap
- how-to
- checklists
- validation matrix
- migration guide

### Правило
Guide не должен masquerade как durable truth.

## 7.4 Archive docs
Все старые планы, handoff, audits, superseded notes.
Храним в:
- `docs/frontend/archive/`
- `docs/backend/archive/`
- `memory/archive/`

### Правило
Если документ больше не нужен в hot retrieval — он должен быть демотирован в archive.

---

## 8. Как ужимать docs после активной фазы

Это критически важно.

После активной фазы модуля нужно делать doc compaction.

## 8.1 Общий pipeline compaction

### Шаг 1 — инвентаризация
Собери все module-related docs:
- планы
- handoff
- audits
- contracts
- workstream notes
- implementation notes
- run artifacts

### Шаг 2 — классификация
Для каждого документа определи:
- durable contract
- current state
- lesson
- archive only

### Шаг 3 — сборка stable set
Оставь в active set только:
- `README.md`
- `contract.md`
- `state.md`
- `lessons.md`

### Шаг 4 — перенос лишнего
Все остальное перенеси в:
- `archive/`
- `runs/archive/`
- `memory/archive/`

### Шаг 5 — обновление индекса
Обнови:
- `canonical-docs.md`
- `module-index.md`
- `memory-index.yaml`

### Шаг 6 — write summary
Создай короткий summary:
- что стало canonical
- что archived
- что superseded
- что осталось open

## 8.2 Жесткое правило active-set
Для зрелого модуля в hot retrieval должны жить только:

```text
modules/<module>/README.md
modules/<module>/contract.md
modules/<module>/state.md
modules/<module>/lessons.md
```

Все остальные docs — только по запросу.

## 8.3 Что именно ужимать
Нужно aggressively ужимать:
- execution plans
- handoff packets
- one-off audits
- debug notes
- acceptance notes
- launch prompts
- repetitive workstream status files

## 8.4 Во что ужимать
Ужимать нужно не “в никуда”, а в 3 типа summary:

### Contract summary
Что стало stable и accepted.

### State summary
Что реально landed сейчас.

### Lesson summary
Что нельзя снова ломать / что уже проверено практикой.

---

## 9. Обязательный memory index

Нужен отдельный `memory-index.yaml`.

Пример:

```yaml
- id: platform-studio.form-builder.three-schema
  memory_type: semantic
  domain: platform-studio
  state: landed
  confidence: doc-confirmed
  owner_surface: shared
  summary: ps_model owns dataSchema and layoutBlueprint; ps_view owns uiSchema.
  tags:
    - form-builder
    - three-schema
    - authoring
  read_when:
    - task mentions form-builder
    - task mentions view/model/ui schema split
    - task modifies authoring or persistence
  canonical_docs:
    - memory/modules/shared/platform-studio/contract.md
    - docs/frontend/contracts/form-builder-three-schema-contract.md
    - docs/backend/contracts/form-builder-api-contract.md
  lesson_refs:
    - memory/lessons/shared/FORM-001.md
  last_verified: 2026-04-16
```

## Почему это важно
Atlas/Codex не должен сначала читать большие docs.
Он должен сначала читать:
- `AGENTS.override.md`
- `memory-index.yaml`
- компактный `current-state.md`
- нужный module README
- и только потом глубокие docs

---

## 10. Новый durable memory contract

## 10.1 current-state.md
Нужно ужать.
Это не дневник и не roadmap dump.

Там должны быть:
- 10–20 важнейших текущих truths
- active workstreams
- current risks
- active modules/apps/packages
- recommended reads by domain

## 10.2 decisions-log.md
Оставлять только durable decisions.
Каждая запись должна иметь:
- id
- date
- decision
- rationale
- status: active | superseded
- supersedes
- related module
- source docs

## 10.3 modules/*
Разделить по структуре:

```text
memory/modules/shared/platform-studio/
  README.md
  contract.md
  state.md
  lessons.md
  archive/
```

Не держать большой giant-file, где смешаны:
- landed facts
- accepted next
- plan
- deferred
- discussion residue

---

## 11. Новая run / episodic модель

Run artifacts не должны быть durable memory.

## 11.1 Active run
Во время задачи:
```text
memory/runs/active/<task-id>/
  control.md
  frontend.md
  backend.md
  final.md
  plan.md
```

## 11.2 On closeout
После закрытия run:
1. вынести short closeout summary
2. извлечь lessons
3. извлечь durable deltas
4. архивировать raw run

## 11.3 Что должно попасть в lessons
Пример:
```md
---
id: LESSON-PLATFORM-STUDIO-001
module: platform-studio
severity: medium
trigger: repeated bug / architecture drift
applies_when:
  - changing form builder view identity
  - changing add/copy/open view flow
---
Never infer view identity from mutable keys. Use stable viewId for route/open/save/load behavior.
```

---

## 12. Как должен работать Atlas после реорганизации

## 12.1 Intake
Atlas сначала читает:
1. `AGENTS.override.md`
2. `memory/index/memory-index.yaml`
3. `memory/durable/current-state.md`
4. relevant module `README.md`
5. only then deep docs if needed

## 12.2 Routing
Atlas обязан классифицировать:
- tiny direct FE
- tiny direct BE
- contract lock
- cross-stack coordinated work
- research only
- plan only
- memory maintenance

## 12.3 Memory write gate
После выполнения Atlas обязан выбрать один или несколько update types:
- none
- current_state
- decision
- module_contract
- lesson
- archive_only

## 12.4 Closeout
Нельзя просто закрыть run.
Нужно обязательно сделать:
- `shared durable delta`
- `lesson extraction`
- `archive decision`

---

## 13. Как изменить frontend/backend doc layout

Рекомендую новую структуру:

```text
ai-local/
  docs/
    frontend/
      README.md
      contracts/
        auth/
        transport/
        package-boundaries/
        modules/
      modules/
        platform-studio/
          README.md
          contract.md
          state.md
          lessons.md
          archive/
        collection-table/
          README.md
          contract.md
          state.md
          lessons.md
          archive/
      guides/
        bootstrap/
        checks/
        package-creation/
      archive/

    backend/
      README.md
      contracts/
        auth/
        tenancy/
        schema/
        modules/
      modules/
        platform-studio/
          README.md
          contract.md
          state.md
          lessons.md
          archive/
        admin-module-registry/
          README.md
          contract.md
          state.md
          lessons.md
          archive/
      guides/
        migrations/
        runtime/
        bootstrap/
      archive/
```

---

## 14. Что оставить в shared memory, а что разнести по FE/BE

## Shared durable memory
Оставить в shared:
- repo map
- platform contract
- current state
- decisions log
- module index
- canonical docs registry
- shared lessons
- cross-stack contracts
- cross-stack state

## Frontend docs
Держать только:
- frontend-specific runtime rules
- package boundaries
- UI contracts
- route/shell/auth app behavior
- frontend module implementation notes
- frontend lessons

## Backend docs
Держать только:
- backend runtime rules
- schema/tenancy/auth contracts
- module service/repository boundaries
- migration guides
- backend lessons

---

## 15. Что не надо хранить как активную память

Не держать в hot memory:
- длинные launch prompts
- полные run transcripts
- repetitive daily notes
- superseded implementation backlogs
- one-off analysis docs без durable outcome
- план, если работа уже завершена
- два разных документа с одной и той же truth

---

## 16. Обязательные state labels

Каждый значимый memory record должен иметь state:

- `landed`
- `accepted`
- `planned`
- `blocked`
- `deprecated`
- `superseded`
- `archived`

И confidence:
- `code-confirmed`
- `doc-confirmed`
- `inferred`

Это резко снижает смешение “что уже есть” и “что только согласовано”.

---

## 17. Минимальный local .gitignore

```gitignore
# Codex / local agent overlay
AGENTS.override.md
platform/AGENTS.override.md
platform/frontend/AGENTS.override.md
platform/backend/AGENTS.override.md

.codex/
.agents/
ai-local/

# optional bootstrap or cache
.codex-home/
.codex-cache/
```

---

## 18. Практический migration plan

## Этап 0 — без ломки текущего workflow
- оставить текущие `platform/AGENTS.md`, `platform/frontend/AGENTS.md`, `platform/backend/AGENTS.md`
- не менять сразу весь content

## Этап 1 — local overlay
- завести `AGENTS.override.md`
- завести `.codex/`
- завести `.agents/skills/ramp-conductor/`
- завести `ai-local/`

## Этап 2 — move memory/docs
- shared durable memory -> `ai-local/memory/durable`
- module memory -> `ai-local/memory/modules`
- FE docs -> `ai-local/docs/frontend`
- BE docs -> `ai-local/docs/backend`
- runs -> `ai-local/memory/runs`

## Этап 3 — add compact index
- создать `memory-index.yaml`
- переписать Atlas intake на index-first

## Этап 4 — compaction
- для каждого активного модуля собрать:
  - `README.md`
  - `contract.md`
  - `state.md`
  - `lessons.md`
- все остальное архивировать

## Этап 5 — linter
Скрипт должен проверять:
- path exists
- no duplicate canonical truths
- status enums valid
- prompt/template/schema drift
- archive references valid
- canonical-docs registry consistency

## Этап 6 — split repo
- вынести `ai-local/`, `.codex/`, `.agents/`, `AGENTS.override.md` в отдельный repo
- подключить symlink/bootstrap script

---

## 19. Рекомендация по Atlas

Atlas не нужно делать тяжелее.
Его нужно сделать строже и легче.

### Что изменить
- intake только через compact memory index
- memory write gate
- lesson extraction on closeout
- strict archive rule
- zero giant hot reads by default
- explicit classification: semantic vs episodic vs working memory update

### Что не делать
- не наращивать giant prompt
- не пихать в hot context весь frontend/backend docs corpus
- не смешивать accepted/planned/landed внутри одного active file

---

## 20. Итоговая рекомендация

Да, реорганизация нужна.

Наилучший для тебя путь:
1. локальный overlay внутри code-repo, целиком gitignored
2. `.agents/skills` и `.codex` оставить discoverable для Codex
3. всю durable memory и FE/BE docs перенести в `ai-local/`
4. после стабилизации вынести `ai-local/` + `.codex/` + `.agents/` + `AGENTS.override.md` в отдельный knowledge-repo
5. построить index-first retrieval и compaction pipeline

Итоговая цель:
- code-repo остается чистым
- Codex продолжает работать нативно
- память становится дешевле для retrieval
- frontend/backend docs перестают засорять hot context
- активная фаза разработки не разрушает долгосрочную память
