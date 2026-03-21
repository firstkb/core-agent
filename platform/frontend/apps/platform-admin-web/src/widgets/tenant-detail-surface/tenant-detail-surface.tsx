import {
  Badge,
  Button,
  DetailPanel,
  DetailPanelBody,
  DetailPanelDescription,
  DetailPanelFooter,
  DetailPanelHeader,
  DetailPanelMeta,
  DetailPanelSection,
  DetailPanelSectionTitle,
  DetailPanelTitle,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@platform/ui-kit";
import { getTenantMetrics, tenantStatusToBadgeVariant } from "@platform/tenant-core";
import type { TenantSummary } from "@platform/tenant-core";

type TenantDetailSurfaceProps = {
  mode: "panel" | "sheet";
  open?: boolean;
  onOpenAction: () => void;
  onOpenChange?: (open: boolean) => void;
  onOpenConfig: () => void;
  selectedTenantsCount: number;
  tenant: TenantSummary | null;
};

function getFocusItems(tenant: TenantSummary) {
  if (tenant.status === "active") {
    return [
      "Maintain sync health and confirm release posture stays green.",
      "Watch regional drift before adding new tenant-specific overrides.",
    ];
  }

  if (tenant.status === "trial") {
    return [
      "Finish onboarding checklist and validate auth/session setup.",
      "Confirm rollout owner before promoting the tenant to active.",
    ];
  }

  return [
    "Unblock paused rollout before the next support or onboarding wave.",
    "Audit config, last successful sync, and operational ownership.",
  ];
}

function TenantDetailSections({
  selectedTenantsCount,
  tenant,
}: Pick<TenantDetailSurfaceProps, "selectedTenantsCount" | "tenant">) {
  if (!tenant) return null;

  return (
    <>
      <DetailPanelSection>
        <DetailPanelSectionTitle>Snapshot</DetailPanelSectionTitle>
        <div className="admin-web__tenant-detail-metrics">
          {getTenantMetrics(tenant).map((metric) => (
            <div key={metric.label} className="admin-web__tenant-detail-metric">
              <span className="admin-web__tenant-detail-metric-label">{metric.label}</span>
              <Badge appearance="soft" variant={metric.tone}>
                {metric.value}
              </Badge>
            </div>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection>
        <DetailPanelSectionTitle>Regions</DetailPanelSectionTitle>
        <div className="admin-web__tenant-detail-tags">
          {tenant.regions.map((region) => (
            <Badge appearance="outline" key={region} variant="neutral">
              {region}
            </Badge>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection>
        <DetailPanelSectionTitle>Operational Focus</DetailPanelSectionTitle>
        <ul className="admin-web__tenant-focus-list">
          {getFocusItems(tenant).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DetailPanelSection>

      {selectedTenantsCount > 1 ? (
        <DetailPanelSection>
          <DetailPanelSectionTitle>Selection Context</DetailPanelSectionTitle>
          <p className="admin-web__tenant-selection-context">
            {selectedTenantsCount} tenants are selected for bulk work. The detail surface still shows the primary focused tenant.
          </p>
        </DetailPanelSection>
      ) : null}
    </>
  );
}

function TenantDetailActions({
  onOpenAction,
  onOpenConfig,
}: Pick<TenantDetailSurfaceProps, "onOpenAction" | "onOpenConfig">) {
  return (
    <>
      <Button onClick={onOpenConfig} size="sm" variant="outline">
        View config
      </Button>
      <Button onClick={onOpenAction} size="sm">
        Open action
      </Button>
    </>
  );
}

export function TenantDetailSurface({
  mode,
  onOpenAction,
  onOpenChange,
  onOpenConfig,
  open = true,
  selectedTenantsCount,
  tenant,
}: TenantDetailSurfaceProps) {
  if (!tenant) return null;

  const statusBadge = (
    <Badge variant={tenantStatusToBadgeVariant(tenant.status)}>
      {tenant.status}
    </Badge>
  );

  if (mode === "sheet") {
    return (
      <Sheet onOpenChange={onOpenChange ?? (() => undefined)} open={open} side="right">
        <SheetContent className="admin-web__tenant-detail-sheet">
          <SheetHeader>
            <div className="admin-web__tenant-detail-header">
              <div className="admin-web__tenant-detail-title-group">
                <SheetTitle>{tenant.name}</SheetTitle>
                <SheetDescription>
                  Route-driven tenant detail collapses into a mobile sheet when the split panel would be cramped.
                </SheetDescription>
              </div>
              {statusBadge}
            </div>
          </SheetHeader>

          <SheetBody>
            <p className="admin-web__tenant-detail-route-meta">
              slug: {tenant.slug} | plan: {tenant.plan}
            </p>
            <TenantDetailSections
              selectedTenantsCount={selectedTenantsCount}
              tenant={tenant}
            />
          </SheetBody>

          <SheetFooter>
            <TenantDetailActions
              onOpenAction={onOpenAction}
              onOpenConfig={onOpenConfig}
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DetailPanel>
      <DetailPanelHeader>
        <div className="admin-web__tenant-detail-header">
          <div className="admin-web__tenant-detail-title-group">
            <DetailPanelTitle>{tenant.name}</DetailPanelTitle>
            <DetailPanelDescription>
              Tenant detail rail now follows URL state instead of local row-only selection.
            </DetailPanelDescription>
          </div>
          {statusBadge}
        </div>
        <DetailPanelMeta>
          slug: {tenant.slug} | plan: {tenant.plan}
        </DetailPanelMeta>
      </DetailPanelHeader>

      <DetailPanelBody>
        <TenantDetailSections
          selectedTenantsCount={selectedTenantsCount}
          tenant={tenant}
        />
      </DetailPanelBody>

      <DetailPanelFooter>
        <TenantDetailActions
          onOpenAction={onOpenAction}
          onOpenConfig={onOpenConfig}
        />
      </DetailPanelFooter>
    </DetailPanel>
  );
}
