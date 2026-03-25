import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";

type AdminRailUtilityPanel = "favorites" | "help" | "tasks";

type AdminRailUtilitySheetProps = {
  onNavigate: (path: string) => void;
  onOpenChange: (open: boolean) => void;
  panel: AdminRailUtilityPanel | null;
};

const panelCopy: Record<
  AdminRailUtilityPanel,
  {
    description: string;
    title: string;
  }
> = {
  favorites: {
    description: "Pinned shortcuts now cover dashboard, seeded admin routes, and UI references without changing the shared shell.",
    title: "Favorites",
  },
  help: {
    description: "Runbooks, docs, and mock-reference links stay grouped as operator support utilities.",
    title: "Help and support",
  },
  tasks: {
    description: "Pinned review notes stay grouped in one operator utility while dashboard, billing, and audit skeletons settle into the runtime.",
    title: "Tasks",
  },
};

export function AdminRailUtilitySheet({
  onNavigate,
  onOpenChange,
  panel,
}: AdminRailUtilitySheetProps) {
  if (!panel) {
    return null;
  }

  function handleRoute(path: string) {
    onNavigate(path);
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={panel !== null}>
      <DialogContent className="admin-web__utility-sheet">
        <DialogHeader>
          <div>
            <DialogTitle>{panelCopy[panel].title}</DialogTitle>
            <DialogDescription>{panelCopy[panel].description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="admin-web__utility-sheet-body">
          {panel === "tasks" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard review queue</CardTitle>
                  <CardDescription>Use the dashboard surface as the primary shell-level mock while the denser admin routes focus on module-specific layout review.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing lane review</CardTitle>
                  <CardDescription>Use the seeded billing routes to review list-detail rhythm, summary strips, and filter-rail density inside the frozen shell.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/billing/queue")} variant="outline">
                    Open billing queue
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit stream pass</CardTitle>
                  <CardDescription>Review the seeded audit routes when you need table-heavy governance layouts inside the same shell chrome.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/audit-log/events")} variant="outline">
                    Open audit log
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}

          {panel === "favorites" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard surface</CardTitle>
                  <CardDescription>The dashboard remains the broadest shell review surface for cross-tenant status and placeholder composition.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing queue</CardTitle>
                  <CardDescription>Use the billing routes for summary-strip, filter, and list-detail review without leaving the admin runtime.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/billing/queue")} variant="outline">
                    Open billing queue
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit event stream</CardTitle>
                  <CardDescription>Open the seeded governance surface when you need the table-first review flow rather than the dashboard mock.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/audit-log/events")} variant="outline">
                    Open audit log
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}

          {panel === "help" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard shell</CardTitle>
                  <CardDescription>Return to the main shell canvas when you want to validate spacing, chrome, and scroll behavior.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading state docs</CardTitle>
                  <CardDescription>Open UI Lab when you need the canonical loading-state reference rather than the shell-level mock.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/root/ui-lab")} variant="outline">
                    Review loading docs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Component lab</CardTitle>
                  <CardDescription>Internal docs and UI review surfaces still live in UI Lab while the real help center is not built.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/root/ui-lab")} variant="outline">
                    Open UI Lab
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type { AdminRailUtilityPanel };
