# Canonical Dual Agent Stack v3 — что это, зачем и как с ним работать

Этот документ описывает последнюю сборку `canonical-dual-agent-stack-v3` как эталонную основу для развития общего агентного стека под **Cursor** и **Codex**.

Документ опирается на фактическое содержимое архива `canonical-dual-agent-stack-v3.zip` и на проверку команд:

```bash
npm --prefix .agent-cli test
npm --prefix .agent-cli run check:runtimes
```

На проверенной копии архива оба запуска завершились успешно: тесты `.agent-cli` прошли, а runtime-адаптеры оказались `drift_free`.

---

## 1. Главная идея сборки

Сборка устроена по принципу:

- **один shared source of truth**;
- **один общий слой skills**;
- **два нативных runtime-адаптера**;
- **минимум платформенного дублирования**.

Это значит, что логика, контракты, шаблоны, стандарты и shared prompts редактируются **один раз**, а дальше из них генерируются нативные файлы для обеих платформ.

Ключевая цель этой версии — не «много агентов», а **чистая и расширяемая основа**, на которую потом можно безопасно наращивать новые стадии и роли.

---

## 2. Базовые архитектурные принципы

### 2.1. `.agent-code/` — единственный source of truth

Все, что определяет поведение системы, лежит здесь:

- контракты;
- схемы;
- шаблоны;
- shared prompts;
- стандарты;
- render templates;
- registry агентов и skills.

Редактировать руками нужно прежде всего именно `.agent-code/`.

### 2.2. `.agent-cli/` — валидация и генерация

`.agent-cli/` не хранит смысл системы. Он делает две прикладные вещи:

- валидирует артефакты и входы;
- рендерит нативные runtime-адаптеры.

Именно поэтому `.agent-cli` оставлен, а не вынесен наружу.

### 2.3. `.agents/skills/` — общий skill-слой

Здесь лежат human-facing workflow names:

- `maestro`
- `charlie`

Это общий слой для двух платформ. Он нужен, чтобы человек и основной runtime говорили на понятных никнеймах, а не на системных именах файлов.

### 2.4. `.cursor/` и `.codex/` — только нативные адаптеры

Обе папки сделаны **тонкими**.

Они не должны становиться вторым source of truth.
Они только представляют shared ядро в нативном формате конкретной платформы.

### 2.5. Разделение nicknames и system names обязательно

В сборке введено жесткое разделение:

- **skill nickname** — имя, которым пользуется человек;
- **system agent name** — имя, которым пользуется runtime, validator и machine-readable слой.

В текущей сборке:

- `maestro` → `module_orchestrator`
- `charlie` → `research_codebase`

Это правильный паттерн. Он снимает путаницу между persona, UX-именем и системным идентификатором.

---

## 3. Структура сборки

Ниже — смысл каждого основного слоя.

### `AGENTS.md`

Корневой сгенерированный policy-файл репозитория.

Он нужен для:

- общей маршрутизации;
- naming policy;
- описания source of truth;
- базовых правил работы с артефактами;
- списка стандартов и CLI-команд.

Важно: `AGENTS.md` — **generated adapter**, а не место для ручного редактирования логики.

### `.agent-code/`

Главное ядро системы.

Подпапки:

- `contracts/` — machine-readable договоры для агентов;
- `templates/` — шаблоны артефактов;
- `prompts/agents/` — shared prompts системных агентов;
- `prompts/skills/` — shared prompts skill nicknames;
- `standards/` — coding / docs / testing / security правила;
- `registry/` — реестр агентов и skills;
- `render/` — шаблоны генерации нативных runtime-файлов.

### `.agent-cli/`

Исполняемый слой.

Что уже есть:

- `validate-input`
- `resolve-paths`
- `validate-artifacts`
- `validate-module`
- `render-runtimes`

Это правильный минимальный набор для стартового contract-driven стека.

### `.agents/skills/`

Общий runtime-слой skills.

Сейчас там:

- `.agents/skills/maestro/SKILL.md`
- `.agents/skills/charlie/SKILL.md`

