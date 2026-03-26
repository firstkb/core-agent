Теперь картина стала намного чище.

После твоего уточнения архитектура выглядит так:

* **Platform Builder живет внутри `tenant-web`**
* **`platform-admin-web` не участвует в построении tenant UI**
* `platform-admin-web` остается для:

  * tenant lifecycle,
  * onboarding,
  * billing,
  * feature flags / rollout,
  * возможно templates/packages на уровне платформы

А внутри `tenant-web` у тебя есть:

* обычный runtime tenant app
* и скрытая по правам зона **Platform Builder**

И еще одно важное уточнение:

## “Menu Builder / Module Builder” в твоем случае лучше назвать **Navigation / Sidebar Builder**

Потому что он не просто строит меню.
Он должен уметь подключать в sidebar:

* **UI schemas**, созданные builder’ом
* **system modules**, которые существуют в коде приложения
  например `Task Manager`, `Documents`, `Messenger`, и так далее

То есть sidebar item должен указывать не на “форму”, а на **target**.

---

# 1. Да, V1 и метамодель — это разные вещи

Это связанные, но разные уровни.

## V1

Это **что пользователь сможет делать** в Builder.

То есть продуктовый scope:

1. Entity Model Designer
2. View Builder
3. Navigation / Sidebar Builder
4. Access Builder
5. Workflow + Action Binding

## Метамодель платформы

Это **какие объекты система хранит**, чтобы все это работало.

То есть внутренний контракт платформы:

* entity definitions
* field definitions
* view definitions
* navigation nodes
* policies
* workflows
* actions
* publish manifests

### Простая формула

* **V1** = продуктовые capability
* **метамодель** = внутренние registry-объекты и связи между ними

---

# 2. Я бы чуть уточнил твой V1

Твои 5 блоков правильные, но третий я бы переименовал.

## Было

3. Module + Navigation Builder

## Лучше

3. **Navigation / Sidebar Builder + Target Catalog**

Почему:

* `app` в V1 у тебя уже фиксирован: это **tenant app**
* значит визуально пользователю не нужен “App Builder”
* ему нужен:

  * sidebar tree
  * sections/groups
  * items
  * order
  * icons
  * route target
  * access
  * channel flags

А “module” в V1 — это не отдельный builder-слой, а **тип target-а**, на который может ссылаться sidebar node.

---

# 3. Что фиксируем как V1 scope

## 1. Entity Model Designer

Пользователь может:

* создать entity
* добавить fields
* добавить relation
* добавить child collection
* назначить semantic roles

### V1 semantic roles

Минимально:

* title
* status
* date
* owner / assigned to
* location

---

## 2. View Builder

Пользователь может создать:

* form
* list/grid
* detail
* checklist
* modal/drawer

### Важное ограничение V1

Не делать freeform canvas “как Figma”.

Для V1 нужен **structured visual builder**, а не абсолютное позиционирование.

То есть:

* sections
* groups
* tabs
* collection blocks
* action bars
* info blocks
* field placements

С drag-and-drop внутри **слотов**, а не по пикселям.

Это критично.
Иначе вы очень быстро утонете в хаосе layout-логики.

---

## 3. Navigation / Sidebar Builder

Пользователь может:

* собрать sidebar tree
* создать group / item / divider
* подключить target
* задать icon
* задать order
* задать route
* задать visibility / permissions
* выставить channel flags

### Типы target для V1

* `view`
* `system-module`
* `external-link`

---

## 4. Access Builder

Пользователь может:

* выставить role matrix
* field visibility / readonly / editable
* action permissions
* record filters через DSL

### Важно

V1 Access Builder должен **использовать существующие роли/группы**
из вашего auth/tenant слоя, а не изобретать новую identity-модель.

---

## 5. Workflow + Action Binding

Пользователь может:

* создать statuses
* transitions
* buttons
* on submit action
* on approve action
* action bindings на view/manual buttons

### Но

Сами обработчики — **кодовые**, platform-owned.

Builder только:

* выбирает handler из registry
* привязывает его к событию
* конфигурирует параметры

---

# 4. Что обязательно добавить поверх этих 5 блоков

Формально это не шестой builder, а **горизонтальный платформенный слой**.

## Без этого V1 будет опасным:

* draft / published
* validation
* publish
* rollback / version snapshot
* change audit

### То есть

Builder работает в draft-состоянии,
runtime tenant app читает только published manifest.

---

# 5. Минимальная метамодель V1

