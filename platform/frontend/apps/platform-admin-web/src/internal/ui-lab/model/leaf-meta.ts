export type UiLabPanelId =
  | "overview"
  | "form-controls"
  | "overlay-contracts"
  | "navigation-primitives"
  | "data-display"
  | "states"
  | "foundations"
  | "inventory";

export type UiLabTheme = "dark" | "light";
export type UiLabSectionId = Exclude<UiLabPanelId, "overview">;
export type UiLabSectionIcon =
  | "data-display"
  | "foundations"
  | "form-controls"
  | "inventory"
  | "navigation-primitives"
  | "overlay-contracts"
  | "states";

export type UiLabLeafId =
  | "accordion-doc"
  | "alert-doc"
  | "alert-dialog-doc"
  | "aspect-ratio-doc"
  | "avatar-doc"
  | "badge-doc"
  | "breadcrumb-doc"
  | "button-doc"
  | "card-doc"
  | "checkbox-doc"
  | "combobox-doc"
  | "collapsible-doc"
  | "code-doc"
  | "icons-doc"
  | "context-menu-doc"
  | "date-field-doc"
  | "empty-states-doc"
  | "error-states-doc"
  | "dashboards-light-sidebar"
  | "dialog-doc"
  | "drawer-doc"
  | "field-doc"
  | "form-shell-doc"
  | "filter-chip-doc"
  | "hover-card-doc"
  | "input-doc"
  | "input-otp-doc"
  | "kbd-doc"
  | "label-doc"
  | "layout-grid-doc"
  | "link-doc"
  | "loading-states-doc"
  | "account-user-profile"
  | "account-company-profile"
  | "billing-plans"
  | "billing-history"
  | "security-overview"
  | "security-log"
  | "notifications"
  | "api-keys"
  | "profiles-default"
  | "profiles-creator"
  | "profiles-company"
  | "profiles-nft"
  | "profiles-blogger"
  | "profiles-crm"
  | "profiles-gamer"
  | "profiles-feeds"
  | "profiles-plain"
  | "profiles-modal"
  | "projects-3-columns"
  | "projects-2-columns"
  | "popover-doc"
  | "progress-doc"
  | "top-loader-doc"
  | "radio-group-doc"
  | "rating-doc"
  | "rich-text-editor-doc"
  | "scroll-area-doc"
  | "status-doc"
  | "menu-doc"
  | "pagination-doc"
  | "page-toolbar-doc"
  | "secondary-tabs-doc"
  | "separator-doc"
  | "sheet-doc"
  | "skeleton-doc"
  | "slider-doc"
  | "stepper-doc"
  | "summary-pill-strip-doc"
  | "tabs-doc"
  | "table-states-doc"
  | "table-column-header-doc"
  | "table-column-visibility-doc"
  | "table-pagination-bar-doc"
  | "textarea-doc"
  | "tree-view-doc"
  | "toggle-doc"
  | "toggle-group-doc"
  | "tooltip-doc"
  | "view-preset-bar-doc"
  | "works"
  | "teams"
  | "network"
  | "activity"
  | "campaigns-card"
  | "campaigns-list"
  | "campaigns-empty"
  | "select-doc"
  | "switch-doc"
  | "tag-input-doc"
  | "table-doc";

export type UiLabLeafMeta = {
  breadcrumb: string[];
  description: string;
  heroDescription: string;
  heroTitle: string;
  id: UiLabLeafId;
  label: string;
  panelId: UiLabPanelId;
  title: string;
};

export type UiLabLeafStatus = "coming" | "ready" | "review";
export type UiLabSection = {
  icon: UiLabSectionIcon;
  id: UiLabSectionId;
  keywords: string[];
  label: string;
  leaves: readonly UiLabLeafId[];
};

