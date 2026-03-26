Да. По сути вам уже нужен не просто **Form Builder**, а **metadata-driven Platform Builder**, где Form Builder — только одна часть.

По скринам старого интерфейса это видно очень хорошо: у вас уже есть `Data Forms`, `Modules`, `Pages`, `PWA`, разные типы форм, разные страницы для одной и той же формы, настройки доступа, фильтры, web share, action-логика. То есть система уже давно вышла за рамки “сделать форму из полей”.

## Что старый интерфейс показывает очень ясно

В legacy уже есть правильные зачатки, но они смешаны в одном месте.

1. **Data Form** сейчас хранит слишком много всего сразу.
   В редакторе формы у вас вперемешку:

   * структура данных,
   * вид поля,
   * источник данных,
   * layout-элементы (`TITLE`, `TABS`, `HTML`, `SUBFORM`),
   * связи (`DB LOOKUP`, `DB FIELD`),
   * вычисления (`SQL Field`),
   * бизнес-тип (`FormType: SOR / CHECKLIST / CA`).

2. **Одна и та же форма уже имеет несколько UI-представлений.**
   На скринах видно, что один и тот же источник данных используется в разных страницах: `SOR`, `SOR by photo`, `SOR list`, `SOR Inspection` и так далее.
   Это прямое доказательство, что правильная модель — **одна data schema → много UI schemas**.

3. **Page Editor сейчас смешивает несколько слоев.**
   В одной странице у вас одновременно:

   * module binding,
   * web/PWA flags,
   * actions,
   * attachments,
   * фильтры,
   * сортировка грида,
   * field settings,
   * статусные настройки,
   * доступ.

4. **Module и Page по смыслу уже разные сущности, но архитектурно они не разделены до конца.**

Именно поэтому новый Builder нужно строить не вокруг “страницы” и не вокруг “типа формы”, а вокруг **сущности и представлений**.

---

# Главный архитектурный вывод

Правильная цель для Ramp v108:

## **Entity-driven Platform Builder**

где есть отдельные слои:

### 1. Data Schema

Что хранится в данных:

* сущности,
* поля,
* типы,
* связи,
* child collections,
* repeatable sections,
* semantic roles.

### 2. Dataset / Read Model

Как эти данные читаются:

* grid/list datasets,
* search datasets,
* report datasets,
* SQL views / materialized views / query definitions.

### 3. UI Schema

Как данные отображаются:

* form,
* detail,
* list/grid,
* checklist,
* modal,
* drawer,
* card view,
* mobile view,
* public/web view,
* PWA view.

### 4. Module / App Layer

Как это собрано в функциональный блок:

* SOR,
* Corrective Actions,
* Documents,
* Companies,
* Contacts,
* Inspections.

### 5. Navigation Layer

Где это живет в продукте:

* app,
* section,
* menu group,
* page entry,
* route.

### 6. Access / Policy Layer

Кто и что может:

* read,
* create,
* edit,
* delete,
* approve,
* export,
* run action,
* field-level access,
* record-level filters.

### 7. Workflow / Actions Layer

Что происходит при событиях:

* submit,
* approve,
* reopen,
* create corrective action,
* send notification,
* assign task,
* sync externally.

---

## В одной схеме это выглядит так

```text
Entity Schema + Relations
        ↓
   Datasets / Read Models
        ↓
   UI Schemas (many per entity) ← Widget Registry
        ↓
      Modules
        ↓
   Navigation Tree / Routes

Policies bind to:
- Entity
- View
- Action
- Navigation Node
- Field
- Record Scope

Workflow / Actions bind to:
- Entity events
- Status transitions
- Manual UI actions
```

---

# Самое важное изменение внутри нового Builder

Сейчас у вас в legacy понятие **Field Type** перегружено.

В новой системе его нужно разложить на отдельные оси.

## Вместо одного “Field Type” должны быть минимум 4 понятия

### A. Data Type

Что это по хранению:

* string
* text
* number
* money
* boolean
* date
* datetime
* enum
* relation
* file
* richtext
* json
* computed

### B. Source Type

Откуда берутся данные:

* static options
* dictionary/list
* entity lookup
* external dataset
* formula
* SQL/query
* system field

### C. Renderer / Widget

Как это рисуется:

* input
* textarea
* dropdown
* multi-select
* chips
* radio
* checkbox
* lookup picker
* child table
* checklist
* date picker
* photo uploader
* signature
* rich text editor
* status bar

### D. Layout / Content Component

Это вообще не поле, а часть интерфейса:

* title
* text block
* html block
* section
* tabs
* accordion
* columns
* divider
* spacer

---

## На ваших примерах это будет так

* `DB FIELD (Contact)` — это **relation field**, а не отдельный тип поля.
* `DB LOOKUP (ext. Form)` — это **lookup source**, а не тип хранения.
* `SQL Field` — это **computed field** или **dataset column**, а не field type.
* `TITLE`, `HTML`, `TABS`, `SUBFORM` — это **UI components**, а не data fields.

