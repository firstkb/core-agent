import { useEffect, useState, useSyncExternalStore } from "react";

import type {
  PublishedManifest,
  PublishedManifestRuntimeError,
  PublishedManifestRuntimeErrorCode,
} from "@platform/platform-builder-core";
import { useTranslation } from "@platform/i18n";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollectionEmptyState,
} from "@platform/ui-kit";
import { useNavigate, useParams } from "react-router-dom";

import { PublishedAppPageShell } from "./published-app-page-shell";
import {
  getPublishedManifestSourceRevision,
  loadPublishedManifest,
  subscribeToPublishedManifestSource,
} from "./published-manifest-loader";
import {
  resolvePublishedAppRoutePageState,
  type PublishedAppRouteResolvedState,
} from "./published-app-route-page-state";
import {
  publishedVisibilitySubjectOverrideStorageKey,
  usePublishedVisibilitySubject,
} from "./published-visibility-subject";
import { PublishedViewRenderer } from "./published-view-renderer";

type PublishedAppRoutePageState =
  | { status: "loading" }
  | {
    availableRouteKeys: string[];
    error: Error;
    routeKey: string;
    status: "load-error";
  }
  | PublishedAppRouteResolvedState;

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown published route failure.");
}

function getRuntimeErrorCopy(
  error: PublishedManifestRuntimeError,
): { description: string; title: string } {
  const copyByCode: Record<
    PublishedManifestRuntimeErrorCode,
    { description: string; title: string }
  > = {
    "duplicate-route-key": {
      description: "Two published navigation items share the same route key. Replace the manifest source before runtime navigation can continue safely.",
      title: "Published route map is invalid",
    },
    "route-key-not-found": {
      description: "The requested route key does not exist in the published manifest source currently resolved by this tenant runtime.",
      title: "Published route key not found",
    },
    "view-not-found": {
      description: "This route points to a published view id that is not present in the manifest payload currently consumed by the runtime.",
      title: "Published view definition is missing",
    },
  };

  return copyByCode[error.code];
}

function renderAvailableRouteKeys(routeKeys: string[]) {
  if (routeKeys.length === 0) {
    return (
      <p className="tenant-published-app__section-copy">No published route keys are currently available.</p>
    );
  }

  return (
    <div className="tenant-published-app__tag-row">
      {routeKeys.map((key) => (
        <Badge appearance="soft" key={key} size="sm" variant="neutral">
          {key}
        </Badge>
      ))}
    </div>
  );
}

function PublishedRouteSupportingCard({
  availableRouteKeys,
  manifest,
  routeKey,
  subPath,
}: {
  availableRouteKeys: string[];
  manifest: PublishedManifest;
  routeKey: string;
  subPath: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime source</CardTitle>
        <CardDescription>The route reads a locally persisted published manifest when available and otherwise falls back to the seeded demo manifest.</CardDescription>
      </CardHeader>
      <CardContent className="tenant-published-app__stack">
        <p className="tenant-published-app__section-copy">Manifest id: {manifest.manifestId}</p>
        <p className="tenant-published-app__section-copy">Published at: {manifest.publishedAt}</p>
        <p className="tenant-published-app__section-copy">Version: {manifest.version}</p>
        <p className="tenant-published-app__section-copy">Requested route key: {routeKey}</p>
        <p className="tenant-published-app__section-copy">Trailing path: {subPath || "/"}</p>

        <div className="tenant-published-app__stack">
          <p className="tenant-published-app__section-title">Available route keys</p>
          {renderAvailableRouteKeys(availableRouteKeys)}
        </div>
      </CardContent>
    </Card>
  );
}

