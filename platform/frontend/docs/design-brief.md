Design Brief

New Multi-tenant eSafety Platform

1. Контекст проекта

Разрабатывается новая мультитенантная платформа eSafety с двумя основными приложениями:
	•	Admin App — для управления платформой, тенантами, ролями, модулями, доступами, конфигурацией, аудитом, billing и системными настройками.
	•	Tenant App — для конечных tenant-команд: incidents, audits, corrective actions, reports, training, requests, documents и рабочих сценариев пользователей.

Текущие интерфейсы содержат полезную доменную структуру, но визуально и UX‑уровнем не соответствуют ожиданиям от современной enterprise SaaS-платформы.

2. Цель дизайна

Создать топовый интерфейс и стилистику продукта, который будет восприниматься как:
	•	современная enterprise SaaS-платформа;
	•	визуально премиальный, но не декоративный;
	•	надежный, понятный, масштабируемый;
	•	удобный для сложных данных, ролей и процессов;
	•	одинаково сильный в light/dark theme;
	•	пригодный для desktop-first workflows и адаптивных сценариев.

3. Продуктовое позиционирование через дизайн

Новая платформа должна ощущаться не как «набор модулей», а как единая операционная среда управления рисками, безопасностью и compliance.

Ключевое ощущение от интерфейса:
calm, trusted, exact, operational, proactive.

Необходимый эффект:
пользователь должен чувствовать, что платформа помогает предотвращать риски, а не просто регистрировать события постфактум.

⸻

4. Основная дизайн-концепция

Концепт: Operational Clarity

Дизайн строится вокруг идеи:
	•	меньше визуального шума;
	•	сильнее иерархия;
	•	важное ближе к пользователю;
	•	действия важнее декоративности;
	•	данные читаются быстро;
	•	интерфейс выглядит «дорого» через дисциплину, а не через эффекты.

То есть это не glassmorphism и не “template dashboard”, а calm enterprise premium UI.

⸻

5. Архитектурная модель интерфейса

5.1 Общая платформа

Нужно проектировать не два разрозненных приложения, а единый platform shell:
	•	общий визуальный язык;
	•	общая логика навигации;
	•	единые компоненты;
	•	единые паттерны состояний, фильтров, таблиц, форм, drawer/modal;
	•	единая дизайн-система с режимами для admin и tenant.

Для multi-product среды это наиболее правильный подход: Atlassian прямо описывает ценность единой навигации между продуктами, а Vercel развивает dashboard как единый control surface с глобальным поиском и доступом к ключевым сущностям с любой страницы.  ￼

5.2 Два operating mode

Admin App = Control Plane
	•	выше density;
	•	больше таблиц, списков, матриц доступов, системных настроек;
	•	акцент на контроль, обзор, конфигурацию и аудит.

Tenant App = Guided Workspace
	•	меньше когнитивной нагрузки;
	•	больше task-oriented экранов;
	•	понятные quick actions, очереди, рекомендации, onboarding;
	•	сильнее сценарии “submit / review / resolve / report”.

⸻

6. Пользователи

Нужно проектировать под несколько ролей:
	•	Platform Admin
	•	Tenant Admin
	•	Safety / Compliance Manager
	•	Supervisor / Operations Manager
	•	Field / Frontline User
	•	Auditor / Analyst
	•	Executive Viewer

Это означает, что интерфейс должен поддерживать разную плотность, разный уровень сложности и разные стартовые страницы в зависимости от роли.

⸻

7. UX-принципы
	1.	One platform, one logic
Admin и Tenant должны ощущаться родственными продуктами.
	2.	Action first
Главный экран — это не баннер и не каталог модулей, а рабочая точка входа.
	3.	Calm density
Интерфейс может быть плотным, но не должен давить. Linear прямо формулирует это как сохранение высокой информационной плотности без ощущения перегруза.  ￼
	4.	Hierarchy over color noise
Цвет должен усиливать смысл, а не заменять структуру.
	5.	Progressive disclosure
Сложность раскрывается по мере движения пользователя, а не вываливается сразу.
	6.	State clarity
Loading, empty, error, success, locked, archived, overdue, warning — все состояния должны быть четко спроектированы.
	7.	Keyboard and enterprise speed
Быстрые действия, сохраненные фильтры, bulk actions, command/search.

⸻

8. Визуальное направление

8.1 Что нужно сохранить из текущего бренда
	•	базовую ассоциацию с blue trust / safety / reliability;
	•	ощущение корпоративной надежности;
	•	связь с существующим брендом eSafety.

8.2 Что нужно убрать
	•	heavy gradients как основной прием;
	•	пеструю «раскраску модулей» в левом меню;
	•	промо-баннерность внутри рабочего интерфейса;
	•	визуально устаревшие формы, тени и иконографику;
	•	“ERP-like” ощущение старой системы.

