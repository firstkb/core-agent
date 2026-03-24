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
    description: "Pinned shortcuts now point at the dashboard mock and UI Lab references instead of a wider admin page tree.",
    title: "Favorites",
  },
  help: {
    description: "Runbooks, docs, and mock-reference links stay grouped as operator support utilities.",
    title: "Help and support",
  },
  tasks: {
    description: "Pinned review notes stay visible as one operator utility even while the runtime is reduced to a single dashboard route.",
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
                  <CardDescription>Use the dashboard mock as the current shell review surface while real module pages stay removed from the menu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading state pass</CardTitle>
                  <CardDescription>Review how the route-level and collection-level loading surfaces sit inside the desktop shell.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/root/ui-lab")} variant="outline">
                    Open UI Lab
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shell spacing notes</CardTitle>
                  <CardDescription>Keep mobile and desktop spacing aligned while the dashboard mock becomes the only primary route.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Return to mock canvas
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
                  <CardDescription>The single retained route now acts as the primary shell review destination.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>States gallery</CardTitle>
                  <CardDescription>UI Lab remains the clean reference for the shared loading and skeleton contract.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/root/ui-lab")} variant="outline">
                    Open UI Lab
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skeleton composition</CardTitle>
                  <CardDescription>Use the dashboard mock to review grouped placeholder rhythm without leaving the main shell.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Review dashboard mock
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
