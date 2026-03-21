import type { WorkspaceNavItem } from "@platform/app-shell";

export const tenantNavigation: WorkspaceNavItem[] = [
  { label: "Home", active: true, note: "Workspace overview" },
  { label: "Members" },
  { label: "Billing" },
  { label: "Settings" },
  { label: "Offline", badge: "2" },
];