export const leafMeta: Partial<Record<UiLabLeafId, UiLabLeafMeta>> = {
  "account-company-profile": {
    breadcrumb: ["My Account", "Account", "Company Profile"],
    description: "Company profile settings remain useful for validating form contracts.",
    heroDescription:
      "Company profile routes stress the same stable input, select, and textarea components without committing to a product screen.",
    heroTitle: "Company Profile",
    id: "account-company-profile",
    label: "Company Profile",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "account-user-profile": {
    breadcrumb: ["My Account", "Account", "User Profile"],
    description: "User profile settings remain useful for validating form contracts.",
    heroDescription:
      "User profile routes stress the same stable input, select, and textarea components without committing to a product screen.",
    heroTitle: "User Profile",
    id: "account-user-profile",
    label: "User Profile",
    panelId: "form-controls",
    title: "Form Controls",
  },
  activity: {
    breadcrumb: ["Public Profile", "Activity"],
    description: "Foundations and token previews used to keep donor extraction visually aligned.",
    heroDescription:
      "Color, radius, and surface rules stay visible in the lab so donor extraction never drifts away from the product-owned token layer.",
    heroTitle: "Foundations",
    id: "activity",
    label: "Activity",
    panelId: "foundations",
    title: "Foundations",
  },
  "campaigns-card": {
    breadcrumb: ["Public Profile", "More", "Campaigns - Card"],
    description: "Candidate inventory that stays outside ui-kit until product value is confirmed.",
    heroDescription:
      "This branch is useful for testing extra donor candidates without prematurely promoting them into the shared component contract.",
    heroTitle: "Campaigns Card Candidate",
    id: "campaigns-card",
    label: "Campaigns - Card",
    panelId: "inventory",
    title: "Inventory Snapshot",
  },
  "campaigns-empty": {
    breadcrumb: ["Public Profile", "More", "Empty"],
    description: "Inventory and candidate tracking for additional donor patterns.",
    heroDescription:
      "Candidate routes help us test menu shape and donor coverage without turning provisional surfaces into product commitments.",
    heroTitle: "Empty Candidate",
    id: "campaigns-empty",
    label: "Empty",
    panelId: "inventory",
    title: "Inventory Snapshot",
  },
  "campaigns-list": {
    breadcrumb: ["Public Profile", "More", "Campaigns - List"],
    description: "Candidate inventory for future donor extraction review.",
    heroDescription:
      "The lab keeps these extra entries intentionally provisional so the menu can be tested before anything reaches a shared package.",
    heroTitle: "Campaigns List Candidate",
    id: "campaigns-list",
    label: "Campaigns - List",
    panelId: "inventory",
    title: "Inventory Snapshot",
  },
  "dashboards-light-sidebar": {
    breadcrumb: ["Dashboards", "Light Sidebar"],
    description: "Independent lab route for approved donor foundations and menu behavior testing.",
    heroDescription:
      "Review extracted donor components, confirm stable contracts, and compare patterns before they move into real product surfaces.",
    heroTitle: "Light Sidebar for UI Lab",
    id: "dashboards-light-sidebar",
    label: "Dashboards",
    panelId: "overview",
    title: "Light Sidebar",
  },
  "billing-history": {
    breadcrumb: ["My Account", "Billing", "Billing History"],
    description: "Billing history lets the lab exercise table and badge presentation.",
    heroDescription:
      "History and plans are useful donor-shaped labels for evaluating stable table and badge contracts.",
    heroTitle: "Billing History",
    id: "billing-history",
    label: "Billing History",
    panelId: "data-display",
    title: "Data Display",
  },
  "billing-plans": {
    breadcrumb: ["My Account", "Billing", "Plans"],
    description: "Plan surfaces help validate card and table density on a neutral branch.",
    heroDescription:
      "Plan review works well in the lab because it stresses reusable table and badge patterns without app-specific shell decisions.",
    heroTitle: "Plans",
    id: "billing-plans",
    label: "Plans",
    panelId: "data-display",
    title: "Data Display",
  },
  "api-keys": {
    breadcrumb: ["My Account", "API Keys"],
    description: "API key routes remain useful for menu, popover, tooltip, and dialog testing.",
    heroDescription:
      "Key management is a strong neutral label for validating overlay contracts without promoting an app-specific workflow.",
    heroTitle: "API Keys",
    id: "api-keys",
    label: "API Keys",
    panelId: "overlay-contracts",
    title: "Overlay Contracts",
  },
  network: {
    breadcrumb: ["Public Profile", "Network"],
    description: "Reusable empty, search, and loading states that stay product-neutral.",
    heroDescription:
      "Search, empty, guided, and loading states are reviewed separately so they remain useful across routes without pulling in app-specific layout rules.",
    heroTitle: "State Library",
    id: "network",
    label: "Network",
    panelId: "states",
    title: "Empty & Loading States",
  },
  notifications: {
    breadcrumb: ["My Account", "Notifications"],
    description: "Notification preferences are good donors for loading and empty state review.",
    heroDescription:
      "Notification routes keep state surfaces visible without forcing the lab into an app-owned layout decision.",
    heroTitle: "Notifications",
    id: "notifications",
    label: "Notifications",
    panelId: "states",
    title: "Empty & Loading States",
  },
  "profiles-blogger": {
    breadcrumb: ["Public Profile", "Profiles", "Blogger"],
    description: "Profile donor branch used to validate nested menu depth with stable form primitives.",
    heroDescription:
      "Profile variants remain useful in the lab because they stress the same form control contract through different donor labels.",
    heroTitle: "Blogger Form Controls",
    id: "profiles-blogger",
    label: "Blogger",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-company": {
    breadcrumb: ["Public Profile", "Profiles", "Company"],
    description: "Stable form controls and compact entry patterns under the profiles branch.",
    heroDescription:
      "Inputs, selectors, and compact action elements stay generic here so they can be evaluated before any product-specific styling is locked in.",
    heroTitle: "Company Form Controls",
    id: "profiles-company",
    label: "Company",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-crm": {
    breadcrumb: ["Public Profile", "Profiles", "CRM"],
    description: "Profile donor branch used to validate nested menu depth with stable form primitives.",
    heroDescription:
      "Profile variants remain useful in the lab because they stress the same form control contract through different donor labels.",
    heroTitle: "CRM Form Controls",
    id: "profiles-crm",
    label: "CRM",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-creator": {
    breadcrumb: ["Public Profile", "Profiles", "Creator"],
    description: "Form primitives reviewed through another donor-facing label to test menu depth.",
    heroDescription:
      "The accordion branch lets us test nested navigation while the actual surface stays anchored to stable form controls.",
    heroTitle: "Creator Form Controls",
    id: "profiles-creator",
    label: "Creator",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-default": {
    breadcrumb: ["Public Profile", "Profiles", "Default"],
    description: "Stable form controls and entry primitives under the default profile branch.",
    heroDescription:
      "Inputs, selectors, and compact action elements stay generic here so they can be evaluated before any product-specific styling is locked in.",
    heroTitle: "Approved Form Controls",
    id: "profiles-default",
    label: "Default",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-feeds": {
    breadcrumb: ["Public Profile", "Profiles", "More", "Feeds"],
    description: "Collapsed donor branch that remains useful for testing deeper accordion state.",
    heroDescription:
      "The collapsed 'More' branch exists to validate that nested donor navigation still feels controlled once labels and states change.",
    heroTitle: "Feeds Candidate",
    id: "profiles-feeds",
    label: "Feeds",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-gamer": {
    breadcrumb: ["Public Profile", "Profiles", "More", "Gamer"],
    description: "Collapsed donor branch that remains useful for testing deeper accordion state.",
    heroDescription:
      "The collapsed 'More' branch exists to validate that nested donor navigation still feels controlled once labels and states change.",
    heroTitle: "Gamer Candidate",
    id: "profiles-gamer",
    label: "Gamer",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-modal": {
    breadcrumb: ["Public Profile", "Profiles", "More", "Modal"],
    description: "Collapsed donor branch that remains useful for testing deeper accordion state.",
    heroDescription:
      "The collapsed 'More' branch exists to validate that nested donor navigation still feels controlled once labels and states change.",
    heroTitle: "Modal Candidate",
    id: "profiles-modal",
    label: "Modal",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-nft": {
    breadcrumb: ["Public Profile", "Profiles", "NFT"],
    description: "Profile donor branch used to validate nested menu depth with stable form primitives.",
    heroDescription:
      "Profile variants remain useful in the lab because they stress the same form control contract through different donor labels.",
    heroTitle: "NFT Form Controls",
    id: "profiles-nft",
    label: "NFT",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-plain": {
    breadcrumb: ["Public Profile", "Profiles", "More", "Plain"],
    description: "Collapsed donor branch that remains useful for testing deeper accordion state.",
    heroDescription:
      "The collapsed 'More' branch exists to validate that nested donor navigation still feels controlled once labels and states change.",
    heroTitle: "Plain Candidate",
    id: "profiles-plain",
    label: "Plain",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "projects-2-columns": {
    breadcrumb: ["Public Profile", "Projects", "2 Columns"],
    description: "Overlay contracts and generic interaction primitives under a second donor branch.",
    heroDescription:
      "Menus, popovers, tooltips, and dialogs are extracted from donor behavior but kept product-owned and layout-neutral.",
    heroTitle: "Overlay Contracts",
    id: "projects-2-columns",
    label: "2 Columns",
    panelId: "overlay-contracts",
    title: "Overlay Contracts",
  },
  "projects-3-columns": {
    breadcrumb: ["Public Profile", "Projects", "3 Columns"],
    description: "Overlay contracts and generic interaction primitives under the projects branch.",
    heroDescription:
      "Menus, popovers, tooltips, and dialogs are extracted from donor behavior but kept product-owned and layout-neutral.",
    heroTitle: "Overlay Contracts",
    id: "projects-3-columns",
    label: "3 Columns",
    panelId: "overlay-contracts",
    title: "Overlay Contracts",
  },
  "security-log": {
    breadcrumb: ["My Account", "Security", "Security Log"],
    description: "Security log routes help validate navigation primitives and shareable lists.",
    heroDescription:
      "Log-style donors are useful because they exercise breadcrumb, tabs, and pagination without dictating page chrome.",
    heroTitle: "Security Log",
    id: "security-log",
    label: "Security Log",
    panelId: "navigation-primitives",
    title: "Navigation Primitives",
  },
  "security-overview": {
    breadcrumb: ["My Account", "Security", "Security Overview"],
    description: "Security overview is a neutral label for state and status review.",
    heroDescription:
      "Security donor routes are useful because they keep status surfaces and empty/loading handling visible in one place.",
    heroTitle: "Security Overview",
    id: "security-overview",
    label: "Security Overview",
    panelId: "states",
    title: "Empty & Loading States",
  },
  teams: {
    breadcrumb: ["Public Profile", "Teams"],
    description: "Data-dense contracts for cards and tables.",
    heroDescription:
      "Card and table contracts become strong candidates for ui-kit only after they stay consistent across different admin and tenant contexts.",
    heroTitle: "Data Display Surfaces",
    id: "teams",
    label: "Teams",
    panelId: "data-display",
    title: "Data Display",
  },
  works: {
    breadcrumb: ["Public Profile", "Works"],
    description: "Navigation primitives that survive layout changes better than app shells.",
    heroDescription:
      "Breadcrumbs, tabs, and pagination are reviewed here as reusable navigation building blocks, not as screen-specific chrome.",
    heroTitle: "Navigation Primitives",
    id: "works",
    label: "Works",
    panelId: "navigation-primitives",
    title: "Navigation Primitives",
  },
};

export const sectionLeafMeta: Partial<Record<UiLabLeafId, UiLabLeafMeta>> = {
  "alert-doc": {
    breadcrumb: ["States", "Alert"],
    description: "Alert page documents tone, appearance, size, and action layout for the current feedback contract.",
    heroDescription:
      "Alert is reviewed here as a reusable feedback surface so status messaging can stay product-owned without becoming page-specific chrome.",
    heroTitle: "Alert",
    id: "alert-doc",
    label: "Alert",
    panelId: "states",
    title: "Alert",
  },
  "alert-dialog-doc": {
    breadcrumb: ["Overlay Contracts", "Alert Dialog"],
    description: "Alert dialog page documents destructive confirmation anatomy and action emphasis for the shared confirmation overlay.",
    heroDescription:
      "Alert dialog is reviewed here as the stricter confirmation overlay for destructive or irreversible actions, kept lighter than a workflow dialog and calmer than ad-hoc danger modals.",
    heroTitle: "Alert Dialog",
    id: "alert-dialog-doc",
    label: "Alert Dialog",
    panelId: "overlay-contracts",
    title: "Alert Dialog",
  },
  "aspect-ratio-doc": {
    breadcrumb: ["Data Display", "Aspect Ratio"],
    description: "Aspect ratio page documents stable media framing without introducing page-specific media cards or donor layout wrappers.",
    heroDescription:
      "Aspect ratio is reviewed here as a quiet layout primitive for media, illustrations, and preview shells so framing stays consistent before richer content layers appear.",
    heroTitle: "Aspect Ratio",
    id: "aspect-ratio-doc",
    label: "Aspect Ratio",
    panelId: "data-display",
    title: "Aspect Ratio",
  },
  "avatar-doc": {
    breadcrumb: ["Data Display", "Avatar"],
    description: "Avatar page documents image, fallback, status, group, and identity-line composition for the shared identity baseline.",
    heroDescription:
      "Avatar is reviewed here as a lightweight identity primitive so menus, tables, cards, and activity surfaces can share one compact identity language without adopting profile-screen chrome.",
    heroTitle: "Avatar & Identity",
    id: "avatar-doc",
    label: "Avatar",
    panelId: "data-display",
    title: "Avatar",
  },
  "badge-doc": {
    breadcrumb: ["Data Display", "Badge"],
    description: "Badge page documents tone, appearance, size, and dot variants from the current ui-kit contract.",
    heroDescription:
      "Badge is reviewed here as a reusable data display primitive, with variant and appearance combinations shown side by side for fast comparison.",
    heroTitle: "Badge",
    id: "badge-doc",
    label: "Badge",
    panelId: "data-display",
    title: "Badge",
  },
  "status-doc": {
    breadcrumb: ["Data Display", "Inline Status"],
    description: "Inline status page documents small dot and dot-plus-label contracts for rows, identity lines, and compact supporting state text.",
    heroDescription:
      "Inline status is reviewed here as a lightweight shared status language so tables, avatars, and compact metadata rows can reuse one calm marker contract without escalating every state into a badge.",
    heroTitle: "Inline Status",
    id: "status-doc",
    label: "Inline Status",
    panelId: "data-display",
    title: "Inline Status",
  },
  "breadcrumb-doc": {
    breadcrumb: ["Navigation Primitives", "Breadcrumb"],
    description: "Breadcrumb page documents default separators, truncation, and current-page treatment for the current contract.",
    heroDescription:
      "Breadcrumb is reviewed here as a stable navigation primitive that should survive shell changes without pulling in app-specific routing chrome.",
    heroTitle: "Breadcrumb",
    id: "breadcrumb-doc",
    label: "Breadcrumb",
    panelId: "navigation-primitives",
    title: "Breadcrumb",
  },
  "accordion-doc": {
    breadcrumb: ["Navigation Primitives", "Accordion"],
    description: "Accordion page documents single and multiple disclosure groups without turning the primitive into a sidebar tree contract.",
    heroDescription:
      "Accordion is reviewed here as a generic grouped disclosure primitive so settings, FAQs, and dense review summaries can share one open-close contract before any navigation tree is promoted.",
    heroTitle: "Accordion",
    id: "accordion-doc",
    label: "Accordion",
    panelId: "navigation-primitives",
    title: "Accordion",
  },
  "button-doc": {
    breadcrumb: ["Form Controls", "Button"],
    description: "Button page documents the current button contract with variants, sizes, states, and icon combinations.",
    heroDescription:
      "Button is one of the first component-deep pages in UI Lab so stable actions can be reviewed the same way across all future surfaces.",
    heroTitle: "Button",
    id: "button-doc",
    label: "Button",
    panelId: "form-controls",
    title: "Button",
  },
  "card-doc": {
    breadcrumb: ["Data Display", "Card"],
    description: "Card page documents header, toolbar, content, footer, and accent variant for the shared panel contract.",
    heroDescription:
      "Card is reviewed here as the reusable panel foundation for docs, forms, metrics, and review surfaces, without inheriting any product-specific shell decisions.",
    heroTitle: "Card",
    id: "card-doc",
    label: "Card",
    panelId: "data-display",
    title: "Card",
  },
  "checkbox-doc": {
    breadcrumb: ["Form Controls", "Checkbox"],
    description: "Checkbox page documents default, checked, indeterminate, disabled, and field-wrapped usage.",
    heroDescription:
      "Checkbox is reviewed here as a compact selection primitive that must remain consistent in tables, forms, and bulk action surfaces.",
    heroTitle: "Checkbox",
    id: "checkbox-doc",
    label: "Checkbox",
    panelId: "form-controls",
    title: "Checkbox",
  },
  "date-field-doc": {
    breadcrumb: ["Form Controls", "Date Picker"],
    description: "Date picker page documents one shared contract for choosing either a single date or a date range.",
    heroDescription:
      "Date picker is reviewed here as the single user-facing date contract so product surfaces do not split one task across separate components for single-date and range selection.",
    heroTitle: "Date Picker",
    id: "date-field-doc",
    label: "Date Picker",
    panelId: "form-controls",
    title: "Date Picker",
  },
  "empty-states-doc": {
    breadcrumb: ["States", "Empty States"],
    description: "Empty states page documents base, collection, search, and guided patterns as separate reusable contracts.",
    heroDescription:
      "Empty states are reviewed here by type so the shared contract stays clear before product-specific onboarding or no-data flows are layered in.",
    heroTitle: "Empty States",
    id: "empty-states-doc",
    label: "Empty States",
    panelId: "states",
    title: "Empty States",
  },
  "error-states-doc": {
    breadcrumb: ["States", "Error States"],
    description: "Error states page documents default and action-oriented recovery patterns for the shared error contract.",
    heroDescription:
      "Error state remains a generic recovery primitive and should stay free of domain incident language in the shared layer.",
    heroTitle: "Error States",
    id: "error-states-doc",
    label: "Error States",
    panelId: "states",
    title: "Error States",
  },
  "dialog-doc": {
    breadcrumb: ["Overlay Contracts", "Dialog"],
    description: "Dialog page documents trigger patterns, surface anatomy, and sheet relation for the current overlay contract.",
    heroDescription:
      "Dialog stays in UI Lab as a reusable overlay contract, with triggers and anatomy shown independently from any product workflow.",
    heroTitle: "Dialog",
    id: "dialog-doc",
    label: "Dialog",
    panelId: "overlay-contracts",
    title: "Dialog",
  },
  "drawer-doc": {
    breadcrumb: ["Overlay Contracts", "Drawer"],
    description: "Drawer page documents bottom-sheet overlay behavior for mobile-first review, short actions, and temporary navigation surfaces.",
    heroDescription:
      "Drawer is reviewed here as a shared bottom overlay contract that stays lighter than a page route while remaining separate from app-shaped mobile navigation.",
    heroTitle: "Drawer",
    id: "drawer-doc",
    label: "Drawer",
    panelId: "overlay-contracts",
    title: "Drawer",
  },
  "collapsible-doc": {
    breadcrumb: ["Navigation Primitives", "Collapsible"],
    description: "Collapsible page documents disclosure anatomy, trigger rhythm, and content reveal for the shared disclosure contract.",
    heroDescription:
      "Collapsible is reviewed here as a generic disclosure primitive so settings, docs, and detail summaries can reuse the same open-close language without pulling in a full sidebar tree.",
    heroTitle: "Collapsible",
    id: "collapsible-doc",
    label: "Collapsible",
    panelId: "navigation-primitives",
    title: "Collapsible",
  },
  "tree-view-doc": {
    breadcrumb: ["Navigation Primitives", "Tree View"],
    description: "Tree View page documents generic nested hierarchy display with expandable branches and keyboard navigation.",
    heroDescription:
      "Tree View is reviewed here as a reusable hierarchy primitive for folders, projects, org structures, and builder trees without adopting app-shell routing chrome.",
    heroTitle: "Tree View",
    id: "tree-view-doc",
    label: "Tree View",
    panelId: "navigation-primitives",
    title: "Tree View",
  },
  "field-doc": {
    breadcrumb: ["Form Controls", "Field"],
    description: "Field page documents label, hint, error, and invalid structure for the shared field contract.",
    heroDescription:
      "Field is reviewed here as the smallest layout wrapper around a control, with validation and helper text kept explicit and reusable.",
    heroTitle: "Field",
    id: "field-doc",
    label: "Field",
    panelId: "form-controls",
    title: "Field",
  },
  "filter-chip-doc": {
    breadcrumb: ["Data Display", "Filter Chip"],
    description: "Filter chip page documents the shared compact pressed-state control for local filters, state toggles, and bounded collection refinement.",
    heroDescription:
      "Filter chip is reviewed here as a stable compact filter control so dense admin surfaces can share one calm pressed-state language without inventing route-specific chip systems.",
    heroTitle: "Filter Chip",
    id: "filter-chip-doc",
    label: "Filter Chip",
    panelId: "data-display",
    title: "Filter Chip",
  },
  "form-shell-doc": {
    breadcrumb: ["Form Controls", "Form Shell"],
    description: "Form shell page documents section structure, section headers, and grid composition for shared forms.",
    heroDescription:
      "Form shell is reviewed here as the reusable composition layer for forms, independent from any single workflow or product screen.",
    heroTitle: "Form Shell",
    id: "form-shell-doc",
    label: "Form Shell",
    panelId: "form-controls",
    title: "Form Shell",
  },
  "account-company-profile": {
    breadcrumb: ["Form Controls", "Selection Controls"],
    description: "Checkbox and switch stay in the stable form-controls bucket.",
    heroDescription:
      "Selection components are reviewed here as reusable form contracts with clear checked, unchecked, and disabled states.",
    heroTitle: "Selection Controls",
    id: "account-company-profile",
    label: "Selection Controls",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "account-user-profile": {
    breadcrumb: ["Form Controls", "Text Entry"],
    description: "Input, select, and textarea remain the lowest-risk donor extractions.",
    heroDescription:
      "Text entry controls are validated here without product-specific wording so they can move safely across surfaces.",
    heroTitle: "Text Entry",
    id: "account-user-profile",
    label: "Text Entry",
    panelId: "form-controls",
    title: "Form Controls",
  },
  activity: {
    breadcrumb: ["Foundations", "Token Swatches"],
    description: "Core semantic colors and surface tokens stay visible here for donor alignment.",
    heroDescription:
      "Token previews keep extraction grounded in the product-owned design layer instead of drifting toward vendor styling.",
    heroTitle: "Token Swatches",
    id: "activity",
    label: "Token Swatches",
    panelId: "foundations",
    title: "Foundations",
  },
  "api-keys": {
    breadcrumb: ["Navigation Primitives", "Sidebar"],
    description: "Nested sidebar navigation stays visible here as a shared tree contract with desktop and mobile examples.",
    heroDescription:
      "Navigation primitives section now treats sidebar as a shared nested tree contract while keeping search, routing, and shell-specific chrome outside the primitive.",
    heroTitle: "Sidebar",
    id: "api-keys",
    label: "Sidebar",
    panelId: "navigation-primitives",
    title: "Navigation Primitives",
  },
  "billing-history": {
    breadcrumb: ["Data Display", "Cards & Metrics"],
    description: "Cards, badges, and loading support back mixed information density surfaces.",
    heroDescription:
      "Data display stays focused on reusable display contracts such as cards, badges, and supportive metric surfaces.",
    heroTitle: "Cards & Metrics",
    id: "billing-history",
    label: "Cards & Metrics",
    panelId: "data-display",
    title: "Data Display",
  },
  "billing-plans": {
    breadcrumb: ["Data Display", "Table Contract"],
    description: "The table contract is one of the strongest reusable candidates in ui-kit.",
    heroDescription:
      "Table primitives are reviewed here for density, row presentation, and status semantics before product workflows layer on top.",
    heroTitle: "Table Contract",
    id: "billing-plans",
    label: "Table Contract",
    panelId: "data-display",
    title: "Data Display",
  },
  "campaigns-card": {
    breadcrumb: ["Data Display", "Meta Cells"],
    description: "Meta cells keep primary and secondary row text presentation consistent.",
    heroDescription:
      "Meta cells are tested here because compact primary-secondary text contracts matter across admin-grade tables and lists.",
    heroTitle: "Meta Cells",
    id: "campaigns-card",
    label: "Meta Cells",
    panelId: "data-display",
    title: "Data Display",
  },
  "campaigns-empty": {
    breadcrumb: ["States", "Error States"],
    description: "Error states belong in the state library when they stay generic and route-free.",
    heroDescription:
      "State validation here focuses on reusable error contracts instead of domain-specific incident messaging.",
    heroTitle: "Error States",
    id: "campaigns-empty",
    label: "Error States",
    panelId: "states",
    title: "States",
  },
  "campaigns-list": {
    breadcrumb: ["Inventory Snapshot", "Coverage Snapshot"],
    description: "Coverage snapshot records what already exists in ui-kit for immediate lab usage.",
    heroDescription:
      "Inventory snapshot keeps donor extraction accountable by showing what is already stable, what is provisional, and what still stays app-layer.",
    heroTitle: "Coverage Snapshot",
    id: "campaigns-list",
    label: "Coverage Snapshot",
    panelId: "inventory",
    title: "Inventory Snapshot",
  },
  "dashboards-light-sidebar": {
    breadcrumb: ["Foundations", "Overview"],
    description: "Foundations section defines the visual ground rules before higher-level patterns are evaluated.",
    heroDescription:
      "Foundations keep UI Lab anchored in token, typography, and surface decisions before any reusable pattern grows larger.",
    heroTitle: "Foundations Overview",
    id: "dashboards-light-sidebar",
    label: "Overview",
    panelId: "foundations",
    title: "Foundations",
  },
  "input-doc": {
    breadcrumb: ["Form Controls", "Input"],
    description: "Input page documents size, validation, disabled, and grouped entry variants from the current ui-kit contract.",
    heroDescription:
      "Input is reviewed here as a component-deep page so states, sizes, and grouped entry patterns stay explicit before broader documentation surfaces are introduced.",
    heroTitle: "Input",
    id: "input-doc",
    label: "Input",
    panelId: "form-controls",
    title: "Input",
  },
  "input-otp-doc": {
    breadcrumb: ["Form Controls", "Input OTP"],
    description: "Input OTP page documents slot behavior, numeric versus alphanumeric entry, paste handling, and validation rhythm for the shared code-entry contract.",
    heroDescription:
      "Input OTP is reviewed here as a stable multi-slot entry primitive so verification codes and short approval tokens can stay product-owned without reintroducing vendor-shaped auth screens.",
    heroTitle: "Input OTP",
    id: "input-otp-doc",
    label: "Input OTP",
    panelId: "form-controls",
    title: "Input OTP",
  },
  "label-doc": {
    breadcrumb: ["Form Controls", "Label"],
    description: "Label page documents standalone label hierarchy for controls, compact helper rows, and neutral field-adjacent copy.",
    heroDescription:
      "Label is reviewed here as a lightweight typographic and form-support primitive so standalone labels can stay calm without borrowing screen-specific text styles.",
    heroTitle: "Label",
    id: "label-doc",
    label: "Label",
    panelId: "form-controls",
    title: "Label",
  },
  "link-doc": {
    breadcrumb: ["Navigation Primitives", "Link"],
    description: "Link page documents the small shared anchor contract for inline navigation, subtle references, and external destinations.",
    heroDescription:
      "Link is reviewed here as a lightweight typography-and-action primitive so product surfaces can share one calm anchor baseline without coupling to router adapters or donor-shaped button-link variants.",
    heroTitle: "Link",
    id: "link-doc",
    label: "Link",
    panelId: "navigation-primitives",
    title: "Link",
  },
  "kbd-doc": {
    breadcrumb: ["Foundations", "Kbd"],
    description: "Kbd page documents keyboard hint tokens, density, and inline shortcut presentation for the shared command hint primitive.",
    heroDescription:
      "Kbd is reviewed here as a small typographic support primitive so inline shortcut hints stay calm and product-owned without inventing one-off keycap styles.",
    heroTitle: "Kbd",
    id: "kbd-doc",
    label: "Kbd",
    panelId: "foundations",
    title: "Kbd",
  },
  "icons-doc": {
    breadcrumb: ["Foundations", "Icons"],
    description: "Icons page documents the small shared semantic icon set, sizing rhythm, and currentColor rules for the approved shared icon contract.",
    heroDescription:
      "Icons are reviewed here as a small support primitive so generic search, add, direction, status, and menu symbols stay consistent without promoting every component-internal SVG into a public contract.",
    heroTitle: "Icons",
    id: "icons-doc",
    label: "Icons",
    panelId: "foundations",
    title: "Icons",
  },
  "layout-grid-doc": {
    breadcrumb: ["Foundations", "Layout Grid"],
    description: "Layout grid page documents the bounded width and section layout rules that keep shared surfaces calm and predictable.",
    heroDescription:
      "Layout grid is reviewed here as a foundation rule set so future modules and AI agents start from one stable width contract instead of inventing content-reactive layouts.",
    heroTitle: "Layout Grid",
    id: "layout-grid-doc",
    label: "Layout Grid",
    panelId: "foundations",
    title: "Foundations",
  },
  "code-doc": {
    breadcrumb: ["Foundations", "Code"],
    description: "Code page documents inline mono snippets and quiet code tokens for docs, endpoints, and stable technical labels.",
    heroDescription:
      "Code is reviewed here as a small supporting primitive so inline identifiers, endpoint fragments, and short technical values stay consistent without creating screen-specific code chips.",
    heroTitle: "Code",
    id: "code-doc",
    label: "Code",
    panelId: "foundations",
    title: "Code",
  },
  "loading-states-doc": {
    breadcrumb: ["States", "Loading States"],
    description: "Loading states page documents route, collection, and table loading contracts separately.",
    heroDescription:
      "Loading states are reviewed here as generic temporal feedback primitives so they can support any future screen without rewritten structure.",
    heroTitle: "Loading States",
    id: "loading-states-doc",
    label: "Loading States",
    panelId: "states",
    title: "Loading States",
  },
  "menu-doc": {
    breadcrumb: ["Overlay Contracts", "Menu"],
    description: "Menu page documents action groups, shortcuts, destructive items, and anchored trigger behavior.",
    heroDescription:
      "Menu is reviewed here as a reusable action surface, separated from product toolbars so the base interaction contract stays clean.",
    heroTitle: "Menu",
    id: "menu-doc",
    label: "Menu",
    panelId: "overlay-contracts",
    title: "Menu",
  },
  "context-menu-doc": {
    breadcrumb: ["Overlay Contracts", "Context Menu"],
    description: "Context menu page documents right-click and keyboard-invoked action menus that open at pointer position without becoming a general action toolbar.",
    heroDescription:
      "Context menu is reviewed here as the companion to menu for contextual actions on existing surfaces, while the core item styling and action semantics stay aligned with the shared overlay layer.",
    heroTitle: "Context Menu",
    id: "context-menu-doc",
    label: "Context Menu",
    panelId: "overlay-contracts",
    title: "Context Menu",
  },
  "hover-card-doc": {
    breadcrumb: ["Overlay Contracts", "Hover Card"],
    description: "Hover card page documents richer hover or focus previews that sit between tooltip and popover without becoming a workflow surface.",
    heroDescription:
      "Hover card is reviewed here as a calm contextual preview layer for richer summaries, identity snippets, and supporting metadata around a trigger.",
    heroTitle: "Hover Card",
    id: "hover-card-doc",
    label: "Hover Card",
    panelId: "overlay-contracts",
    title: "Hover Card",
  },
  "pagination-doc": {
    breadcrumb: ["Navigation Primitives", "Pagination"],
    description: "Pagination page documents active page treatment, ellipsis behavior, and previous-next controls.",
    heroDescription:
      "Pagination stays in the navigation primitive bucket because it should support many list surfaces without inheriting any specific table layout.",
    heroTitle: "Pagination",
    id: "pagination-doc",
    label: "Pagination",
    panelId: "navigation-primitives",
    title: "Pagination",
  },
  "page-toolbar-doc": {
    breadcrumb: ["Navigation Primitives", "Page Toolbar"],
    description: "Page toolbar page documents page-level title, supporting copy, eyebrow, and restrained action placement for stable route headers.",
    heroDescription:
      "Page toolbar is reviewed here as a stable route-level heading pattern so top-of-page structure stays reusable without collapsing into product shell logic or dashboard-specific hero blocks.",
    heroTitle: "Page Toolbar",
    id: "page-toolbar-doc",
    label: "Page Toolbar",
    panelId: "navigation-primitives",
    title: "Page Toolbar",
  },
  "progress-doc": {
    breadcrumb: ["States", "Progress"],
    description: "Progress page documents the shared linear progress contract for rollout status, upload feedback, and dense completion summaries.",
    heroDescription:
      "Progress is reviewed here as the calm linear feedback primitive that can support workflow completion and background tasks without promoting heavier radial or dashboard-specific variants.",
    heroTitle: "Progress",
    id: "progress-doc",
    label: "Progress",
    panelId: "states",
    title: "Progress",
  },
  "top-loader-doc": {
    breadcrumb: ["States", "Top Loader"],
    description: "Top loader page documents the review-stage shared viewport loading bar for transport and route-level activity.",
    heroDescription:
      "Top loader is reviewed here as a restrained NProgress-like bar for shared API and route activity, separate from determinate content progress.",
    heroTitle: "Top Loader",
    id: "top-loader-doc",
    label: "Top Loader",
    panelId: "states",
    title: "Top Loader",
  },
  "radio-group-doc": {
    breadcrumb: ["Form Controls", "Radio Group"],
    description: "Radio group page documents option density, orientation, and field-level usage for the current single-choice contract.",
    heroDescription:
      "Radio group is reviewed here as the stable single-choice primitive that sits between select and checkbox without pulling in product-specific cards or lists.",
    heroTitle: "Radio Group",
    id: "radio-group-doc",
    label: "Radio Group",
    panelId: "form-controls",
    title: "Radio Group",
  },
  "rating-doc": {
    breadcrumb: ["Data Display", "Rating"],
    description: "Rating page documents compact star-based value display, interactive selection, read-only review, and optional numeric feedback.",
    heroDescription:
      "Rating is reviewed here as a lightweight scoring primitive so reviews, quality signals, and operator feedback can share one compact visual language without turning into domain-specific review cards.",
    heroTitle: "Rating",
    id: "rating-doc",
    label: "Rating",
    panelId: "data-display",
    title: "Rating",
  },
  "scroll-area-doc": {
    breadcrumb: ["Data Display", "Scroll Area"],
    description: "Scroll area page documents contained vertical and horizontal overflow for dense review surfaces without introducing app-owned layout shells.",
    heroDescription:
      "Scroll area is reviewed here as a calm overflow primitive so dense lists, panels, and command surfaces can share one scrollbar treatment without adopting vendor containers wholesale.",
    heroTitle: "Scroll Area",
    id: "scroll-area-doc",
    label: "Scroll Area",
    panelId: "data-display",
    title: "Scroll Area",
  },
  "separator-doc": {
    breadcrumb: ["Data Display", "Separator"],
    description: "Separator page documents horizontal and vertical division for calm shared structure across cards, menus, and dense panels.",
    heroDescription:
      "Separator is reviewed here as a low-risk structural primitive that helps content grouping without becoming a layout framework or product-specific rule line.",
    heroTitle: "Separator",
    id: "separator-doc",
    label: "Separator",
    panelId: "data-display",
    title: "Separator",
  },
  "table-column-visibility-doc": {
    breadcrumb: ["Data Display", "Table Column Visibility"],
    description: "Table column visibility page documents shared column toggle controls and checkbox-driven visibility management above the stable base table contract.",
    heroDescription:
      "Table column visibility is documented here as a small shared helper for denser operator tables, with caller-owned state, popover-based toggles, and validated toolbar fit across real surfaces.",
    heroTitle: "Table Column Visibility",
    id: "table-column-visibility-doc",
    label: "Table Column Visibility",
    panelId: "data-display",
    title: "Table Column Visibility",
  },
  "table-pagination-bar-doc": {
    breadcrumb: ["Data Display", "Table Pagination Bar"],
    description: "Table pagination bar page documents page navigation, page-size selection, and record range summary for the shared table helper layer.",
    heroDescription:
      "Table pagination bar is reviewed here as a small stable helper above the base table primitive so dense list surfaces can keep one reusable pagination rhythm without inheriting a full data-grid runtime.",
    heroTitle: "Table Pagination Bar",
    id: "table-pagination-bar-doc",
    label: "Table Pagination Bar",
    panelId: "data-display",
    title: "Table Pagination Bar",
  },
  "popover-doc": {
    breadcrumb: ["Overlay Contracts", "Popover"],
    description: "Popover page documents compact contextual content and anchored side or align variations.",
    heroDescription:
      "Popover is reviewed here as a lightweight contextual surface that must remain distinct from menus and dialogs.",
    heroTitle: "Popover",
    id: "popover-doc",
    label: "Popover",
    panelId: "overlay-contracts",
    title: "Popover",
  },
  "select-doc": {
    breadcrumb: ["Form Controls", "Select"],
    description: "Select page documents size, invalid, disabled, and field-shell usage for the current dropdown contract.",
    heroDescription:
      "Select is reviewed here as a stable form control, with only reusable states and no product-specific menu logic attached.",
    heroTitle: "Select",
    id: "select-doc",
    label: "Select",
    panelId: "form-controls",
    title: "Select",
  },
  "combobox-doc": {
    breadcrumb: ["Form Controls", "Combobox"],
    description: "Combobox page documents searchable single-select behavior for local datasets and caller-owned async search.",
    heroDescription:
      "Combobox is reviewed here as the richer searchable choice surface that sits beside the stable native select without replacing it.",
    heroTitle: "Combobox",
    id: "combobox-doc",
    label: "Combobox",
    panelId: "form-controls",
    title: "Combobox",
  },
  "skeleton-doc": {
    breadcrumb: ["States", "Skeleton"],
    description: "Skeleton page documents block, text, circle, and grouped placeholder usage for the shared loading placeholder contract.",
    heroDescription:
      "Skeleton is reviewed here as the smallest loading placeholder primitive so collections, cards, and detail surfaces can share one calm preloaded state language.",
    heroTitle: "Skeleton",
    id: "skeleton-doc",
    label: "Skeleton",
    panelId: "states",
    title: "Skeleton",
  },
  "secondary-tabs-doc": {
    breadcrumb: ["Navigation Primitives", "Secondary Tabs"],
    description: "Secondary tabs page documents the lighter subordinate section-switching pattern for stable in-page subnavigation.",
    heroDescription:
      "Secondary tabs are documented here as a stable subordinate navigation helper so bounded in-page subnavigation can stay lighter than the primary route structure.",
    heroTitle: "Secondary Tabs",
    id: "secondary-tabs-doc",
    label: "Secondary Tabs",
    panelId: "navigation-primitives",
    title: "Secondary Tabs",
  },
  "stepper-doc": {
    breadcrumb: ["Navigation Primitives", "Stepper"],
    description: "Stepper page documents progress navigation, indicator states, and step-linked content for the shared multi-step contract.",
    heroDescription:
      "Stepper is reviewed here as a reusable progress and stage-navigation primitive so setup and review flows can share one calm multi-step language without borrowing a page-specific wizard shell.",
    heroTitle: "Stepper",
    id: "stepper-doc",
    label: "Stepper",
    panelId: "navigation-primitives",
    title: "Stepper",
  },
  "sheet-doc": {
    breadcrumb: ["Overlay Contracts", "Sheet"],
    description: "Sheet page documents the side-surface overlay contract and its relation to dialog.",
    heroDescription:
      "Sheet is reviewed here as the broader companion to dialog, with live preview and structure guidance but no screen-specific workflow baked in.",
    heroTitle: "Sheet",
    id: "sheet-doc",
    label: "Sheet",
    panelId: "overlay-contracts",
    title: "Sheet",
  },
  "summary-pill-strip-doc": {
    breadcrumb: ["Inventory Snapshot", "Summary Pill Strip"],
    description: "Summary pill strip stays visible here as a provisional compact status summary pattern.",
    heroDescription:
      "Summary pill strip is documented here as review material only, so the visual density and semantics can be tested before any promotion.",
    heroTitle: "Summary Pill Strip",
    id: "summary-pill-strip-doc",
    label: "Summary Pill Strip",
    panelId: "inventory",
    title: "Summary Pill Strip",
  },
  "tabs-doc": {
    breadcrumb: ["Navigation Primitives", "Tabs"],
    description: "Tabs page documents surface and line variants, size scale, and badge usage.",
    heroDescription:
      "Tabs are reviewed here as a reusable section-switching primitive so variants and sizes stay visible before route logic is layered in.",
    heroTitle: "Tabs",
    id: "tabs-doc",
    label: "Tabs",
    panelId: "navigation-primitives",
    title: "Tabs",
  },
  network: {
    breadcrumb: ["Foundations", "Surface Rules"],
    description: "Surface rules and radius choices stay visible so donor extraction remains consistent.",
    heroDescription:
      "Surface rules section protects spacing, radius, and elevation from drifting when new donor components arrive.",
    heroTitle: "Surface Rules",
    id: "network",
    label: "Surface Rules",
    panelId: "foundations",
    title: "Foundations",
  },
  notifications: {
    breadcrumb: ["Overlay Contracts", "Sheet Contract"],
    description: "Sheets and larger layered interactions remain generic overlay contracts.",
    heroDescription:
      "Overlay contracts review menus, popovers, dialogs, and sheets without binding them to a product-specific action flow.",
    heroTitle: "Sheet Contract",
    id: "notifications",
    label: "Sheet Contract",
    panelId: "overlay-contracts",
    title: "Overlay Contracts",
  },
  "profiles-default": {
    breadcrumb: ["Form Controls", "Field & Form Shell"],
    description: "Field layout and form shell keep validation structure consistent across surfaces.",
    heroDescription:
      "Field and form-shell patterns belong here because they are stable layout contracts, not domain-specific forms.",
    heroTitle: "Field & Form Shell",
    id: "profiles-default",
    label: "Field & Form Shell",
    panelId: "form-controls",
    title: "Form Controls",
  },
  "profiles-feeds": {
    breadcrumb: ["Inventory Snapshot", "Next Donor Targets"],
    description: "Next donor targets stay visible so extraction continues in a controlled order.",
    heroDescription:
      "This view keeps the next safe donor candidates explicit and prevents random expansion of the lab or ui-kit.",
    heroTitle: "Next Donor Targets",
    id: "profiles-feeds",
    label: "Next Donor Targets",
    panelId: "inventory",
    title: "Inventory Snapshot",
  },
  "profiles-gamer": {
    breadcrumb: ["Inventory Snapshot", "Promotion Boundary"],
    description: "Promotion boundary records what is safe for ui-kit and what must remain app-layer.",
    heroDescription:
      "Promotion boundary protects ui-kit from turning into a storage area for unstable screen-level experiments.",
    heroTitle: "Promotion Boundary",
    id: "profiles-gamer",
    label: "Promotion Boundary",
    panelId: "inventory",
    title: "Inventory Snapshot",
  },
  "projects-2-columns": {
    breadcrumb: ["Overlay Contracts", "Tooltip & Dialog"],
    description: "Tooltip and dialog remain generic interaction layers with no product workflow baked in.",
    heroDescription:
      "Tooltip and dialog patterns are validated here as reusable interaction contracts rather than screen-specific moments.",
    heroTitle: "Tooltip & Dialog",
    id: "projects-2-columns",
    label: "Tooltip & Dialog",
    panelId: "overlay-contracts",
    title: "Overlay Contracts",
  },
  "projects-3-columns": {
    breadcrumb: ["Overlay Contracts", "Menu & Popover"],
    description: "Menu and popover are safe donor extractions when kept generic and controlled.",
    heroDescription:
      "Menu and popover section validates anchored interaction primitives before any route-specific toolbar logic is layered in.",
    heroTitle: "Menu & Popover",
    id: "projects-3-columns",
    label: "Menu & Popover",
    panelId: "overlay-contracts",
    title: "Overlay Contracts",
  },
  "security-log": {
    breadcrumb: ["States", "Loading States"],
    description: "Loading states help transition between lists, tables, and route sections consistently.",
    heroDescription:
      "Loading states in UI Lab remain route-agnostic so they can support any future surface without rewriting the contract.",
    heroTitle: "Loading States",
    id: "security-log",
    label: "Loading States",
    panelId: "states",
    title: "States",
  },
  "security-overview": {
    breadcrumb: ["States", "Empty States"],
    description: "Empty states are checked here as reusable collection and route-level primitives.",
    heroDescription:
      "State contracts belong here so empty, guided, and search states stay generic and do not drift toward domain flows.",
    heroTitle: "Empty States",
    id: "security-overview",
    label: "Empty States",
    panelId: "states",
    title: "States",
  },
  teams: {
    breadcrumb: ["Navigation Primitives", "Tabs & Pagination"],
    description: "Tabs and pagination remain stable cross-surface navigation primitives.",
    heroDescription:
      "Tabs and pagination are validated here as reusable navigation contracts that survive layout and route changes cleanly.",
    heroTitle: "Tabs & Pagination",
    id: "teams",
    label: "Tabs & Pagination",
    panelId: "navigation-primitives",
    title: "Navigation Primitives",
  },
  "tooltip-doc": {
    breadcrumb: ["Overlay Contracts", "Tooltip"],
    description: "Tooltip page documents hint density, side placement, delay behavior, and disabled state.",
    heroDescription:
      "Tooltip belongs in the overlay contract because it is a focused hint layer, not a content surface or action menu.",
    heroTitle: "Tooltip",
    id: "tooltip-doc",
    label: "Tooltip",
    panelId: "overlay-contracts",
    title: "Tooltip",
  },
  "switch-doc": {
    breadcrumb: ["Form Controls", "Switch"],
    description: "Switch page documents size, shape, checked, and disabled states for the current toggle contract.",
    heroDescription:
      "Switch is reviewed here as an app-agnostic boolean control so motion, shape, and density stay visible before screens are composed.",
    heroTitle: "Switch",
    id: "switch-doc",
    label: "Switch",
    panelId: "form-controls",
    title: "Switch",
  },
  "slider-doc": {
    breadcrumb: ["Form Controls", "Slider"],
    description: "Slider page documents the shared single-value range control for measured adjustments and bounded thresholds.",
    heroDescription:
      "Slider is reviewed here as a calm single-value range primitive so measured adjustments can stay product-owned without importing donor-heavy range systems.",
    heroTitle: "Slider",
    id: "slider-doc",
    label: "Slider",
    panelId: "form-controls",
    title: "Slider",
  },
  "tag-input-doc": {
    breadcrumb: ["Form Controls", "Tag Input"],
    description: "Tag input page documents inline removable labels, free-form string entry, and preset-only tag selection for compact metadata lists.",
    heroDescription:
      "Tag input is reviewed here as a narrow label-entry helper that can stay free-form or constrained to a predefined tag list without becoming a taxonomy picker or multi-select runtime.",
    heroTitle: "Tag Input",
    id: "tag-input-doc",
    label: "Tag Input",
    panelId: "form-controls",
    title: "Tag Input",
  },
  "toggle-doc": {
    breadcrumb: ["Form Controls", "Toggle"],
    description: "Toggle page documents pressed state, outline treatment, sizes, and icon-bearing selection controls for the shared pressed-button contract.",
    heroDescription:
      "Toggle is reviewed here as a compact pressed-state primitive that stays lighter than tabs and more explicit than a plain ghost button.",
    heroTitle: "Toggle",
    id: "toggle-doc",
    label: "Toggle",
    panelId: "form-controls",
    title: "Toggle",
  },
  "toggle-group-doc": {
    breadcrumb: ["Form Controls", "Toggle Group"],
    description: "Toggle group page documents single and multiple selection using the shared pressed-button family without turning it into route navigation.",
    heroDescription:
      "Toggle group is reviewed here as a compact grouped selection primitive for density-sensitive filters, view switches, and formatting controls.",
    heroTitle: "Toggle Group",
    id: "toggle-group-doc",
    label: "Toggle Group",
    panelId: "form-controls",
    title: "Toggle Group",
  },
  "table-doc": {
    breadcrumb: ["Data Display", "Table"],
    description: "Table page documents density, sort affordance, row meta, and status presentation for the current table contract.",
    heroDescription:
      "Table is reviewed here as one of the strongest reusable candidates in ui-kit, with density and row structure shown before workflow orchestration is layered in.",
    heroTitle: "Table",
    id: "table-doc",
    label: "Table",
    panelId: "data-display",
    title: "Table",
  },
  "table-column-header-doc": {
    breadcrumb: ["Data Display", "Table Column Header"],
    description: "Table column header page documents donor-inspired title, icon, description, and sort affordance composition without coupling to a full data-grid runtime.",
    heroDescription:
      "Table column header is reviewed here as a richer table helper above the base header cell so dense admin tables can stay consistent without importing vendor grid internals.",
    heroTitle: "Table Column Header",
    id: "table-column-header-doc",
    label: "Table Column Header",
    panelId: "data-display",
    title: "Table Column Header",
  },
  "table-states-doc": {
    breadcrumb: ["Data Display", "Table States"],
    description: "Table states page documents loading and empty-table guidance around the stable table contract.",
    heroDescription:
      "Table states are reviewed here because data-dense admin surfaces need a predictable loading and no-results story without creating a new table component.",
    heroTitle: "Table States",
    id: "table-states-doc",
    label: "Table States",
    panelId: "data-display",
    title: "Table States",
  },
  "textarea-doc": {
    breadcrumb: ["Form Controls", "Textarea"],
    description: "Textarea page documents resize, invalid, disabled, required, and field-shell usage for the shared multi-line entry contract.",
    heroDescription:
      "Textarea is reviewed here as the stable long-form entry primitive so notes, descriptions, and review comments can share one product-owned text-area contract.",
    heroTitle: "Textarea",
    id: "textarea-doc",
    label: "Textarea",
    panelId: "form-controls",
    title: "Textarea",
  },
  "rich-text-editor-doc": {
    breadcrumb: ["Form Controls", "Rich Text Editor"],
    description: "Rich text editor page documents the approved first-slice WYSIWYG foundation for shared formatted entry and readonly rendering.",
    heroDescription:
      "Rich text editor is reviewed here as a shared `ui-kit` surface so formatted narrative fields can reuse one editor foundation instead of inventing product-local HTML tooling.",
    heroTitle: "Rich Text Editor",
    id: "rich-text-editor-doc",
    label: "Rich Text Editor",
    panelId: "form-controls",
    title: "Rich Text Editor",
  },
  "view-preset-bar-doc": {
    breadcrumb: ["Inventory Snapshot", "View Preset Bar"],
    description: "View preset bar remains provisional while we validate its fit across dense admin surfaces.",
    heroDescription:
      "View preset bar is documented here as a candidate pattern so we can inspect behavior and density without treating it as a settled ui-kit contract.",
    heroTitle: "View Preset Bar",
    id: "view-preset-bar-doc",
    label: "View Preset Bar",
    panelId: "inventory",
    title: "View Preset Bar",
  },
  works: {
    breadcrumb: ["Navigation Primitives", "Breadcrumb"],
    description: "Breadcrumbs provide context without tying UI Lab to app-shell routing.",
    heroDescription:
      "Breadcrumb stays in the primitive bucket because it is reusable across shells and should not depend on one layout hierarchy.",
    heroTitle: "Breadcrumb",
    id: "works",
    label: "Breadcrumb",
    panelId: "navigation-primitives",
    title: "Navigation Primitives",
  },
};

export const uiLabLeafMeta = {
  ...leafMeta,
  ...sectionLeafMeta,
} as Record<UiLabLeafId, UiLabLeafMeta>;

export const foundationsLeaves = [
  "dashboards-light-sidebar",
  "activity",
  "network",
  "layout-grid-doc",
  "icons-doc",
  "kbd-doc",
  "code-doc",
] as const satisfies readonly UiLabLeafId[];

export const formControlLeaves = [
  "button-doc",
  "input-doc",
  "input-otp-doc",
  "label-doc",
  "date-field-doc",
  "select-doc",
  "combobox-doc",
  "textarea-doc",
  "rich-text-editor-doc",
  "tag-input-doc",
  "checkbox-doc",
  "radio-group-doc",
  "switch-doc",
  "slider-doc",
  "toggle-doc",
  "toggle-group-doc",
  "field-doc",
  "form-shell-doc",
  "profiles-default",
  "profiles-creator",
  "profiles-company",
  "profiles-nft",
  "profiles-blogger",
  "profiles-crm",
  "profiles-plain",
  "profiles-modal",
  "account-user-profile",
  "account-company-profile",
] as const satisfies readonly UiLabLeafId[];

export const overlayLeaves = [
  "alert-dialog-doc",
  "menu-doc",
  "context-menu-doc",
  "hover-card-doc",
  "popover-doc",
  "tooltip-doc",
  "dialog-doc",
  "drawer-doc",
  "sheet-doc",
  "projects-3-columns",
  "projects-2-columns",
  "notifications",
] as const satisfies readonly UiLabLeafId[];

export const navigationLeaves = [
  "accordion-doc",
  "breadcrumb-doc",
  "link-doc",
  "collapsible-doc",
  "tree-view-doc",
  "stepper-doc",
  "tabs-doc",
  "secondary-tabs-doc",
  "page-toolbar-doc",
  "pagination-doc",
  "api-keys",
  "teams",
  "works",
] as const satisfies readonly UiLabLeafId[];

export const dataDisplayLeaves = [
  "aspect-ratio-doc",
  "avatar-doc",
  "rating-doc",
  "card-doc",
  "filter-chip-doc",
  "status-doc",
  "separator-doc",
  "scroll-area-doc",
  "badge-doc",
  "table-doc",
  "table-column-header-doc",
  "table-pagination-bar-doc",
  "table-column-visibility-doc",
  "table-states-doc",
  "billing-plans",
  "billing-history",
] as const satisfies readonly UiLabLeafId[];

export const stateLeaves = [
  "alert-doc",
  "progress-doc",
  "top-loader-doc",
  "skeleton-doc",
  "empty-states-doc",
  "loading-states-doc",
  "error-states-doc",
  "security-overview",
  "security-log",
] as const satisfies readonly UiLabLeafId[];

export const inventoryLeaves = [
  "campaigns-card",
  "campaigns-empty",
  "campaigns-list",
  "summary-pill-strip-doc",
  "view-preset-bar-doc",
  "profiles-gamer",
  "profiles-feeds",
] as const satisfies readonly UiLabLeafId[];

export const uiLabSections = [
  {
    icon: "foundations",
    id: "foundations",
    keywords: ["tokens", "typography", "spacing", "radius", "shadows", "surface"],
    label: "Foundations",
    leaves: foundationsLeaves,
  },
  {
    icon: "form-controls",
    id: "form-controls",
    keywords: ["button", "input", "date", "calendar", "select", "combobox", "tag input", "textarea", "checkbox", "radio", "switch", "field", "form shell"],
    label: "Form Controls",
    leaves: formControlLeaves,
  },
  {
    icon: "overlay-contracts",
    id: "overlay-contracts",
    keywords: ["menu", "popover", "tooltip", "dialog", "drawer", "sheet"],
    label: "Overlay Contracts",
    leaves: overlayLeaves,
  },
  {
    icon: "navigation-primitives",
    id: "navigation-primitives",
    keywords: ["breadcrumb", "tabs", "pagination", "collapsible", "tree", "stepper", "navigation", "sidebar"],
    label: "Navigation Primitives",
    leaves: navigationLeaves,
  },
  {
    icon: "data-display",
    id: "data-display",
    keywords: ["table", "card", "badge", "avatar", "identity", "separator", "meta cell", "density", "sort", "filter", "summary"],
    label: "Data Display",
    leaves: dataDisplayLeaves,
  },
  {
    icon: "states",
    id: "states",
    keywords: ["alert", "empty", "loading", "error", "state", "feedback"],
    label: "States",
    leaves: stateLeaves,
  },
  {
    icon: "inventory",
    id: "inventory",
    keywords: ["inventory", "coverage", "promotion", "donor", "ui kit", "date range"],
    label: "Inventory Snapshot",
    leaves: inventoryLeaves,
  },
] as const satisfies readonly UiLabSection[];

export const foundationSwatches = [
  { id: "canvas", label: "Canvas", value: "var(--color-bg-canvas)" },
  { id: "surface", label: "Surface", value: "var(--color-bg-surface)" },
  { id: "nav", label: "Nav", value: "var(--color-bg-nav)" },
  { id: "overlay", label: "Overlay", value: "var(--color-bg-overlay)" },
  { id: "elevated", label: "Elevated", value: "var(--color-bg-surface-elevated)" },
  { id: "muted", label: "Surface muted", value: "var(--color-bg-surface-muted)" },
  { id: "selected", label: "Selected", value: "var(--color-bg-selected)" },
  { id: "primary", label: "Accent primary", value: "var(--color-accent-primary)" },
  { id: "primary-hover", label: "Primary hover", value: "var(--color-accent-primary-hover)" },
  { id: "primary-soft", label: "Primary soft", value: "var(--color-accent-primary-soft)" },
  { id: "info", label: "Info", value: "var(--color-info)" },
  { id: "info-soft", label: "Info soft", value: "var(--color-info-soft)" },
  { id: "success", label: "Success", value: "var(--color-success)" },
  { id: "success-soft", label: "Success soft", value: "var(--color-success-soft)" },
  { id: "warning", label: "Warning", value: "var(--color-warning)" },
  { id: "warning-soft", label: "Warning soft", value: "var(--color-warning-soft)" },
  { id: "danger", label: "Danger", value: "var(--color-danger)" },
  { id: "danger-soft", label: "Danger soft", value: "var(--color-danger-soft)" },
  { id: "border-subtle", label: "Border subtle", value: "var(--color-border-subtle)" },
  { id: "border", label: "Border default", value: "var(--color-border-default)" },
  { id: "border-strong", label: "Border strong", value: "var(--color-border-strong)" },
  { id: "text", label: "Text primary", value: "var(--color-text-primary)" },
  { id: "text-secondary", label: "Text secondary", value: "var(--color-text-secondary)" },
  { id: "text-muted", label: "Text muted", value: "var(--color-text-muted)" },
] as const;

export const foundationTypeScale = [
  {
    id: "xs",
    label: "Text XS",
    size: "var(--font-size-xs)",
    meta: "12px / supporting metadata",
    sample: "Operational metadata and compact labels.",
    weight: "var(--font-weight-medium)",
  },
  {
    id: "sm",
    label: "Text SM",
    size: "var(--font-size-sm)",
    meta: "14px / default UI reading",
    sample: "Shared form labels, helper text, and dense panel copy.",
    weight: "var(--font-weight-medium)",
  },
  {
    id: "md",
    label: "Text MD",
    size: "var(--font-size-md)",
    meta: "16px / body emphasis",
    sample: "Body copy and general reading surfaces.",
    weight: "var(--font-weight-medium)",
  },
  {
    id: "lg",
    label: "Text LG",
    size: "var(--font-size-lg)",
    meta: "18px / section emphasis",
    sample: "Section-level headings and denser surface titles.",
    weight: "var(--font-weight-semibold)",
  },
  {
    id: "xl",
    label: "Text XL",
    size: "var(--font-size-xl)",
    meta: "20px / major section title",
    sample: "Higher-emphasis titles that still stay product calm.",
    weight: "var(--font-weight-semibold)",
  },
] as const;

export const foundationSpacing = [
  { id: "space-1", label: "Space 1", value: "0.25rem" },
  { id: "space-2", label: "Space 2", value: "0.5rem" },
  { id: "space-3", label: "Space 3", value: "0.75rem" },
  { id: "space-4", label: "Space 4", value: "1rem" },
  { id: "space-5", label: "Space 5", value: "1.25rem" },
  { id: "space-6", label: "Space 6", value: "1.5rem" },
  { id: "space-8", label: "Space 8", value: "2rem" },
  { id: "space-10", label: "Space 10", value: "2.5rem" },
  { id: "space-12", label: "Space 12", value: "3rem" },
] as const;

export const foundationRadii = [
  { id: "radius-xs", label: "Radius XS", value: "0.375rem" },
  { id: "radius-sm", label: "Radius SM", value: "0.5rem" },
  { id: "radius-md", label: "Radius MD", value: "0.625rem" },
  { id: "radius-control", label: "Control radius", value: "0.75rem" },
  { id: "radius-lg", label: "Radius LG", value: "1rem" },
  { id: "radius-xl", label: "Radius XL", value: "1.25rem" },
  { id: "radius-pill", label: "Radius pill", value: "9999px" },
] as const;

export const foundationMotion = [
  { id: "motion-fast", label: "Motion fast", value: "120ms", meta: "Quick hover and subtle state changes" },
  { id: "motion-normal", label: "Motion normal", value: "180ms", meta: "Default interaction timing" },
  { id: "motion-slow", label: "Motion slow", value: "260ms", meta: "Larger disclosure and overlay movement" },
  { id: "easing-standard", label: "Easing", value: "ease", meta: "Shared timing curve for standard transitions" },
  { id: "shadow-0", label: "Shadow 0", value: "var(--shadow-0)", meta: "Default page-level cards stay border-first with no shadow lift" },
  { id: "shadow-1", label: "Shadow 1", value: "var(--shadow-1)", meta: "Quiet elevation for sticky or lightly raised surfaces" },
  { id: "shadow-2", label: "Shadow 2", value: "var(--shadow-2)", meta: "Dropdowns, popovers, and calmer overlay surfaces" },
  { id: "shadow-3", label: "Shadow 3", value: "var(--shadow-3)", meta: "Drawers and stronger floating side panels" },
  { id: "shadow-4", label: "Shadow 4", value: "var(--shadow-4)", meta: "Reserved for the heaviest modal lift" },
] as const;

export const buttonNeutralVariants = ["primary", "secondary", "outline", "ghost"] as const;
export const buttonSemanticVariants = ["info", "success", "warning", "danger"] as const;
export const buttonAllVariants = [...buttonNeutralVariants, ...buttonSemanticVariants] as const;
export const buttonSizes = ["sm", "md", "lg"] as const;
export const inputSizes = ["sm", "md", "lg"] as const;
export const badgeAppearances = ["soft", "solid", "outline"] as const;
export const badgeVariants = ["neutral", "brand", "success", "warning", "danger", "info"] as const;
export const badgeSizes = ["sm", "md", "lg"] as const;
export const uiLabReferenceDate = new Date(2026, 2, 21);
export const uiLabRangePresets = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "quarter", label: "This quarter" },
] as const;

export function parseUiLabDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((segment) => Number(segment));
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function formatUiLabDateValue(date: Date | null) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addUiLabDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

export function getUiLabPresetRange(presetId: string) {
  if (presetId === "7d") {
    return {
      endDate: formatUiLabDateValue(uiLabReferenceDate),
      startDate: formatUiLabDateValue(addUiLabDays(uiLabReferenceDate, -6)),
    };
  }

  if (presetId === "30d") {
    return {
      endDate: formatUiLabDateValue(uiLabReferenceDate),
      startDate: formatUiLabDateValue(addUiLabDays(uiLabReferenceDate, -29)),
    };
  }

  const quarterStart = new Date(uiLabReferenceDate.getFullYear(), 0, 1);
  const quarterEnd = new Date(uiLabReferenceDate.getFullYear(), 2, 31);

  return {
    endDate: formatUiLabDateValue(quarterEnd),
    startDate: formatUiLabDateValue(quarterStart),
  };
}

export const demoRows = [
  {
    id: "tenant-aurora",
    note: "3 regions · synced 12m ago",
    plan: "Enterprise",
    status: "Healthy",
  },
  {
    id: "tenant-cinder",
    note: "1 region · synced 39m ago",
    plan: "Growth",
    status: "Trial",
  },
  {
    id: "tenant-nova",
    note: "2 regions · synced 3h ago",
    plan: "Starter",
    status: "Paused",
  },
] as const;

export function getStatusTone(status: (typeof demoRows)[number]["status"]) {
  switch (status) {
    case "Healthy":
      return "success";
    case "Trial":
      return "warning";
    case "Paused":
      return "neutral";
    default:
      return "brand";
  }
}

export function createDemoAvatarDataUri(initials: string, background: string, foreground = "#ffffff") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" rx="48" fill="${background}" />
      <text
        x="50%"
        y="50%"
        fill="${foreground}"
        font-family="Inter, Helvetica, sans-serif"
        font-size="34"
        font-weight="700"
        text-anchor="middle"
        dominant-baseline="middle"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const avatarDemoUsers: ReadonlyArray<{
  fallback: string;
  id: string;
  name: string;
  role: string;
  src?: string;
  status?: "online" | "offline" | "busy" | "away";
  tone: "brand" | "success" | "warning" | "danger" | "info";
}> = [
  {
    fallback: "AL",
    id: "aurora-lead",
    name: "Aurora Lee",
    role: "Platform Operations",
    src: createDemoAvatarDataUri("AL", "#1f6feb"),
    status: "online",
    tone: "brand",
  },
  {
    fallback: "MK",
    id: "mika-kent",
    name: "Mika Kent",
    role: "Billing Review",
    src: createDemoAvatarDataUri("MK", "#0f9f6e"),
    status: "away",
    tone: "success",
  },
  {
    fallback: "PR",
    id: "paige-rivera",
    name: "Paige Rivera",
    role: "Support Rotation",
    status: "busy",
    tone: "warning",
  },
  {
    fallback: "JT",
    id: "jude-tan",
    name: "Jude Tan",
    role: "Risk Review",
    src: createDemoAvatarDataUri("JT", "#d92d20"),
    status: "offline",
    tone: "danger",
  },
  {
    fallback: "NS",
    id: "nora-stone",
    name: "Nora Stone",
    role: "Security Signals",
    src: createDemoAvatarDataUri("NS", "#2563eb"),
    tone: "info",
  },
];

export function getAvatarPresenceBadgeVariant(status?: "online" | "offline" | "busy" | "away") {
  switch (status) {
    case "online":
      return "success";
    case "away":
      return "warning";
    case "busy":
      return "danger";
    case "offline":
      return "neutral";
    default:
      return "brand";
  }
}