Ниже — тот набор registry-объектов, который реально нужен.

---

## A. Model Registry

### `EntityDefinition`

Главный объект схемы данных.

Содержит:

* `id`
* `key`
* `name`
* `description`
* `storageKey`
* `lifecycleState`

### `FieldDefinition`

Поля entity.

Содержит:

* `entityId`
* `key`
* `label`
* `dataType`
* `required`
* `defaultValue`
* `optionSetId?`
* `relationRef?`
* `computed?`

### `RelationDefinition`

Связи между entity.

Содержит:

* `sourceEntityId`
* `targetEntityId`
* `kind` (`one-to-one`, `many-to-one`, `one-to-many`, `many-to-many`)
* `fkField`
* `displayMode`

### `ChildCollectionDefinition`

Повторяемые дочерние блоки.

Содержит:

* `parentEntityId`
* `childEntityId`
* `relationKey`
* `displayLabel`

### `SemanticRoleBinding`

Семантические роли полей.

Например:

* title field
* status field
* date field
* owner field
* location field

### Опционально уже в V1

`OptionSetDefinition`
Для:

* dropdown options
* status variants
* static lists

---

## B. View Registry

### `ViewDefinition`

Представление данных.

Содержит:

* `id`
* `entityId`
* `type` (`form`, `list`, `detail`, `checklist`, `modal`)
* `channel` (`web`, `mobile`, `pwa`, `public`)
* `title`
* `variantOf?`
* `isDefault`

### `ViewLayoutNode`

Элемент layout.

Это может быть:

* section
* tabs
* field binding
* collection block
* text block
* html block
* divider
* action bar

### `ViewActionPlacement`

Где в UI отображается action:

* header button
* row action
* footer action
* inline action

### `ViewVariant`

Это либо:

* derived view
* forked copy

Для V1 я бы поддержал:

* `base view`
* `derived variant`

А полный fork оставить, но использовать реже.

---

## C. Navigation / Sidebar Registry

### `NavigationTree`

Корневое дерево sidebar tenant app.

### `NavigationNode`

Узел sidebar.

Содержит:

* `id`
* `parentId`
* `type` (`group`, `item`, `divider`)
* `label`
* `icon`
* `order`
* `routeKey`
* `target`
* `channelFlags`
* `visibilityPolicyId?`

### `NavigationTarget`

Это самый важный объект для твоего кейса.

```ts
type NavigationTarget =
  | { kind: 'view'; viewId: string }
  | { kind: 'system-module'; moduleKey: string }
  | { kind: 'external-link'; url: string }
```

Именно так sidebar сможет подключать:

* builder-generated screens
* системные модули
* внешние ссылки

### `SystemModuleCatalogEntry`

Это уже code-owned registry.

Примеры:

* task-manager
* documents
* messenger
* dashboard
* reports

Builder не создает system module,
он только **подключает его в navigation**.

---

## D. Policy Registry

### `PolicySet`

Набор правил для роли/группы.

### `FieldPolicy`

Для поля:

* hidden
* readonly
* editable

### `ActionPolicy`

Для action:

* allowed / denied

### `RecordFilterPolicy`

DSL-фильтр на записи.

### Минимальный DSL для V1

Поддержать:

* `eq`
* `neq`
* `in`
* `contains`
* `gt`
* `lt`
* `isNull`
* `and`
* `or`

И переменные контекста:

* current user
* current role
* current team
* current tenant
* current tree scope

---

## E. Workflow Registry

### `WorkflowDefinition`

Привязан к entity.

### `StatusDefinition`

Список статусов.

### `TransitionDefinition`

Переходы между статусами.

### `ButtonDefinition`

UI-кнопки, которые запускают transition или action.

### `ActionBinding`

Связка:

* event
* handler
* config

Примеры event:

* `onCreate`
* `onSubmit`
* `onApprove`
* `manual`

### `ActionHandlerCatalogEntry`

Code-owned registry.

Примеры:

* `create_corrective_action`
* `send_notification`
* `assign_task`
* `sync_external`
* `calculate_score`

---

## F. Publish / Runtime Registry

Это лучше не отдавать пользователю как отдельные бизнес-объекты,
но они должны существовать.

### `DraftSnapshot`

Черновик изменений.

### `PublishedManifest`

Опубликованная конфигурация tenant runtime.

### `VersionSnapshot`

Снимок для rollback.

### `ValidationReport`

Ошибки и предупреждения перед publish.

---

# 6. Связи между объектами

