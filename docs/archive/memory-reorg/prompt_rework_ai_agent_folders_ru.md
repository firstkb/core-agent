# Archive Note

Status: archived historical input.
Do not use this prompt as current repository guidance.

# Prompt для Codex / GPT-5.4: переработка текущих папок для AI Agent

Скопируй текст ниже целиком в Codex.

---

Ты работаешь в существующем product repo и должен спроектировать, а затем по возможности подготовить реорганизацию текущих папок, связанных с AI Agent, durable memory, operational scaffolds и frontend/backend docs.

## Контекст

В текущем repo уже есть рабочая memory system:
- shared durable memory и orchestration guidance живут под `platform/docs/ai/`
- frontend docs живут под `platform/frontend/docs/`
- backend docs живут под `platform/backend/docs/`
- архив живет под `platform/docs/archive/`
- orchestration skill Atlas / `ramp-conductor` уже существует
- `platform/AGENTS.md` задает read order, memory roles, Atlas orchestration rule, memory update rules и run archive rule
- `platform/README.md` фиксирует текущий layout и роль `platform/docs/ai/`

Целевая задача: перестроить layout так, чтобы:
1. память AI Agent была отделена от frontend/backend docs
2. frontend и backend docs были отделены друг от друга и от shared memory
3. active memory, durable memory, prompts/templates, runs, archive и lessons были разведены по ролям
4. код можно было пушить в основной repo без memory/docs слоев
5. memory/docs/skills можно было держать локально, а затем без большой переделки вынести в отдельный knowledge-repo
6. Codex и Atlas продолжали работать предсказуемо

## Что нужно сохранить

Сохрани смысл существующей системы, даже если поменяются пути:
- разделение durable memory и workflow scaffolds
- Atlas как first-touch orchestration layer для нетривиальной работы
- read-order discipline
- lane separation для frontend и backend
- explicit memory updates
- archive rule для старых run artifacts
- repo-relative paths во всех документах

## Основные архитектурные принципы

1. Не смешивай в одном месте:
   - durable truth
   - working/active state
   - run artifacts
   - archive
   - frontend docs
   - backend docs
   - agent prompts/templates/skills

2. Делай структуру под selective retrieval, а не под “прочитать все подряд”.

3. Уменьшай hot context. После активной фазы модульные docs должны сжиматься.

4. Ничего не удаляй без явного основания. По умолчанию:
   - move
   - compact
   - archive
   - supersede

5. Не меняй продуктовый код, если задача касается только структуры памяти и docs. Меняй только документы, инструкции, skill layout, manifests, path references и локальные agent surfaces.

6. Если для безопасной миграции нужно сначала сделать plan-only режим, сначала покажи план, а потом переходи к изменениям только если они механические и однозначные.

## Предпочтительная целевая модель

Используй как default target локальный overlay в корне repo:

```text
repo-root/
  AGENTS.md                        # tracked, короткий repo-level guidance
  AGENTS.override.md               # local-only overlay, не уходит в remote

  .codex/                          # local-only Codex config / agents
    config.toml
    agents/

  .agents/
    skills/
      ramp-conductor/

  ai-local/
    memory/
      index/
        memory-index.yaml
      durable/
        repo-map.md
        platform-contract.md
        current-state.md
        decisions-log.md
        module-index.md
        canonical-docs.md
      modules/
        shared/
        frontend/
        backend/
      lessons/
        shared/
        frontend/
        backend/
      working/
        active/
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

    orchestration/
      prompts/
      templates/
      runs/
        active/
        archive/
      manifests/
      scripts/
```

Если ты найдешь более удачный target layout, можешь предложить его, но только если он:
- лучше разделяет роли
- лучше подходит для Codex/Atlas
- проще мигрируется из текущего состояния
- готов к будущему выносу в отдельный knowledge-repo

## Правила компрессии docs после активной фазы модуля

Для каждого зрелого frontend/backend/shared модуля нужно свести documentation footprint к компактному набору.

После stabilization оставляй только:
- `README.md` — короткий entrypoint и read order
- `contract.md` — текущие инварианты и cross-stack договоренности
- `state.md` — только актуальный landed state
- `lessons.md` — повторно используемые уроки и guardrails

А вот это уводи в archive или superseded:
- разовые handoff-документы
- audits, если они уже отработаны
- research notes
- draft plans
- old prompt artifacts
- закрытые runs
- устаревшие refactor plans

Если один и тот же факт дублируется в 3+ местах, сократи дублирование и оставь один canonical source plus ссылки.

## Обязательная классификация памяти

Каждый memory/doc surface отнеси к одной из ролей:
- `durable_memory`
- `working_memory`
- `episodic_lessons`
- `operational_scaffold`
- `frontend_doc`
- `backend_doc`
- `archive`
- `generated_or_vendor`
- `legacy`

