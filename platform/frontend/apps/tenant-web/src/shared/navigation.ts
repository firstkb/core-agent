import { createElement } from "react";

import { DashboardGridIcon } from "@platform/ui-kit";
import type { WorkspaceNavItem } from "@platform/app-shell";

export const tenantNavigation: WorkspaceNavItem[] = [
  {
    active: true,
    icon: createElement(DashboardGridIcon),
    label: "Dashboard",
    note: "Workspace overview",
  },
];
