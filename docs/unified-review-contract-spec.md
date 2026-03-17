# Unified Review Contract — что это и как внедрить в canonical-dual-agent-stack-v3

Этот документ описывает, что такое **единый review contract** между `module_orchestrator` и downstream stages, зачем он нужен и как его внедрить в текущую сборку.

---

## 1. Что имеется в виду под unified review contract

`Unified review contract` — это **единая machine-readable форма**, в которой любой downstream stage передает результат обратно в `module_orchestrator` для review.

Идея простая:

- downstream stage не просто пишет `README.md` и `status.json`;
- он также отдает **нормализованный review handoff**;
- `module_orchestrator` читает его без догадок;
- после этого Maestro принимает решение и фиксирует его в feature/module state.

То есть review contract — это не новый агент и не новый workflow. Это **общий формат передачи stage result на review gate**.

---

## 2. Почему он нужен именно в текущей сборке

В текущей версии уже есть признаки будущего review loop:

- у `module_orchestrator/status.schema.json` есть состояние `awaiting_stage_review`;
- у feature-level статуса есть `gate = "awaiting_maestro_review"`;
- `research_codebase` в `handoff.recommended_next_agent` возвращает поток назад в `module_orchestrator`.

Но пока не хватает главного:

- нет единой структуры для stage-level review handoff;
- нет общего набора decision fields;
- нет явного distinction между:
  - stage complete,
  - stage accepted,
  - changes requested,
  - blocked,
  - rejected for next-stage dispatch.

В результате review есть концептуально, но недостаточно жестко описан машинно.

---

## 3. Что unified review contract должен решить

Он должен ответить на 5 вопросов одинаково для всех downstream stages:

1. **Что stage реально сделал?**
2. **Достаточно ли этого для review?**
3. **Как stage сам классифицирует результат?**
4. **Что должен проверить Maestro?**
5. **Какой следующий переход состояния разрешен?**

Пока ответы на это частично размазаны по prompts и статусам. Их нужно собрать в одну общую форму.

---

## 4. Каким должен быть итоговый паттерн

### 4.1. Downstream stage всегда отдает три слоя

Любой downstream stage должен выпускать:

1. **human-readable artifact**  
   например `research/README.md`

2. **stage machine-readable state**  
   например `research/status.json`

3. **review handoff block** внутри `status.json`  
   одинаковой формы для всех downstream stages

### 4.2. Maestro всегда записывает свой review отдельно

После чтения stage output Maestro не должен просто менять gate молча.

Он должен фиксировать свое решение в feature/module state отдельным review-слоем.

То есть:

- downstream stage пишет **review request**;
- Maestro пишет **review decision**.

Это важно. Иначе producer и reviewer смешиваются.

---

## 5. Рекомендуемая структура review handoff от downstream stage

Я рекомендую добавить в `status.json` каждого downstream stage объект:

```json
"review_handoff": {
  "ready_for_review": true,
  "stage": "research",
  "producer_agent_id": "research_codebase",
  "producer_persona": "Charlie",
  "completion_class": "complete",
  "recommendation": "accept",
  "recommended_next_stage": "design",
  "required_review_artifacts": [
    "README.md",
    "status.json"
  ],
  "decision_focus": [
    "is_scope_covered",
    "are_entrypoints_real",
    "are_findings_actionable"
  ],
  "blocking_issues": [],
  "open_questions": [],
  "required_inputs_for_next_stage": [
    "approved implementation direction"
  ]
}
```

### Поля и смысл

- `ready_for_review` — stage действительно дошел до точки review, а не просто закончил писать файл.
- `stage` — имя стадии: `research`, `design`, `implementation` и т.д.
- `producer_agent_id` — системное имя исполнителя.
- `producer_persona` — persona/UX layer.
- `completion_class` — как stage сам оценивает итог:
  - `complete`
  - `partial`
  - `blocked`
  - `failed`
- `recommendation` — что stage рекомендует reviewer:
  - `accept`
  - `accept_with_risk`
  - `changes_requested`
  - `blocked`
- `recommended_next_stage` — какой stage логичен дальше.
- `required_review_artifacts` — что Maestro обязан прочитать.
- `decision_focus` — по каким критериям надо смотреть решение.
- `blocking_issues` — конкретные blockers.
- `open_questions` — не blockers, но unresolved.
- `required_inputs_for_next_stage` — что понадобится следующему stage.

---

## 6. Где хранить review decision Maestro

Я рекомендую **не хранить review decision внутри downstream stage status**.

Правильнее расширить feature-level `status.json` так, чтобы именно Maestro фиксировал свое решение.

Пример нового блока в `artifacts/<module>/<feature>/status.json`:

```json
"review": {
  "pending_stage": "research",
  "review_status": "accepted",
  "reviewed_by": "module_orchestrator",
  "reviewed_at": "2026-03-17T01:30:00Z",
  "source_agent_id": "research_codebase",
  "source_stage_run_dir": "artifacts/<module>/<feature>/research",
  "decision_summary": "Research is grounded enough to proceed to design.",
  "decision_reasons": [
    "real entrypoints identified",
    "dependency surface mapped",
    "remaining questions are non-blocking"
  ],
  "next_stage": "design",
  "changes_requested": [],
  "blocking_issues": []
}
```