Это критично.
Именно здесь старые builders обычно начинают ломаться.

---

# Как интегрировать то, что ты перечислил

## 1. Списки схем data + UI (множество)

Здесь нужна не одна сущность, а два реестра.

### Реестр Data Schema

Содержит:

* entities,
* fields,
* relations,
* child entities,
* semantic roles,
* status model.

### Реестр UI Schema

Содержит:

* views,
* channel,
* layout,
* widgets,
* visibility rules,
* presets,
* variants.

### Главное правило

**Одна entity schema может иметь много UI schemas.**

Например, для `SOR`:

* `sor.form.edit`
* `sor.list.default`
* `sor.list.by_photo`
* `sor.checklist.web`
* `sor.checklist.mobile`
* `sor.public.share`
* `sor.ca.modal`

---

## 2. Создание нового UI путем копирования

Просто “копировать UI” недостаточно. Это быстро приводит к хаосу и drift.

Нужны **2 режима**:

### Fork

Полная копия.
Подходит для радикально другого экрана.

### Derived Variant

Наследуемый UI-вариант.
Он хранит:

* ссылку на базовый view,
* собственные override,
* diff,
* возможность rebase после изменения базового view.

### Что рекомендую

Для большинства случаев использовать именно **derived views**, а не глухие копии.

Иначе через полгода будет:

* 20 похожих экранов,
* у всех разная логика,
* никто не понимает, какой “главный”.

---

## 3. Меню сайта или модули сайта

Правильный ответ: **и то, и другое**, но это не одно и то же.

### Module

Функциональный пакет:

* SOR,
* Corrective Actions,
* Documents,
* Companies.

Module знает:

* какие сущности он использует,
* какие view являются default,
* какие actions доступны,
* какие роли типичны.

### Navigation Tree

Это только размещение в интерфейсе:

* где пункт меню,
* под каким разделом,
* с какой иконкой,
* в каком порядке,
* в каком канале,
* виден ли он роли.

### Ключевое правило

**Меню должно ссылаться на view или module entrypoint, но не на data form напрямую.**

---

## 4. Дерево, к которому подключать UI и там же выставлять привилегии доступа

Здесь важно не смешать два разных дерева.

### Дерево №1: Navigation Tree

Нужно для:

* сайта,
* меню,
* route map,
* порядка,
* группировки экранов.

### Дерево №2: Business Scope Tree

Нужно для:

* company / project / location / department,
* data scope,
* record visibility,
* assignment scope.

Их лучше **не объединять в одно универсальное дерево**.

---

## Как должны работать права

Доступ не должен жить только в menu tree.

### Правильнее так:

* navigation tree отвечает за **видимость входа в экран**;
* policy engine отвечает за **CRUD/action/data access**;
* workflow отвечает за **что можно в текущем статусе**.

### Эффективный доступ

Фактически считается как пересечение:

**role policy × business scope × workflow state × node visibility**

Это намного чище, чем “права сидят в странице”.

---

# Что должно быть системным, а что builder-driven

Чтобы Platform Builder не превратился в “магический конструктор всего”, нужно сразу провести границу.

## Системные, кодовые части платформы

Я бы не отдавал полностью в builder:

* auth / users / sessions,
* roles / permission engine,
* audit log,
* files / attachments storage,
* notification delivery,
* task engine,
* scheduler,
* business tree engine,
* messaging / realtime,
* integration bus.

## Builder-driven части

Вот это как раз отлично ложится в builder:

* business entities,
* forms,
* lists,
* detail views,
* checklists,
* child collections,
* filters,
* module bindings,
* navigation,
* workflows,
* action bindings,
* field/view policies,
* import/export profiles.

---

# Правила хранения данных

Здесь я бы держался очень жесткой дисциплины.

## Основное правило

* **entity = table**
* **repeatable child block = child table**
* **relation = foreign key**
* **many-to-many = link table**
* **datasets / reports = SQL views или query definitions**
* **JSON = только для meta/config/extensibility, но не как основное хранение бизнес-формы**

---

## Для форм разного уровня

Не мыслить “уровень 1 / уровень 2 / уровень 3”.

Мыслить так:

* root entity,
* child entity,
* related entity,
* UI renderer.

### Пример из ваших экранов

Не:

* SOR уровень 1
* Checklist уровень 2
* Corrective Action уровень 3

А:

* `sor`
* `sor_item`
* `corrective_action`

И дальше UI может показать это как:

* inline child table,
* checklist,
* modal editor,
* separate page,
* drawer,
* quick action from row.

---

## Очень практичное ограничение

В UI не стоит делать бесконечную вложенность редактирования.

Хорошее правило:

* inline editing до 1 child-уровня,
* deeper relations — через modal, drawer или отдельный screen.

Иначе builder станет неудобным и для пользователя, и для разработчика.

---

# Что нужно добавить поверх legacy-подхода

