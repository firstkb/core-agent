import { Button } from "@platform/ui-kit";
import { WorkspaceShell } from "@platform/app-shell";
import { formatSessionLabel, getDemoSession } from "@platform/auth-core";

import { HomePage } from "../pages/home/page";
import { tenantNavigation } from "../shared/navigation";
import "./app.css";

const session = getDemoSession("tenant");

export function App() {
  return (
    <WorkspaceShell
      brand="Tenant Workspace"
      surfaceLabel="Tenant"
      navigation={tenantNavigation}
      headerTitle="Northwind Workspace"
      headerMeta={formatSessionLabel(session)}
      headerActions={
        <>
          <Button variant="ghost">Support</Button>
          <Button>Invite member</Button>
        </>
      }
      sidebarFooter={<p className="tenant-web__sidebar-note">Offline support remains inside the tenant app until sync rules stabilize.</p>}
    >
      <HomePage />
    </WorkspaceShell>
  );
}
