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

import { tenantDashboardSectionIds } from "../../pages/dashboard/page";

type TenantRailUtilityPanel = "favorites" | "help" | "tasks";

type TenantRailUtilitySheetProps = {
  onOpenChange: (open: boolean) => void;
  onScrollToSection: (sectionId?: string) => void;
  panel: TenantRailUtilityPanel | null;
};

const panelCopy: Record<
  TenantRailUtilityPanel,
  {
    description: string;
    title: string;
  }
> = {
  favorites: {
    description: "Pinned shortcuts stay centered on the dashboard mock while tenant modules are still represented by loading-state surfaces.",
    title: "Favorites",
  },
  help: {
    description: "Runbooks, mock references, and tenant support notes stay grouped as workspace-level utilities.",
    title: "Help and support",
  },
  tasks: {
    description: "Pinned review notes stay visible as one operator utility while tenant routing remains reduced to a single dashboard route.",
    title: "Tasks",
  },
};

export function TenantRailUtilitySheet({
  onOpenChange,
  onScrollToSection,
  panel,
}: TenantRailUtilitySheetProps) {
  if (!panel) {
    return null;
  }

  function handleSelect(sectionId?: string) {
    onScrollToSection(sectionId);
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={panel !== null}>
      <DialogContent className="tenant-web__utility-sheet">
        <DialogHeader>
          <div>
            <DialogTitle>{panelCopy[panel].title}</DialogTitle>
            <DialogDescription>{panelCopy[panel].description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="tenant-web__utility-sheet-body">
          {panel === "tasks" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard review queue</CardTitle>
                  <CardDescription>Use the tenant dashboard mock as the current shell review surface while real tenant modules stay out of the menu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect()} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Module loading pass</CardTitle>
                  <CardDescription>Review how the collection-level loading states sit inside the tenant shell before real modules are wired.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.modules)} variant="outline">
                    Review modules
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shell spacing notes</CardTitle>
                  <CardDescription>Keep the tenant mock aligned with the fixed shell while desktop scroll and mobile drawer behavior remain stable.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.queue)} variant="outline">
                    Review sync queue
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
                  <CardDescription>The single retained route now acts as the primary tenant shell review destination.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect()} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity stream</CardTitle>
                  <CardDescription>Use the denser activity placeholder to verify table rhythm and shell spacing on desktop.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.activity)} variant="outline">
                    Review activity stream
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync queue canvas</CardTitle>
                  <CardDescription>Return to the lower queue block when you want to review longer-scroll placeholder composition.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.queue)} variant="outline">
                    Review sync queue
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
                  <CardDescription>Return to the main canvas when you want to validate tenant shell spacing, chrome, and scroll behavior.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect()} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading state docs</CardTitle>
                  <CardDescription>Review the tenant loading areas in the modules section when you need the placeholder contract in context.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.modules)} variant="outline">
                    Review loading docs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support runbook</CardTitle>
                  <CardDescription>The sync queue block remains the best tenant-side reference while a real help center has not been implemented yet.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.queue)} variant="outline">
                    Open support notes
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

export type { TenantRailUtilityPanel };