Упрощенно это выглядит так:

```text
EntityDefinition
 ├─ FieldDefinition[]
 ├─ RelationDefinition[]
 ├─ ChildCollectionDefinition[]
 ├─ SemanticRoleBinding[]
 ├─ ViewDefinition[]
 └─ WorkflowDefinition

ViewDefinition
 ├─ ViewLayoutNode[]
 ├─ ViewActionPlacement[]
 └─ may derive from another ViewDefinition

NavigationTree
 └─ NavigationNode[]
      └─ target -> ViewDefinition | SystemModuleCatalogEntry | ExternalLink

PolicySet
 ├─ FieldPolicy[]
 ├─ ActionPolicy[]
 └─ RecordFilterPolicy[]

WorkflowDefinition
 ├─ StatusDefinition[]
 ├─ TransitionDefinition[]
 ├─ ButtonDefinition[]
 └─ ActionBinding[]
```

---

# 7. Что из этого editable в V1, а что должно остаться code-owned

## Visual editable в V1

* entity
* field
* relation
* child collection
* semantic role
* view
* view layout
* navigation tree
* navigation nodes
* policies
* workflow
* transitions
* buttons
* action bindings

## Code-owned в V1

* widget catalog
* system module catalog
* action handler catalog
* auth model
* tenant lifecycle
* billing
* attachment infrastructure
* audit infrastructure

## System-generated в V1

* routes
* publish manifest
* version snapshots
* default autogenerated views
* runtime bundles

---

# 8. Как Builder должен выглядеть визуально

Вот здесь самое важное:
не делать один гигантский “универсальный экран”.

Нужна **единая Builder Shell** и внутри нее 5 focused workspaces.

---

## Builder Shell

### Верхняя панель

Показывает:

* текущий tenant
* текущий объект
* draft/published status
* validate
* preview
* publish
* version history

### Левая колонка

Навигация по Builder:

* Overview
* Models
* Views
* Sidebar
* Access
* Workflows
* Publish

### Центральная зона

Canvas / editor / table / graph

### Правая колонка

Inspector:

* свойства выбранного объекта
* advanced settings
* access / visibility
* bind / target / widget config

---

# 9. Как должен выглядеть каждый дизайнер

## 9.1 Entity Model Designer

### Layout

* слева: список entities
* центр: fields table + relations + child collections
* справа: field inspector / relation inspector

### Основные зоны

* `Fields`
* `Relations`
* `Child Collections`
* `Semantic Roles`

### V1 функционал

* add field
* reorder fields
* choose data type
* required
* default
* relation setup
* option set bind
* semantic role assign

### Не делать в V1

* сложный ER-диаграммный редактор на старте
* автоматический query builder
* сложные computed pipelines

---

## 9.2 View Builder

Это главный визуальный редактор.

### Layout

* слева: palette + structure tree
* центр: view canvas
* справа: node inspector

### Palette V1

* section
* tabs
* 2-column group
* field
* collection block
* action bar
* info text
* html block
* divider

### View types V1

* form
* list
* detail
* checklist
* modal

### Обязательные возможности

* choose base entity
* choose view template
* drag field into section
* configure widget
* configure label/help/visibility
* preview with sample record
* desktop/mobile preview
* create derived variant

### Очень важное правило

Canvas должен быть **slot-based**.
То есть не free drag anywhere, а вставка в известные layout slots.

---

## 9.3 Navigation / Sidebar Builder

Это в твоем случае отдельный ключевой builder.

### Layout

* слева: sidebar tree
* центр: node editor
* справа: target picker + access + order + channels

### Типы узлов

* group
* item
* divider

### Для item

Нужно уметь настроить:

* label
* icon
* order
* slug / route
* target type
* target value
* visibility
* default landing
* channel flags

### Target Picker

Должен показывать 3 вкладки:

* Views
* System Modules
* External

### Отдельно

Для system modules желательно показывать:

* module name
* icon
* required permissions
* supported channels

### Это и есть правильная реализация твоей идеи

“подключать UI схемы и какие-то системные модули в sidebar, потом настраивать порядок и права”.

---

## 9.4 Access Builder

### Layout

* слева: roles / groups
* центр: matrix
* справа: detail rule inspector

### Матрицы V1

* entity permissions
* view permissions
* action permissions
* field access

### Отдельный блок

Record filter builder:

* visual DSL editor
* preview of resolved filter
* test against sample data

### Важно

Не использовать raw SQL как основной режим.
SQL / expert mode можно оставить как advanced later.