8.3 Новая визуальная ДНК
	•	темно-синий / графитовый каркас;
	•	светлые, чистые поверхности;
	•	один сильный бренд-акцент;
	•	минимум декоративных эффектов;
	•	акцент на сетке, отступах, типографике, ритме и состояниях.

⸻

9. Цветовая система

9.1 Принцип

Цвета должны быть собраны через semantic tokens, а не раздаваться вручную по экранам. Material 3 трактует color roles и design tokens как основу UI-системы, а Figma variables/modes позволяют держать light/dark и другие режимы без дублирования макетов.  ￼

9.2 Рекомендованная цветовая стратегия

Core brand
	•	Brand / Primary: насыщенный cobalt-blue
	•	Brand / Deep: midnight/navy
	•	Accent support: холодный teal

Semantic
	•	Success: green
	•	Warning: amber
	•	Danger: red
	•	Info: blue
	•	Neutral: slate/gray scale

9.3 Предварительная палитра

Это стартовое направление, не финальный брендбук:
	•	Brand 900 — #0E224D
	•	Brand 700 — #1F4EA3
	•	Brand 600 — #2F6BDE
	•	Brand 500 — #4B84F3
	•	Neutral 0 — #FFFFFF
	•	Neutral 25 — #F8FAFC
	•	Neutral 50 — #F1F5F9
	•	Neutral 100 — #E2E8F0
	•	Neutral 300 — #CBD5E1
	•	Neutral 500 — #64748B
	•	Neutral 700 — #334155
	•	Neutral 900 — #0F172A
	•	Success — #16A34A
	•	Warning — #D97706
	•	Danger — #DC2626
	•	Info — #0284C7
	•	Accent Teal — #0F9D8A

9.4 Критически важно
	•	модули не должны различаться радугой цветов;
	•	цвет применяется по семантике, а не по названию раздела;
	•	navigation должна жить в основном в нейтралях;
	•	модульные различия можно обозначать иконкой, badge или subtle tint, но не превращать sidebar в «каталог разноцветных ссылок».

9.5 Контраст

Для small text нужен минимум 4.5:1, для large text и графических элементов — 3:1; это особенно важно для таблиц, heatmap, charts и dark theme.  ￼

⸻

10. Типографика

Рекомендую современную нейтральную grotesk-систему:
	•	Primary UI font: Inter / SF Pro / system stack
	•	Заголовки: 600–700
	•	Body: 400–500
	•	KPI / numeric tables: tabular numerals
	•	Размеры:
	•	12 — captions/meta
	•	14 — default UI text
	•	16 — key body/action
	•	20/24 — section titles
	•	32+ — hero/KPI only where justified

Принцип:
	•	типографика должна делать 50% работы по иерархии;
	•	не компенсировать слабую структуру цветом и рамками.

⸻

11. Layout и grid

Для такой платформы нужны два layout-режима:

11.1 High-density mode

Для admin app, таблиц, аналитики, реестров, permissions, audit logs.
Carbon прямо рекомендует full-width high-density model для сложных продуктовых интерфейсов и data-heavy dashboards.  ￼

11.2 Focused workspace mode

Для tenant app, карточек задач, form flows, wizard-экранов, мобильных сценариев.

11.3 Базовые правила
	•	8pt spacing system
	•	container widths по типам экранов
	•	sticky page header на data-heavy screens
	•	левый sidebar: collapsed / expanded state
	•	правый detail drawer для быстрых просмотров без лишней навигации

⸻

12. Навигация

12.1 Platform shell

Обязательные элементы общей оболочки:
	•	app switcher
	•	tenant switcher
	•	global search / command palette
	•	notifications
	•	help/support
	•	profile
	•	quick create

Хороший global header должен давать доступ и к локальной навигации продукта, и к системным функциям вроде settings, notifications и переключения между продуктами.  ￼

12.2 Информационная архитектура

Admin App
	•	Overview
	•	Tenants
	•	Users & Roles
	•	Modules
	•	Templates
	•	Integrations
	•	Billing / Plans
	•	Audit Log
	•	Security
	•	System Settings
	•	Support / Activity

Tenant App
	•	Home
	•	My Tasks / Inbox
	•	Incidents
	•	Good Catch
	•	Audits / Inspections
	•	Corrective Actions
	•	Reports
	•	Training
	•	Documents
	•	Settings

12.3 Правила навигации
	•	максимум 3 уровня вложенности;
	•	предпочтительно использовать section group + secondary nav;
	•	starred / recent / pinned элементы;
	•	поиск должен находить страницы, объекты, tenant-ы, users, reports, documents;
	•	для power users нужен command-first подход.
Vercel уже встроил universal search в dashboard на каждой странице, а Atlassian строит новую навигацию вокруг cross-product consistency, starred/recent и кастомизации.  ￼

⸻

13. Концепция главных экранов

