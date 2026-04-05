import type { AdminNavigation } from "@platform/api-client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/ui-kit";
import { useLocation, useNavigate } from "react-router-dom";

import { findAdminNavigationSection } from "../../shared/navigation";

const dashboardPath = "/dashboard";

export function AdminRuntimeSectionPage({
  navigation,
}: {
  navigation: AdminNavigation;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const section = findAdminNavigationSection(navigation, location.pathname);

  return (
    <div className="admin-web__stack">
      <Card>
        <CardHeader>
          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <Badge size="sm" variant="brand">Backend navigation route</Badge>
            {section ? (
              <Badge appearance="outline" size="sm" variant="neutral">{section.access}</Badge>
            ) : null}
          </div>
          <div>
            <CardTitle>{section?.sectionTitle ?? "Admin section"}</CardTitle>
            <CardDescription>
              {section?.sectionDescription
                || section?.moduleDescription
                || "This route is projected by /app/me/navigation. The shell uses backend access coverage even while the host page for this section is still pending."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="admin-web__stack">
          <div className="admin-web__surface-summary-card">
            <p className="admin-web__surface-summary-label">Route path</p>
            <p className="admin-web__surface-summary-value">{location.pathname}</p>
          </div>

          {section ? (
            <div className="admin-web__surface-summary-card">
              <p className="admin-web__surface-summary-label">Section</p>
              <p className="admin-web__surface-summary-value">{section.moduleTitle} / {section.sectionTitle}</p>
            </div>
          ) : null}

          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <Button onClick={() => navigate(dashboardPath)} size="sm" variant="outline">
              Back to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