Эти файлы не должны быть длинными и самостоятельными. Их задача — быть **тонкими shared wrappers** и ссылаться на `.agent-code/prompts/skills/*`.

### `.cursor/`

Нативный Cursor-адаптер.

Сейчас он включает:

- `.cursor/agents/module_orchestrator.md`
- `.cursor/agents/research_codebase.md`
- `.cursor/rules/00-source-of-truth.md`
- `.cursor/rules/10-routing.md`

Что важно:

- **`.cursor/commands/` здесь сознательно отсутствует**;
- rules оставлены тонкими;
- Cursor не должен получать вторую независимую prompt-систему.

### `.codex/`

Нативный Codex-адаптер.

Сейчас он включает:

- `.codex/config.toml`
- `.codex/agents/module_orchestrator.toml`
- `.codex/agents/research_codebase.toml`

Логика та же: это адаптеры, а не источник правды.

### `artifacts/`

Место, где живут persisted результаты работы агентов.

Главная модель:

```text
artifacts/<module>/
artifacts/<module>/<feature>/
artifacts/<module>/<feature>/<stage>/
```

Это правильная основа, потому что она:

- feature-first;
- stage-aware;
- удобна для handoff;
- удобна для resume.

### `platform/`

Корень продуктового кода.

В prompts и standards этот путь зафиксирован как runtime code root.

---

## 4. Какие агенты и skills реально есть в сборке

### Skills

#### `maestro`
Human-facing inline workflow для:

- clarification;
- module briefing;
- feature seeding;
- orchestration readiness;
- review gates.

#### `charlie`
Human-facing research workflow для:

- исследования codebase;
- трассировки реальных entrypoints;
- определения зависимостей;
- подготовки research artifact pair.

### System agents

#### `module_orchestrator`
Системный агент оркестрации модуля.

Его зона ответственности:

- принять и нормализовать запрос;
- сформировать module-root артефакты;
- определить готовность к запуску;
- засидить feature-root пакеты;
- запустить downstream stage;
- принять результат через review gate.

Критично: он **не пишет product code**.

#### `research_codebase`
Системный агент исследования codebase.

Его зона ответственности:

- прочитать feature brief;
- исследовать реальные файлы и symbols;
- разделить observed facts и inference;
- выпустить research artifact pair;
- вернуть handoff обратно в `module_orchestrator`.

Критично: он **не реализует feature**.

---

## 5. Что именно генерируется

Из `.agent-code/` через `.agent-cli` рендерятся:

- `AGENTS.md`
- `.cursor/rules/*`
- `.cursor/agents/*`
- `.codex/config.toml`
- `.codex/agents/*`
- `.agents/skills/*`

Это важный момент: генерация работает **и для Cursor, и для Codex**. Она не должна быть cursor-only.

Основные команды:

```bash
npm --prefix .agent-cli test
npm --prefix .agent-cli run render:runtimes
npm --prefix .agent-cli run check:runtimes
```

`render:runtimes` — пересобирает адаптеры.  
`check:runtimes` — проверяет drift без записи.

---

## 6. Как правильно работать с этой сборкой

### Правило 1. Не редактировать generated adapters вручную

Не редактировать руками:

- `AGENTS.md`
- `.cursor/agents/*`
- `.cursor/rules/*`
- `.codex/agents/*`
- `.codex/config.toml`
- `.agents/skills/*`

Правка должна идти через `.agent-code/`.

### Правило 2. Любое изменение ядра заканчивать рендером и проверкой

Минимальный цикл:

```bash
npm --prefix .agent-cli test
npm --prefix .agent-cli run render:runtimes
npm --prefix .agent-cli run check:runtimes
```

### Правило 3. Любой новый агент сначала проектировать в shared-слое

Новый агент нельзя начинать с `.cursor/agents/...`.

Нужно сначала создать:

- контракт;
- шаблоны;
- shared prompt;
- registry entry;
- render support;
- validator support;
- потом уже runtime adapters.

### Правило 4. Новый skill не должен дублировать системного агента