13.1 Admin dashboard

Главный экран admin app не должен быть «приветственным». Это должен быть операционный cockpit:
	•	System health
	•	Active tenants
	•	Alerts / risks
	•	Pending approvals
	•	Recent configuration changes
	•	Failed sync/integration events
	•	Usage / billing overview
	•	Audit anomalies

13.2 Tenant dashboard

Главный экран tenant app должен отвечать на вопрос:
“Что мне нужно сделать сейчас?”

Блоки:
	•	urgent items
	•	overdue actions
	•	unresolved incidents
	•	recent submissions
	•	KPI snapshot
	•	team activity
	•	shortcuts to top workflows

13.3 Что нельзя делать
	•	large hero/banner above the fold как основной элемент рабочего dashboard;
	•	набор модулей без приоритета;
	•	charts ради charts.

Для dashboards важнее big-picture hierarchy и ясная последовательность чтения; Carbon рекомендует strong hierarchy и ориентир на F-pattern.  ￼

⸻

14. Таблицы, списки, аналитика

Это будет ядро продукта, поэтому их нужно проектировать как premium B2B data surfaces.

Обязательные паттерны:
	•	saved views
	•	filter bar
	•	sort / group
	•	column visibility
	•	sticky header
	•	bulk actions
	•	status chips
	•	row actions
	•	side-panel preview
	•	export
	•	audit-friendly history

GitHub Projects хорош как референс именно по логике views: multiple views, filtering, sorting, grouping, charts, custom fields.  ￼

Charts
	•	один график = одна история;
	•	минимум декоративных background areas;
	•	понятные thresholds;
	•	consistent legends;
	•	red/green не должны быть единственным носителем смысла;
	•	tooltips, hover, compare period, drill-down;
	•	summary + delta + trend рядом с chart, а не в отрыве.

⸻

15. Формы и ввод данных

Поскольку у вас safety/compliance домен, формы будут критически важны.

Нужно:
	•	wizard для длинных сценариев;
	•	autosave;
	•	clear validation;
	•	inline help;
	•	templates/prefill;
	•	attachments/media;
	•	mobile-friendly large hit areas;
	•	audit trail изменений;
	•	permission-aware fields.

Принцип:
пользователь не должен бояться формы и не должен теряться в 20 полях на одном экране.

⸻

16. Состояния интерфейса

Обязательно спроектировать как полноценную часть системы:
	•	loading
	•	skeleton
	•	empty state
	•	no search results
	•	permission denied
	•	integration unavailable
	•	archived
	•	draft
	•	success
	•	warning
	•	destructive confirm

Carbon рекомендует skeleton/loading как способ снизить неопределенность пользователя, а empty states — как способ не просто показать отсутствие данных, а направить к следующему действию.  ￼

⸻

17. Light / Dark theme

Темная тема должна быть не “перекрашенной”, а первоклассным режимом.

Правила:
	•	та же token architecture;
	•	отдельные surface levels;
	•	отдельные chart palettes;
	•	такие же контрасты и focus states;
	•	никакой «грязной» серо-синей каши;
	•	dark mode не должен терять читаемость таблиц, форм и статусов.

Figma variables и modes здесь особенно важны, потому что позволяют вести light/dark как режимы одной системы, а не как два параллельных дизайна.  ￼

⸻

18. Компонентная система

Нужно закладывать основу design system сразу:
	•	buttons
	•	inputs
	•	select / combobox
	•	checkbox / radio / switch
	•	tabs
	•	nav items
	•	cards
	•	table
	•	drawer
	•	modal
	•	toast
	•	badge / status
	•	empty state
	•	chart wrappers
	•	filters
	•	date range picker
	•	audit timeline
	•	stepper
	•	file upload
	•	command palette

В коде стоит опираться на accessible primitives. Radix позиционирует свои primitives как низкоуровневую основу для высококачественных и доступных дизайн-систем, с фокусом на accessibility, customization и DX.  ￼

⸻

19. Accessibility

Это must-have, а не nice-to-have.

Нужно обеспечить:
	•	keyboard navigation;
	•	visible focus;
	•	semantic headings;
	•	screen reader labels;
	•	достаточный contrast;
	•	доступные charts/tables;
	•	понятные destructive actions;
	•	не полагаться только на цвет в статусах.

Radix отдельно подчеркивает keyboard expectations у сложных компонентов вроде Tabs и Dialog, а enterprise-системы без этого быстро деградируют в usability.  ￼

⸻

20. AI-слой

Если в новой платформе появятся AI-summary, AI-classification, AI-suggestions, AI-assisted report generation, их нужно проектировать как отдельный слой интерфейса, а не как «магические поля».

Рекомендации:
	•	отмечать AI-generated content явно;
	•	давать краткое объяснение “откуда рекомендация”;
	•	позволять revert/edit вручную;
	•	визуально отличать AI-presence от обычных полей.

