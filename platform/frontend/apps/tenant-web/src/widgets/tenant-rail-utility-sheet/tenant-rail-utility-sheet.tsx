import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTableIcon,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";
import { useTranslation } from "@platform/i18n";
import type { TenantFavoriteShortcut } from "@platform/api-client";

import { tenantDashboardSectionIds } from "../../pages/dashboard/page";

type TenantRailUtilityPanel = "favorites" | "help" | "search" | "tasks";

type TenantRailUtilitySheetProps = {
  favorites: TenantFavoriteShortcut[];
  onNavigate: (path: string) => void;
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
    description: "",
    title: "Favorites",
  },
  help: {
    description: "Runbooks, mock references, and tenant support notes stay grouped as workspace-level utilities.",
    title: "Help and support",
  },
  search: {
    description: "Workspace search and command palette wiring stays separate from Help Center utilities.",
    title: "Search and commands",
  },
  tasks: {
    description: "Pinned review notes stay visible as one operator utility while tenant routing remains reduced to a single dashboard route.",
    title: "Tasks",
  },
};

export function TenantRailUtilitySheet({
  favorites,
  onNavigate,
  onOpenChange,
  onScrollToSection,
  panel,
}: TenantRailUtilitySheetProps) {
  const { t } = useTranslation();

  if (!panel) {
    return null;
  }

  function handleSelect(sectionId?: string) {
    onScrollToSection(sectionId);
    onOpenChange(false);
  }

  function handleRoute(path: string) {
    onNavigate(path);
    onOpenChange(false);
  }

  const isFavoritesPanel = panel === "favorites";

  return (
    <Dialog onOpenChange={onOpenChange} open={panel !== null}>
      <DialogContent className={`tenant-web__utility-sheet${isFavoritesPanel ? " tenant-web__utility-sheet--favorites" : ""}`}>
        <DialogHeader>
          <div>
            <DialogTitle>{panel === "search" ? t("tenant.shell.searchPanel.title") : panelCopy[panel].title}</DialogTitle>
            {(panel === "search"
              ? t("tenant.shell.searchPanel.description")
              : panelCopy[panel].description) ? (
              <DialogDescription>
                {panel === "search" ? t("tenant.shell.searchPanel.description") : panelCopy[panel].description}
              </DialogDescription>
            ) : null}
          </div>
        </DialogHeader>

        <DialogBody className={`tenant-web__utility-sheet-body${isFavoritesPanel ? " tenant-web__utility-sheet-body--favorites" : ""}`}>
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
              {favorites.length ? (
                <div className="tenant-web__favorites-grid" role="list">
                  {favorites.map((favorite) => (
                    <button
                      className="tenant-web__favorite-tile"
                      key={favorite.id}
                      onClick={() => handleRoute(favorite.route_path)}
                      role="listitem"
                      type="button"
                    >
                      <div className="tenant-web__favorite-tile-head">
                        <div className="tenant-web__favorite-tile-badges">
                          <Badge size="sm" variant="brand">{favorite.model_title}</Badge>
                        </div>
                      </div>

                      <div className="tenant-web__favorite-tile-body">
                        <span aria-hidden="true" className="tenant-web__favorite-tile-icon">
                          <DataTableIcon />
                        </span>
                        <div className="tenant-web__favorite-tile-copy">
                          <h3 className="tenant-web__favorite-tile-title">{favorite.title}</h3>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("tenant.shell.favoritesPanel.emptyTitle")}</CardTitle>
                    <CardDescription>{t("tenant.shell.favoritesPanel.emptyDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handleSelect()} variant="outline">
                      {t("tenant.shell.searchPanel.primaryAction")}
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

          {panel === "search" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t("tenant.shell.searchPanel.primaryCardTitle")}</CardTitle>
                  <CardDescription>{t("tenant.shell.searchPanel.primaryCardDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect()} variant="outline">
                    {t("tenant.shell.searchPanel.primaryAction")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("tenant.shell.searchPanel.secondaryCardTitle")}</CardTitle>
                  <CardDescription>{t("tenant.shell.searchPanel.secondaryCardDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelect(tenantDashboardSectionIds.modules)} variant="outline">
                    {t("tenant.shell.searchPanel.secondaryAction")}
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
