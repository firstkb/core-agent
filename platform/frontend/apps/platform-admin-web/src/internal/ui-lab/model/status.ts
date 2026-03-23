import type { UiLabLeafId, UiLabLeafStatus } from "./leaf-meta";

export const leafStatuses: Partial<Record<UiLabLeafId, UiLabLeafStatus>> = {
  "combobox-doc": "review",
  "stepper-doc": "ready",
  "summary-pill-strip-doc": "review",
  "tag-input-doc": "review",
  "top-loader-doc": "review",
  "view-preset-bar-doc": "review",
  "profiles-feeds": "review",
  "profiles-gamer": "review",
  "account-company-profile": "coming",
  "account-user-profile": "coming",
  "billing-history": "coming",
  "billing-plans": "coming",
  "campaigns-card": "coming",
  "campaigns-empty": "coming",
  "campaigns-list": "coming",
  notifications: "coming",
  "profiles-blogger": "coming",
  "profiles-company": "coming",
  "profiles-crm": "coming",
  "profiles-creator": "coming",
  "profiles-default": "coming",
  "profiles-modal": "coming",
  "profiles-nft": "coming",
  "profiles-plain": "coming",
  "projects-2-columns": "coming",
  "projects-3-columns": "coming",
  "security-log": "coming",
  "security-overview": "coming",
  teams: "coming",
  works: "coming",
};

export const uiKitLeafIds = new Set<UiLabLeafId>([
  "accordion-doc",
  "alert-doc",
  "alert-dialog-doc",
  "aspect-ratio-doc",
  "avatar-doc",
  "badge-doc",
  "breadcrumb-doc",
  "button-doc",
  "api-keys",
  "card-doc",
  "checkbox-doc",
  "combobox-doc",
  "code-doc",
  "collapsible-doc",
  "context-menu-doc",
  "date-field-doc",
  "dialog-doc",
  "drawer-doc",
  "empty-states-doc",
  "error-states-doc",
  "field-doc",
  "filter-chip-doc",
  "form-shell-doc",
  "hover-card-doc",
  "input-doc",
  "input-otp-doc",
  "icons-doc",
  "kbd-doc",
  "label-doc",
  "link-doc",
  "loading-states-doc",
  "menu-doc",
  "pagination-doc",
  "page-toolbar-doc",
  "popover-doc",
  "progress-doc",
  "top-loader-doc",
  "radio-group-doc",
  "rating-doc",
  "scroll-area-doc",
  "select-doc",
  "secondary-tabs-doc",
  "separator-doc",
  "sheet-doc",
  "skeleton-doc",
  "slider-doc",
  "status-doc",
  "stepper-doc",
  "summary-pill-strip-doc",
  "switch-doc",
  "tag-input-doc",
  "table-doc",
  "table-column-header-doc",
  "table-column-visibility-doc",
  "table-pagination-bar-doc",
  "table-states-doc",
  "tabs-doc",
  "textarea-doc",
  "toggle-doc",
  "toggle-group-doc",
  "tooltip-doc",
  "view-preset-bar-doc",
]);

export function getLeafStatus(id: UiLabLeafId): UiLabLeafStatus {
  return leafStatuses[id] ?? "ready";
}

export function shouldShowLeafInMenu(id: UiLabLeafId) {
  return getLeafStatus(id) !== "coming";
}

export function getLeafStatusLabel(status: UiLabLeafStatus) {
  switch (status) {
    case "coming":
      return "Coming";
    case "review":
      return "Review";
    case "ready":
    default:
      return "Ready";
  }
}

export function hasUiKitCoverage(id: UiLabLeafId) {
  return uiKitLeafIds.has(id);
}