IBM Carbon for AI рекомендует использовать AI label как путь к explainability и не превращать AI-маркировку в декоративный элемент.  ￼

⸻

21. Motion / microinteractions

Стиль анимации:
	•	быстрый;
	•	тихий;
	•	функциональный.

Нужно:
	•	hover/focus/pressed;
	•	drawer slide;
	•	table selection;
	•	optimistic feedback;
	•	loading skeleton;
	•	toast feedback.

Не нужно:
	•	тяжелых трансформаций;
	•	показательной «вау-анимации»;
	•	motion ради модности.

⸻

22. Адаптивность

Admin App

Desktop-first:
	•	1440+ приоритет;
	•	поддержка 1280;
	•	collapse sidebar;
	•	перенос secondary controls в overflow.

Tenant App

Responsive-first:
	•	desktop + tablet;
	•	mobile-сценарии для submit/report/approve/view task;
	•	упрощенная навигация;
	•	bottom-sheet / full-screen sheet для формы и quick actions.

⸻

23. Что должно получиться на выходе

Дизайн-команда должна произвести:
	1.	Design vision / moodboard
	2.	Information architecture
	3.	Token system
	4.	Color system light/dark
	5.	Component library
	6.	Shell templates for Admin and Tenant
	7.	8–12 ключевых экранов в high fidelity
	8.	Responsive rules
	9.	Chart and table guidelines
	10.	Handoff documentation

⸻

Примеры топовых дизайнов для вашей задачи

Ниже не «что копировать один в один», а что брать как референс по типу задачи.

1. Linear

Брать как референс для:
	•	calm dense interface;
	•	премиальной минималистичной визуальной дисциплины;
	•	сильной типографики;
	•	тихой навигации, которая не конкурирует с рабочей областью;
	•	очень хорошей визуальной иерархии в data-heavy продукте.
Linear в последнем refresh прямо описывает принцип: интерфейс должен сохранять богатую плотность данных, но не ощущаться overwhelming, а элементы навигации должны визуально отступать назад, когда пользователь уже в рабочем контексте.  ￼

2. Atlassian (Jira / Atlassian Navigation)

Брать как референс для:
	•	multi-product navigation;
	•	общей оболочки для нескольких приложений;
	•	баланса между единой системой и локальной спецификой продукта;
	•	starred / recent / customizable nav.
Atlassian открыто пишет, что одинаковая навигация для всех продуктов оказалась неудачной, и новая система строится на балансе consistency и flexibility. Это очень релевантно для вашей пары admin app + tenant app.  ￼

3. Vercel Dashboard

Брать как референс для:
	•	control plane эстетики;
	•	глобального поиска;
	•	быстрой ориентации в сложной системе;
	•	clean technical UI без визуального мусора.
У Vercel universal search доступен в dashboard с любой страницы и находит teams, projects, deployments, pages и settings — это хороший ориентир для tenant search / entity search / global command surface.  ￼

4. Stripe Dashboard

Брать как референс для:
	•	billing/settings/admin flows;
	•	доверительного enterprise-UI;
	•	аккуратной работы с формами, сущностями, invoice/payment flows;
	•	“serious but modern” aesthetics.
Stripe Billing показывает зрелую админскую логику: создание, кастомизация и управление invoicing прямо из dashboard.  ￼

5. GitHub Projects / Issues

Брать как референс для:
	•	списков, реестров, фильтров, saved views;
	•	custom fields;
	•	views as workflow;
	•	table/board/roadmap switching.
GitHub Projects поддерживает multiple customizable views с filtering, sorting, grouping, charts и custom fields — это сильный паттерн для incidents, audits, corrective actions, approvals и queues.  ￼

6. IBM Carbon

Брать как референс не по «красоте бренда», а по:
	•	enterprise data visualization;
	•	global header patterns;
	•	high-density grids;
	•	loading/empty/error states;
	•	AI presence/explainability.
Carbon полезен именно как системная база для сложных B2B-продуктов с аналитикой и административными интерфейсами.  ￼

⸻

Мой итоговый вектор для вашего продукта

Для eSafety я бы выбрал направление:

“Premium Operational Safety Platform”

То есть:
	•	не legacy ERP
	•	не generic admin template
	•	не flashy startup UI
	•	а спокойный, точный, дорогой enterprise-интерфейс, где:
	•	admin app = control plane,
	•	tenant app = guided workspace,
	•	обе части объединены одной дизайн-системой,
	•	бренд строится на trust + clarity + prevention.

Самое важное решение здесь — не тащить старую визуальную логику в новую платформу. Нужно использовать smart app как шаг в правильную сторону, но поднять его на уровень полноценной platform design language.

Дальше разумно сразу разложить этот brief в sitemap + список ключевых экранов для Admin App и Tenant App.