## 1. Semantic Roles

Судя по экрану Page Editor, вам уже нужны особые поля:

* status field,
* date field,
* by/owner field.

Я бы вынес это в явный слой entity metadata:

* primary title field
* primary date field
* status field
* owner/assignee field
* location field
* photo field
* tree parent field

Это сильно упростит:

* генерацию default lists,
* фильтры,
* workflow,
* search,
* dashboards.

---

## 2. Widget Registry

Виджеты должны быть реестром, а не hardcoded enum внутри одного select.

Каждый widget должен знать:

* какие типы данных поддерживает,
* какие свойства настраиваются,
* какие события дает,
* в каких view mode работает,
* можно ли его использовать в mobile / web / public / PWA.

---

## 3. Action Registry

UI не должен знать бизнес-логику.

Нужно разделить:

* **action handler** — кодовый backend handler,
* **action binding** — где и когда он доступен,
* **UI trigger** — как пользователь его запускает.

Например:

* handler: `create_corrective_action`
* binding: entity `sor_item`, trigger `manual` + `on_submit`
* UI trigger: кнопка в checklist row

---

## 4. Versioning / Publish / Rollback

Старый подход “Submit и сразу live” опасен.

Нужны:

* draft version,
* published version,
* compare diff,
* rollback,
* preview,
* validation before publish.

---

## 5. Packages / Import / Export

У вас это уже намечено через `Import Config`, `Import Module`, `CSV Template`, `Export Config`.

В новой системе это нужно поднять на уровень **solution package**:

Пакет должен включать:

* entity schemas,
* views,
* modules,
* navigation,
* policies,
* workflows,
* action bindings,
* import/export profiles,
* assets/icons/widgets config.

Это важно и для dev/stage/prod, и для миграций, и для tenant rollout.

---

# Что я бы рекомендовал как минимальный V1

Не пытаться сразу сделать “конструктор всего”.

## V1 стоит собрать вокруг 5 базовых возможностей

### 1. Entity Model Designer

* entity
* fields
* relations
* child collections
* semantic roles

### 2. View Builder

* form
* list/grid
* detail
* checklist
* modal/drawer

### 3. Module + Navigation Builder

* app/section/module
* menu tree
* routes
* channel flags

### 4. Access Builder

* role matrix
* field visibility / readonly
* action permissions
* record filters через DSL

### 5. Workflow + Action Binding

* statuses
* transitions
* buttons
* on submit / on approve actions

---

## А что вынести в V2

* custom widget SDK
* public portal/web share builder
* PWA-specific behaviors
* advanced report builder
* formula engine
* no-code automations beyond basic events
* page templates marketplace

---

# На чем пилотировать

Лучший пилот по вашим скринам — **SOR + Corrective Actions**.

Потому что в нем уже есть почти все сложные паттерны:

* основная форма,
* child items / checklist,
* разные list views,
* related corrective actions,
* status,
* role-based access,
* filters,
* attachments,
* web/mobile variation.

---

## Как это выглядело бы в новой модели

### Entity Layer

* `sor`
* `sor_item`
* `corrective_action`

### Views

* `sor.form.edit`
* `sor.list.default`
* `sor.list.by_photo`
* `sor.checklist.web`
* `sor.checklist.mobile`
* `corrective_action.modal.create`

### Module

* `ops.sor`

### Navigation

* Operations / SOR / List
* Operations / SOR / By Photo
* Operations / Corrective Actions

### Policies

* inspector
* manager
* admin

### Actions

* create corrective action
* close item
* reopen
* notify
* export

---

# Что точно не делать

1. Не делать `page = schema = storage`.
2. Не хранить всё в одном giant JSON blob.
3. Не держать security только в menu tree.
4. Не смешивать field type, widget, source и layout в одном select.
5. Не разрешать бесконечное копирование UI без lineage.
6. Не встраивать бизнес-логику прямо в view JSON.
7. Не строить фильтры только raw SQL-строками; нужен нормальный filter DSL, а SQL — только expert mode.
8. Не делать PWA как отдельный параллельный мир; это должен быть channel/view variant.

---

# Итог

Если собрать всё в одну формулу, то правильная цель такая:

## **Platform Builder = Data Schema + UI Schemas + Modules + Navigation + Access + Workflow + Actions + Packages**

А Form Builder внутри этой модели — это только **редактор конкретного UI view**.

То есть строить нужно не “новый экран для форм”, а **управляемую платформу для сущностей и представлений**, где:

* данные живут в нормальной relational model,
* одна сущность может иметь много UI,
* новый UI создается через fork или derived variant,
* module и navigation разделены,
* access считается через policy engine,
* workflow и actions подключаются отдельно,
* виджеты являются библиотекой компонентов,
* packages позволяют мигрировать и публиковать конфигурации безопасно.

Следующим практическим шагом стоит зафиксировать **метамодель платформы**: список registry-объектов, их связи и минимальный V1 scope.
