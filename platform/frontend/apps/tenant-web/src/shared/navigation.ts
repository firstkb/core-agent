import { createElement } from "react";

import { DashboardGridIcon } from "@platform/ui-kit";
import type { WorkspaceNavItem } from "@platform/app-shell";

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

export function getTenantNavigation(translate: TranslateFunction): WorkspaceNavItem[] {
  return [
    {
      active: true,
      icon: createElement(DashboardGridIcon),
      label: translate("tenant.navigation.dashboard.label"),
      note: translate("tenant.navigation.dashboard.note"),
    },
  ];
}