Skill — это workflow nickname.  
Agent — это runtime/system identity.

Skill не должен становиться вторым каноническим именем.

### Правило 5. Rules должны оставаться тонкими

`.cursor/rules` не должны содержать вторую большую архитектуру.

Их задача:

- закрепить source of truth;
- закрепить routing;
- не спорить с `.agent-code`.

---

## 7. Нормальный рабочий сценарий для текущей версии

### Шаг 1. Вход через `maestro`

Пользователь обсуждает задачу с `maestro` inline.

На этом этапе `module_orchestrator`:

- уточняет scope;
- пишет module-root артефакты;
- определяет feature decomposition;
- выставляет readiness и approvals.

### Шаг 2. Seed features

После явного approval создаются feature-root артефакты:

- `artifacts/<module>/<feature>/README.md`
- `artifacts/<module>/<feature>/status.json`
- `artifacts/<module>/<feature>/maestro-packet.md`

### Шаг 3. Launch downstream research

После явного approval Maestro запускает research stage через `research_codebase`.

### Шаг 4. Charlie пишет research artifacts

Charlie пишет только:

- `artifacts/<module>/<feature>/research/README.md`
- `artifacts/<module>/<feature>/research/status.json`

Затем запускается валидация:

```bash
node .agent-cli/bin/agent-stack.mjs validate-artifacts research_codebase --module "<module>" --feature "<feature>" --write-status
```

### Шаг 5. Возврат на review gate

После завершения research поток должен вернуться в `module_orchestrator`, который решает:

- stage принят;
- stage требует доработки;
- stage заблокирован;
- stage завершен, можно идти дальше.

Сейчас именно здесь системе больше всего не хватает формализации.

---

## 8. Что в этой сборке уже хорошо

### Сильные стороны

- один источник истины;
- единая генерация runtime-адаптеров;
- нативность для двух платформ;
- чистое разделение skill nickname и system agent name;
- убран `.cursor/commands`;
- есть artifacts-first модель;
- есть минимальная CLI-валидация;
- есть проверка drift generated adapters.

### Почему это хороший эталон

Потому что он задает **правильный каркас**:

- shared contracts;
- shared prompts;
- shared standards;
- generated runtime adapters;
- machine-readable artifacts.

Это лучше, чем начинать расширение с новых персон и новых ручных prompt-файлов.

---

## 9. Что в сборке пока еще не завершено

Эта версия уже пригодна как база, но пока не является законченным production-grade orchestration framework.

Главные ограничения:

1. **Полноценно проведен только первый downstream loop — research.**  
   Остальные стадии еще не стандартизованы так же глубоко.

2. **Нет единого review contract между `module_orchestrator` и downstream stages.**  
   Есть gate-state, но нет общего machine-readable review handoff.

3. **Feature review формально еще недоописан.**  
   То есть возвращение результата назад уже задумано архитектурно, но еще не оформлено как общий контракт.

4. **Расширение на design / implementation / documentation надо делать через тот же shared pattern.**  
   Нельзя добавлять эти стадии как локальные исключения.

---

## 10. Что я считаю правильным следующим шагом

Следующий шаг — **не новый агент**, а **единый review contract**.

Именно он превратит текущую систему из:

- «есть orchestration и есть downstream stage»

в

- «есть полный contract-driven loop между orchestrator и stage outputs».

Пока этого нет, review остается частично смысловым и частично неформальным.

---

## 11. Короткий вывод

`canonical-dual-agent-stack-v3` — это хорошая эталонная база для наращивания системы.

Она уже задает правильную форму:

- shared ядро;
- нативные адаптеры;
- минимальный, но реальный validator слой;
- artifacts-first модель;
- ясное разделение людей-понятных имен и системных идентификаторов.

Ее стоит считать **основой**, а не «почти готовой полной платформой».

Наращивать сверху нужно осторожно и только через shared-контур:

- сначала контракт;
- потом шаблон;
- потом prompt;
- потом validator;
- потом runtime adapters.

Именно так стек сохранит целостность при росте.