---

## 9.5 Workflow Builder

### Layout

* слева: entity selector
* центр: statuses + transitions graph
* справа: action binding / button config

### Что должно быть видно сразу

* status map
* allowed transitions
* button labels
* trigger events
* bound handlers

### V1 функционал

* add status
* add transition
* assign button
* bind handler on submit/approve/manual
* configure minimal handler params

---

## 9.6 Publish Center

Хотя это не отдельный pillar, визуально он нужен.

### Что показывает

* draft changes
* impacted entities/views/navigation
* validation errors
* warnings
* publish button
* version history
* rollback

---

# 10. Миграция мысли из legacy в новую модель

По твоим скринам старого интерфейса я бы сделал такую ментальную замену:

## Старое

* `Data Forms`
* `Modules`
* `Pages`
* `PWA`

## Новое

* `Data Forms` → **Entity + Field + Relation Registry**
* `Pages` → **View Registry**
* `Modules` → **System Module Catalog + Navigation Targets**
* `PWA` → **channel flags / view variants**, а не отдельный мир

И еще:

* старый `FormType: SOR / CHECKLIST / CA`
  лучше перенести в:

  * view presets
  * workflow presets
  * module templates
    но не в основу storage model

---

# 11. Как разложить это по вашему monorepo

По твоему дереву сейчас самое важное — **не переусложнить packages слишком рано**.

## Я бы начал так

### В `tenant-web`

сделать feature:

```text
apps/tenant-web/src/features/platform-builder/
  shell/
  overview/
  models/
  views/
  navigation/
  access/
  workflows/
  publish/
  state/
  routes/
```

### Новый shared package

```text
packages/platform-builder-core/
```

Туда положить:

* TS types
* zod / runtime schemas
* registry contracts
* validation rules
* manifest types
* helper services

### Использовать уже существующие packages

* `ui-kit` — визуальные primitives
* `design-tokens` — theme
* `forms` — field widgets / form controls
* `tenant-core` — tenant context, current user, feature flags, scope
* `app-shell` — layout shell
* `api-client` — builder API endpoints
* `auth-core` — roles/permissions integration
* `i18n` — labels

---

## Чего не делать сразу

Не создавать с первого дня 8–10 новых пакетов типа:

* navigation-core
* workflow-core
* policy-core
* registry-core
* designer-core
* runtime-core

Это красиво на бумаге, но на старте только замедлит.

---

## Практичный путь

### Шаг 1

* `packages/platform-builder-core`
* UI внутри `tenant-web`

### Шаг 2

Когда контракты стабилизируются, вынести:

* `packages/platform-builder-runtime`
* `packages/platform-builder-designer`

---

# 12. Роль `platform-admin-web`

Там Builder не живет.

## Но там могут быть:

* enable/disable feature flags for tenant
* tenant plan restrictions
* package/template assignment
* rollout of base templates
* monitoring published versions
* maybe support/debug tools

То есть admin app управляет **доступностью capability**,
но не строит tenant UI.

---

# 13. Что делать с isolated DB и sandbox mode

Это важно: Builder не должен знать, где физически живут данные.

## Правильный подход

Метамодель должна быть **deployment-neutral**.

То есть:

* один и тот же builder contract
* один и тот же publish manifest
* один и тот же runtime contract

А дальше уже storage layer решает:

* isolated DB
* shared sandbox
* pooled tenant storage

### Значит в архитектуре нужен `StorageAdapter`

Он отвечает за:

* provision storage
* migrations
* entity table creation / update
* child table creation
* publish-time sync

Builder рисует модель.
Storage adapter применяет ее к конкретному tenancy mode.

---

# 14. Как бы я назвал права на сам Builder

Это пригодится, когда вы “разделите кто может видеть какие части Builder”.

Минимальный набор capability:

* `builder.read`
* `builder.models.manage`
* `builder.views.manage`
* `builder.navigation.manage`
* `builder.access.manage`
* `builder.workflows.manage`
* `builder.publish`

Тогда можно дать:

* архитектору — все
* UI admin — только views + navigation
* security admin — access
* process admin — workflows
* publisher — publish

---

# 15. Какие builder-компоненты надо сделать как reusable primitives

Это уже мост между design и implementation.

Минимальный builder UI kit:

* `ObjectTree`
* `PropertyInspector`
* `CanvasFrame`
* `PalettePanel`
* `SlotEditor`
* `FieldTableEditor`
* `RelationEditor`
* `MatrixEditor`
* `RuleBuilder`
* `TargetPicker`
* `StatusGraph`
* `ActionBindingPanel`
* `ValidationPanel`
* `PublishDiffPanel`
* `RuntimePreviewPane`

Это уже не просто “страницы”, а реальные reusable building blocks для builder UX.

---

# 16. План для AI agent

Ниже — хороший практический план, если агент будет реально строить это в репозитории.

---

## Базовый бриф для AI agent

### Контекст

* Platform Builder создается **только для `tenant-web`**
* `platform-admin-web` не является местом для builder UI
* Builder работает поверх metadata registries
* Runtime tenant app читает только published metadata
* Sidebar builder должен уметь подключать как builder views, так и system modules
* Использовать существующие `ui-kit`, `design-tokens`, `forms`, `tenant-core`, `auth-core`, `app-shell`, `api-client`

### Ограничения

* не строить freeform pixel editor
* не смешивать auth/billing/tenant onboarding с Builder
* не реализовывать system modules внутри builder metadata
* не использовать raw SQL как primary DSL
* не делать publish напрямую без validation и snapshot

---

## Порядок работ для агента

### Этап 0. Repo discovery

Собрать карту:

* что уже есть в `tenant-web`
* что уже есть в `forms`
* что уже есть в `ui-kit`
* как устроен routing
* как устроены permissions
* где живет current tenant context

### Этап 1. Core contracts

Создать `packages/platform-builder-core`:

* registry types
* validation schemas
* manifest types
* editor models
* target types
* workflow/action binding types

### Этап 2. Builder shell

В `tenant-web` создать:

* `/builder`
* `/builder/models`
* `/builder/views`
* `/builder/navigation`
* `/builder/access`
* `/builder/workflows`
* `/builder/publish`

### Этап 3. Runtime resolver

Сделать слой, который может:

* читать published manifest
* строить sidebar
* резолвить route -> target
* отрисовывать view по metadata

Без этого View Builder будет нечего preview’ить.

### Этап 4. Entity Model Designer

Сделать:

* entity list
* field table
* relation editor
* semantic role editor
* save draft

### Этап 5. View Builder

Сделать:

* base templates
* slot-based layout editor
* palette
* canvas
* inspector
* preview

### Этап 6. Navigation / Sidebar Builder

Сделать:

* tree editor
* target picker
* order
* icon
* permissions binding
* channel flags

### Этап 7. Access Builder

Сделать:

* role matrix
* field access editor
* action access editor
* record filter DSL builder

### Этап 8. Workflow Builder

Сделать:

* status editor
* transition editor
* button editor
* action binding editor

### Этап 9. Publish Center

Сделать:

* validation
* draft diff
* publish
* snapshot history
* rollback

### Этап 10. Seed scenario

Поднять на примере:

* `sor`
* `sor_item`
* `corrective_action`

И прогнать:

* entity
* form
* list
* checklist
* sidebar
* access
* workflow

---

# 17. Самый правильный старт не с полного Builder, а с одного вертикального сценария

Чтобы не строить абстрактную платформу в пустоту, V1 лучше поднимать через один pilot.

## Лучший pilot

**SOR + Checklist + Corrective Action**

Потому что он покрывает:

* root entity
* child collection
* checklist renderer
* actions
* workflow
* list/detail/form
* sidebar targets
* access
* related module

---

# 18. Что я бы зафиксировал прямо сейчас как окончательное решение

## Архитектурно

* Builder живет в `tenant-web`
* `platform-admin-web` не содержит builder UI
* sidebar builder — это Navigation Builder с target catalog
* target может быть `view` или `system-module`

## По продукту

* 5 pillars V1 остаются
* но 3-й pillar переименовать в `Navigation / Sidebar Builder`
* добавить draft/publish/validation как обязательный horizontal layer

## По реализации

* start with `platform-builder-core`
* UI initially inside `tenant-web`
* reuse existing shared packages
* runtime preview обязателен с самого начала
* storage topology abstraction через adapter

---

# 19. Самая короткая формула всей системы

## Tenant runtime

читает **Published Manifest**

## Platform Builder

редактирует **Draft Metadata**

## Publish service

превращает **Draft Metadata** в **Published Manifest**

## Sidebar Builder

собирает navigation из:

* generated views
* system modules
* external targets

---

Следующим шагом лучше всего зафиксировать **glossary + registry contracts V1** на одной странице и только после этого рисовать экраны Builder.