export function PublishedAppRoutePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const routeKey = params.routeKey?.trim() ?? "";
  const subPath = params["*"] ? `/${params["*"]}` : "";
  const [state, setState] = useState<PublishedAppRoutePageState>({ status: "loading" });
  const subject = usePublishedVisibilitySubject();
  const manifestSourceRevision = useSyncExternalStore(
    subscribeToPublishedManifestSource,
    getPublishedManifestSourceRevision,
    getPublishedManifestSourceRevision,
  );
  const openDashboardLabel = t("tenant.shell.menu.openDashboard");

  useEffect(() => {
    let isActive = true;

    setState({ status: "loading" });

    void loadPublishedManifest()
      .then((manifest) => {
        try {
          if (isActive) {
            setState(resolvePublishedAppRoutePageState({
              manifest,
              routeKey,
              subject,
            }));
          }
        } catch (error) {
          if (!isActive) {
            return;
          }

          setState({
            availableRouteKeys: [],
            error: toError(error),
            routeKey,
            status: "load-error",
          });
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setState({
          availableRouteKeys: [],
          error: toError(error),
          routeKey,
          status: "load-error",
        });
      });

    return () => {
      isActive = false;
    };
  }, [manifestSourceRevision, routeKey, subject]);

  if (state.status === "loading") {
    return (
      <PublishedAppPageShell
        actions={(
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        description="Loading the current published manifest source and resolving the requested runtime route."
        eyebrow="Published app"
        title="Loading published route"
      >
        <div className="tenant-published-app__empty-surface">
          <CollectionEmptyState
            description="The route is mounted and waiting for the current published manifest source to resolve."
            eyebrow="Runtime route"
            title="Loading published manifest"
          />
        </div>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "missing-route") {
    return (
      <PublishedAppPageShell
        actions={(
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        description="The requested /app route key is not present in the published manifest source currently used by this runtime."
        eyebrow="Published app"
        title="Published route not found"
      >
        <div className="tenant-published-app__detail-grid">
          <div className="tenant-published-app__empty-surface">
            <CollectionEmptyState
              actions={(
                <Button onClick={() => navigate("/dashboard")} variant="secondary">
                  {openDashboardLabel}
                </Button>
              )}
              description={state.routeKey
                ? `No published target matched the route key "${state.routeKey}".`
                : "A route key is required under /app/:routeKey/*."}
              eyebrow="Runtime route"
              title="Invalid or missing published route"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available route keys</CardTitle>
              <CardDescription>Use one of the published route keys below to exercise the current runtime foundation.</CardDescription>
            </CardHeader>
            <CardContent className="tenant-published-app__stack">
              {renderAvailableRouteKeys(state.availableRouteKeys)}
            </CardContent>
          </Card>
        </div>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "runtime-error") {
    const copy = getRuntimeErrorCopy(state.error);

    return (
      <PublishedAppPageShell
        actions={(
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        description="The published runtime helper stack rejected the manifest or the resolved target."
        eyebrow="Published app"
        title="Published runtime error"
      >
        <div className="tenant-published-app__stack">
          <Alert appearance="soft" tone="danger">
            <AlertBody>
              <AlertTitle>{copy.title}</AlertTitle>
              <AlertDescription>{copy.description}</AlertDescription>
            </AlertBody>
          </Alert>

          <div className="tenant-published-app__detail-grid">
            <Card>
              <CardHeader>
                <CardTitle>Error details</CardTitle>
                <CardDescription>Runtime manifest errors are surfaced directly so this path fails loudly instead of navigating incorrectly.</CardDescription>
              </CardHeader>
              <CardContent className="tenant-published-app__stack">
                <p className="tenant-published-app__section-copy">Code: {state.error.code}</p>
                <p className="tenant-published-app__section-copy">Message: {state.error.message}</p>
                {state.error.routeKey ? (
                  <p className="tenant-published-app__section-copy">Route key: {state.error.routeKey}</p>
                ) : null}
                {state.error.viewId ? (
                  <p className="tenant-published-app__section-copy">View id: {state.error.viewId}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available route keys</CardTitle>
              </CardHeader>
              <CardContent className="tenant-published-app__stack">
                {renderAvailableRouteKeys(state.availableRouteKeys)}
              </CardContent>
            </Card>
          </div>
        </div>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "visibility-config-error") {
    const title =
      state.access.errorCode === "policy-not-found"
        ? t("tenant.navigation.runtime.policyNotFoundTitle")
        : t("tenant.navigation.runtime.policyUnsupportedTitle");
    const description =
      state.access.errorCode === "policy-not-found"
        ? t("tenant.navigation.runtime.policyNotFoundDescription", {
          policyId: state.access.policyId,
        })
        : t("tenant.navigation.runtime.policyUnsupportedDescription", {
          policyId: state.access.policyId,
        });

    return (
      <PublishedAppPageShell
        actions={(
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        description="The runtime found a published route, but the referenced visibility policy could not be applied safely."
        eyebrow="Published app"
        title={title}
      >
        <div className="tenant-published-app__stack">
          <Alert appearance="soft" tone="danger">
            <AlertBody>
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>{description}</AlertDescription>
            </AlertBody>
          </Alert>

          <div className="tenant-published-app__detail-grid">
            <Card>
              <CardHeader>
                <CardTitle>Visibility policy reference</CardTitle>
                <CardDescription>Invalid visibility references fail loudly instead of silently exposing or hiding a published route.</CardDescription>
              </CardHeader>
              <CardContent className="tenant-published-app__stack">
                <p className="tenant-published-app__section-copy">Route key: {state.routeKey}</p>
                <p className="tenant-published-app__section-copy">Policy id: {state.access.policyId}</p>
                <p className="tenant-published-app__section-copy">
                  Override key: {publishedVisibilitySubjectOverrideStorageKey}
                </p>
              </CardContent>
            </Card>

            <PublishedRouteSupportingCard
              availableRouteKeys={state.availableRouteKeys}
              manifest={state.manifest}
              routeKey={state.routeKey}
              subPath={subPath}
            />
          </div>
        </div>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "load-error") {
    return (
      <PublishedAppPageShell
        actions={(
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        description="The published manifest source could not be loaded or parsed for this runtime route."
        eyebrow="Published app"
        title="Published manifest load failed"
      >
        <Alert appearance="soft" tone="danger">
          <AlertBody>
            <AlertTitle>Runtime manifest load failed</AlertTitle>
            <AlertDescription>{state.error.message}</AlertDescription>
          </AlertBody>
        </Alert>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "access-denied") {
    return (
      <PublishedAppPageShell
        actions={(
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        description={t("tenant.navigation.runtime.deniedDescription")}
        eyebrow="Published app"
        title={t("tenant.navigation.runtime.deniedTitle")}
      >
        <div className="tenant-published-app__detail-grid">
          <div className="tenant-published-app__empty-surface">
            <CollectionEmptyState
              actions={(
                <Button onClick={() => navigate("/dashboard")} variant="secondary">
                  {openDashboardLabel}
                </Button>
              )}
              description={t("tenant.navigation.runtime.deniedOverrideDescription", {
                overrideKey: publishedVisibilitySubjectOverrideStorageKey,
              })}
              eyebrow="Runtime route"
              title={t("tenant.navigation.runtime.deniedTitle")}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Visibility policy evaluation</CardTitle>
              <CardDescription>The shared page-visibility helper denied this subject for the requested published route.</CardDescription>
            </CardHeader>
            <CardContent className="tenant-published-app__stack">
              <p className="tenant-published-app__section-copy">Route key: {state.routeKey}</p>
              <p className="tenant-published-app__section-copy">Policy id: {state.access.policyId}</p>
              <p className="tenant-published-app__section-copy">Mode: {state.access.policy.mode}</p>
              <p className="tenant-published-app__section-copy">
                Matches current subject: {state.access.evaluation.matches ? "yes" : "no"}
              </p>
              <p className="tenant-published-app__section-copy">
                Override key: {publishedVisibilitySubjectOverrideStorageKey}
              </p>
            </CardContent>
          </Card>

          <PublishedRouteSupportingCard
            availableRouteKeys={state.availableRouteKeys}
            manifest={state.manifest}
            routeKey={state.routeKey}
            subPath={subPath}
          />
        </div>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "system-module") {
    const systemModule = state.systemModule;

    return (
      <PublishedAppPageShell
        actions={systemModule ? (
          <Button onClick={() => navigate(systemModule.path)} variant="secondary">
            {systemModule.actionLabel}
          </Button>
        ) : (
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            {openDashboardLabel}
          </Button>
        )}
        badges={(
          <>
            <Badge appearance="soft" size="sm" variant="info">
              system-module
            </Badge>
            <Badge appearance="soft" size="sm" variant="neutral">
              {state.resolvedTarget.target.moduleKey}
            </Badge>
          </>
        )}
        description="This published route resolves to an app-local system module handoff instead of an inline view renderer."
        eyebrow="Published app"
        title={state.resolvedTarget.route.navigationNode.label}
      >
        <div className="tenant-published-app__detail-grid">
          <Card>
            <CardHeader>
              <CardTitle>System module handoff</CardTitle>
              <CardDescription>The target remains app-local and does not move into the shared metadata contract package.</CardDescription>
            </CardHeader>
            <CardContent className="tenant-published-app__stack">
              {systemModule ? (
                <>
                  <p className="tenant-published-app__section-copy">Module: {systemModule.title}</p>
                  <p className="tenant-published-app__section-copy">{systemModule.description}</p>
                  <p className="tenant-published-app__section-copy">Handoff path: {systemModule.path}</p>
                </>
              ) : (
                <>
                  <p className="tenant-published-app__section-copy">No app-local system module mapping exists for "{state.resolvedTarget.target.moduleKey}".</p>
                  <p className="tenant-published-app__section-copy">Add the module to the tenant runtime catalog before promoting this route beyond the foundation pass.</p>
                </>
              )}
            </CardContent>
          </Card>

          <PublishedRouteSupportingCard
            availableRouteKeys={state.availableRouteKeys}
            manifest={state.manifest}
            routeKey={state.routeKey}
            subPath={subPath}
          />
        </div>
      </PublishedAppPageShell>
    );
  }

  if (state.status === "external-link") {
    return (
      <PublishedAppPageShell
        actions={(
          <Button
            onClick={() => {
              window.open(state.resolvedTarget.target.url, "_blank", "noopener,noreferrer");
            }}
            variant="secondary"
          >
            Open external link
          </Button>
        )}
        badges={(
          <>
            <Badge appearance="soft" size="sm" variant="info">
              external-link
            </Badge>
            <Badge appearance="soft" size="sm" variant="neutral">
              explicit handoff
            </Badge>
          </>
        )}
        description="External-link targets render an explicit handoff surface and never navigate silently on mount."
        eyebrow="Published app"
        title={state.resolvedTarget.route.navigationNode.label}
      >
        <div className="tenant-published-app__detail-grid">
          <Card>
            <CardHeader>
              <CardTitle>External handoff</CardTitle>
              <CardDescription>Use the explicit action to leave the tenant app and open the published destination.</CardDescription>
            </CardHeader>
            <CardContent className="tenant-published-app__stack">
              <p className="tenant-published-app__section-copy">Destination: {state.resolvedTarget.target.url}</p>
              <p className="tenant-published-app__section-copy">Route label: {state.resolvedTarget.route.navigationNode.label}</p>
              <p className="tenant-published-app__section-copy">
                <a href={state.resolvedTarget.target.url} rel="noreferrer" target="_blank">
                  Open {state.resolvedTarget.target.url}
                </a>
              </p>
              <p className="tenant-published-app__section-copy">This surface keeps the handoff visible inside the authenticated app instead of redirecting immediately.</p>
            </CardContent>
          </Card>

          <PublishedRouteSupportingCard
            availableRouteKeys={state.availableRouteKeys}
            manifest={state.manifest}
            routeKey={state.routeKey}
            subPath={subPath}
          />
        </div>
      </PublishedAppPageShell>
    );
  }

  return (
    <PublishedAppPageShell
      badges={(
        <>
          <Badge appearance="soft" size="sm" variant="success">
            published view
          </Badge>
          <Badge appearance="soft" size="sm" variant="info">
            {state.resolvedTarget.view.type}
          </Badge>
          <Badge appearance="soft" size="sm" variant="neutral">
            {state.routeKey}
          </Badge>
        </>
      )}
      description={state.resolvedTarget.view.description ?? "Published metadata is resolved through the shared manifest runtime helpers."}
      eyebrow="Published app"
      title={state.resolvedTarget.view.title}
    >
      <div className="tenant-published-app__stack">
        <PublishedViewRenderer
          manifest={state.manifest}
          resolvedTarget={state.resolvedTarget}
        />

        <PublishedRouteSupportingCard
          availableRouteKeys={state.availableRouteKeys}
          manifest={state.manifest}
          routeKey={state.routeKey}
          subPath={subPath}
        />
      </div>
    </PublishedAppPageShell>
  );
}