### Почему так лучше

Потому что:

- producer не должен сам себе ставить финальный review verdict;
- review decision — это ответственность `module_orchestrator`;
- feature-level state становится центром правды о том, какой stage принят, а какой нет.

---

## 7. Минимальные enum-значения, которые я рекомендую

### Для downstream `review_handoff.recommendation`

```text
accept
accept_with_risk
changes_requested
blocked
```

### Для feature-level `review.review_status`

```text
pending
accepted
accepted_with_risk
changes_requested
blocked
rejected
```

### Для downstream `completion_class`

```text
complete
partial
blocked
failed
```

Этого набора достаточно для первых нескольких стадий.

---

## 8. Как это встроить в текущую сборку

Ниже — практический план внедрения без слома текущего каркаса.

### Шаг 1. Вынести shared review schema в `.agent-code/contracts/shared/`

Добавить, например:

```text
.agent-code/contracts/shared/downstream-review-handoff.schema.json
.agent-code/contracts/shared/maestro-review-decision.schema.json
```

Это даст одну общую форму для всех будущих stages.

### Шаг 2. Расширить `research_codebase/status.schema.json`

Добавить туда объект `review_handoff`.

То есть `research/status.json` должен описывать не только:

- `summary`
- `handoff`
- `validation`
- `runtime`

но и:

- `review_handoff`

### Шаг 3. Обновить `research_codebase/status.template.json`

Шаблон должен выпускать этот новый блок по умолчанию.

Иначе drift между schema и реальным artifact content появится сразу.

### Шаг 4. Обновить `research_codebase` prompt

В `.agent-code/prompts/agents/research_codebase.md` нужно явно добавить правило:

- Charlie обязан формировать `review_handoff`;
- Charlie не принимает review decision;
- Charlie только подготавливает review packet.

### Шаг 5. Расширить feature-level schema у `module_orchestrator`

В `.agent-code/contracts/module_orchestrator/feature-status.schema.json` нужно добавить блок `review`.

Сейчас feature status знает про:

- `current_stage`
- `next_stage`
- `gate`
- `status`

Но этого мало. Нужен отдельный review section.

### Шаг 6. Обновить `module_orchestrator` prompt

В `.agent-code/prompts/agents/module_orchestrator.md` нужно закрепить, что при входе в review gate Maestro обязан:

1. прочитать `required_review_artifacts`;
2. прочитать `review_handoff` downstream stage;
3. принять одно из допустимых решений;
4. записать решение в feature status;
5. обновить module-level rollup, если требуется.

### Шаг 7. Научить validator проверять review loop

Минимум нужно расширить:

- `.agent-cli/src/validation.mjs`
- `.agent-cli/src/module-validation.mjs`

Что именно валидировать:

- если stage status = complete, то `review_handoff.ready_for_review = true`;
- если feature gate = `awaiting_maestro_review`, то stage artifacts должны существовать;
- если `review.review_status = accepted`, то `next_stage` не должен быть пустым, кроме terminal case;
- если `review.review_status = changes_requested`, feature не может считаться `complete`.

### Шаг 8. Добавить test fixtures

Нужны как минимум 4 случая:

1. valid accepted review
2. valid changes requested review
3. invalid: stage complete but no review_handoff
4. invalid: feature accepted but no source stage artifacts

Без fixture-based tests это быстро разъедется.

---

## 9. Как это будет выглядеть в рабочем цикле

### Текущий stage loop после внедрения

1. Maestro seeded feature.
2. Maestro dispatches `research_codebase`.
3. Charlie пишет `research/README.md` и `research/status.json`.
4. В `research/status.json` есть `review_handoff`.
5. Feature status переходит в `gate = "awaiting_maestro_review"`.
6. Maestro читает `review_handoff`.
7. Maestro записывает review decision в feature status.
8. После этого:
   - либо stage accepted и разрешен следующий stage;
   - либо changes requested;
   - либо blocked.

Это и есть законченный orchestration loop.

---

## 10. Почему это лучше, чем просто расширять handoff

Можно было бы попытаться впихнуть review-поля прямо в существующий `handoff`.

Я не советую так делать.

Причина в том, что `handoff` и `review` — это разные вещи:

- `handoff` отвечает за передачу результата дальше;
- `review` отвечает за оценку результата и разрешение state transition.

Смешивать их — значит снова сделать систему менее ясной.

---

## 11. Минимальный first implementation scope

Чтобы не раздувать систему, я бы внедрял unified review contract только для:

- `research_codebase`
- `module_orchestrator`

То есть сначала закрыть один полный loop:

```text
maestro → charlie → maestro review
```

И только потом переносить тот же паттерн на:

- design
- planning
- implementation
- documentation
- evidence

Это даст проверенный шаблон и не создаст лишней абстракции раньше времени.

---

## 12. Короткий вывод

Unified review contract — это не дополнительная роль, а **жесткий общий формат обратного входа downstream stage в Maestro**.

Он нужен, чтобы в системе появились:

- формальный review gate;
- одинаковые stage transitions;
- machine-readable decision trail;
- более надежная валидация orchestration loop.

Для текущей сборки это самый полезный следующий шаг. Не новый агент, а именно этот контракт.