Для durable записей дополнительно ставь semantic state:
- `landed`
- `accepted`
- `planned`
- `deprecated`
- `superseded`

## Что именно нужно сделать

Сделай работу в следующем порядке.

### Шаг 1. Inventory

Просканируй текущие папки и составь инвентаризацию всех поверхностей, связанных с:
- `platform/docs/ai/`
- `platform/docs/archive/`
- `platform/frontend/docs/`
- `platform/backend/docs/`
- `.agent/` и/или `.agents/`
- всех `AGENTS.md`, `README.md`, manifests, templates, prompts, scripts, которые ссылаются на старые пути

Выяви:
- что является durable truth
- что является active/working material
- что уже пора архивировать
- что дублирует другое
- что перегружает hot context
- какие path references сломаются при переносе

### Шаг 2. Target architecture

Предложи целевую структуру директорий.

Нужно явно показать:
- что остается tracked рядом с кодом
- что должно быть local-only
- что должно жить в `ai-local/`
- что должно остаться в `platform/frontend/docs/` и `platform/backend/docs/`, если ты считаешь, что часть docs все еще должна жить рядом с кодом
- как Atlas/skills/prompts/templates/runs будут расположены после миграции

### Шаг 3. Migration map

Составь точное отображение:
- старый путь -> новый путь
- old role -> new role
- действие: `keep`, `move`, `split`, `merge`, `compact`, `archive`, `supersede`

Не оставляй unmapped файлов для agent-memory/doc surfaces.

### Шаг 4. Reference repair

Найди и перечисли все документы, manifests, prompts, templates и scripts, где придется заменить старые repo-relative paths на новые.

Особенно проверь:
- read order
- path references в `AGENTS.md`
- `README.md`
- prompt/template registries
- skill docs
- automation manifests / changelogs
- run scaffolding references

### Шаг 5. Compaction policy

Сформулируй конкретную policy, как дальше ужимать frontend/backend docs после завершения активной фазы разработки модуля.

Policy должна отвечать на вопросы:
- какие документы остаются активными
- какие переводятся в archive
- какие сливаются в один canonical contract/state/lessons набор
- когда обновлять durable memory
- когда обновлять lessons
- когда закрытый run можно убирать из active surfaces

### Шаг 6. Execution plan

Дай безопасный пошаговый план внедрения:
1. подготовка структуры
2. перенос файлов
3. исправление ссылок
4. проверка отсутствия битых ссылок
5. обновление read order
6. обновление Atlas/skills surfaces
7. архивирование старых execution artifacts
8. финальная сверка

### Шаг 7. Optional implementation

Если изменения однозначные и не затрагивают продуктовый код, выполни doc/layout refactor локально.

Если полное выполнение неоднозначно, не фантазируй. Тогда:
- внеси только безопасные механические изменения
- остальное опиши как exact pending worklist

## Требования к ответу

Ответ должен быть максимально практичным и в таком формате:

1. `Current-state diagnosis`
2. `Target layout`
3. `Migration map`
4. `Tracked vs local-only surfaces`
5. `Compaction policy`
6. `Files that must be updated`
7. `Risks and rollback`
8. `Step-by-step execution plan`
9. `What I changed` или `Plan-only outcome`

Используй только repo-relative paths.

Не ограничивайся общими словами вроде “можно улучшить структуру”. Нужны точные пути, точные действия и точные правила.

## Критерии качества результата

Результат считается хорошим только если:
- durable memory отделена от operational scaffolds
- frontend и backend docs не смешаны
- есть отдельное место для lessons / episodic memory
- есть отдельное место для runs / execution artifacts
- есть отдельное место для prompts/templates/manifests
- target layout пригоден для local-only режима и будущего separate knowledge-repo
- все старые ссылки учтены
- нет бесконтрольного дублирования
- hot context стал меньше и понятнее

## Дополнительные правила мышления

- Думай как information architect для agent systems, а не как просто файловый сортировщик.
- Если видишь, что текущая структура смешивает `landed`, `accepted`, `planned` и `historical`, обязательно предложи явное разведение.
- Если видишь гигантские модульные docs, предложи compaction и breakdown.
- Если видишь, что какой-то файл нужен только как historical evidence, переводи его в archive.
- Если находишь противоречия между templates, manifests и run artifacts, помечай это как schema drift.
- Если видишь, что layout мешает selective retrieval, исправляй именно это.

В конце выдай финальный вердикт:
- рекомендуемый target layout
- минимальный безопасный migration slice
- какие изменения нужно сделать сразу
- какие изменения лучше делать второй волной

---
