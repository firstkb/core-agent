import type { AdminFavoriteShortcut } from "../../shared/navigation";
import {
  Badge,
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
  favorites: AdminFavoriteShortcut[];
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
    description: "",
    title: "Favorites",
  },
  help: {
    description: "Runbooks, docs, and mock-reference links stay grouped as operator support utilities.",
    title: "Help and support",
  },
  tasks: {
    description: "Operator notes stay focused on the current dashboard and backend-driven navigation rollout.",
    title: "Tasks",
  },
};

export function AdminRailUtilitySheet({
  favorites,
  onNavigate,
  onOpenChange,
  panel,
}: AdminRailUtilitySheetProps) {
  if (!panel) {
    return null;
  }

  const isFavoritesPanel = panel === "favorites";

  function handleRoute(path: string) {
    onNavigate(path);
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={panel !== null}>
      <DialogContent className={`admin-web__utility-sheet${isFavoritesPanel ? " admin-web__utility-sheet--favorites" : ""}`}>
        <DialogHeader>
          <div>
            <DialogTitle>{panelCopy[panel].title}</DialogTitle>
            <DialogDescription>{panelCopy[panel].description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className={`admin-web__utility-sheet-body${isFavoritesPanel ? " admin-web__utility-sheet-body--favorites" : ""}`}>
          {panel === "tasks" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard review queue</CardTitle>
                  <CardDescription>Use the dashboard surface as the primary shell-level review area while the rest of the admin runtime is driven by backend navigation coverage.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Favorites coverage</CardTitle>
                  <CardDescription>
                    Review the current navigation shortcuts returned by `/app/me/navigation` and confirm they match the admin grants.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleRoute(favorites[0]?.path ?? "/dashboard")}
                    variant="outline"
                  >
                    {favorites.length ? "Open first favorite" : "Open dashboard"}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}

          {panel === "favorites" ? (
            <>
              {favorites.length ? (
                <div className="admin-web__favorites-grid" role="list">
                  {favorites.map((favorite) => (
                    <button
                      className="admin-web__favorite-tile"
                      key={favorite.id}
                      onClick={() => handleRoute(favorite.path)}
                      role="listitem"
                      type="button"
                    >
                      <div className="admin-web__favorite-tile-head">
                        <div className="admin-web__favorite-tile-badges">
                          <Badge size="sm" variant="brand">{favorite.moduleTitle}</Badge>
                          <Badge appearance="outline" size="sm" variant="neutral">{favorite.access}</Badge>
                        </div>
                      </div>

                      <div className="admin-web__favorite-tile-body">
                        {favorite.icon ? (
                          <span aria-hidden="true" className="admin-web__favorite-tile-icon">
                            {favorite.icon}
                          </span>
                        ) : null}
                        <div className="admin-web__favorite-tile-copy">
                          <h3 className="admin-web__favorite-tile-title">{favorite.title}</h3>
                          <p className="admin-web__favorite-tile-description">{favorite.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No favorites yet</CardTitle>
                    <CardDescription>
                      The backend did not return any favorite shortcuts for this admin user.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handleRoute("/dashboard")} variant="outline">
                      Open dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
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
