import {
  PublishedManifestRuntimeError,
  resolveNavigationTarget,
  type DraftSnapshot,
  type PublishedManifest,
  type ResolvedViewNavigationTarget,
  type ViewDefinition,
} from "@platform/platform-studio-core";

import {
  createBuilderPreviewManifest,
  findBuilderPreviewRouteKey,
} from "../draft/builder-preview-manifest";

export type BuilderPreviewViewSummary = {
  channel: ViewDefinition["channel"];
  id: ViewDefinition["id"];
  title: ViewDefinition["title"];
  type: ViewDefinition["type"];
};

export type BuilderPreviewState =
  | { status: "no-draft" }
  | {
    availableViews: BuilderPreviewViewSummary[];
    manifest: PublishedManifest;
    status: "missing-view";
    viewId: string;
  }
  | {
    availableViews: BuilderPreviewViewSummary[];
    error: Error;
    manifest: PublishedManifest | null;
    status: "runtime-error";
    viewId: string;
  }
  | {
    availableViews: BuilderPreviewViewSummary[];
    manifest: PublishedManifest;
    previewRouteKey: string;
    resolvedTarget: ResolvedViewNavigationTarget;
    status: "ready";
  };

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown builder preview failure.");
}

function getAvailableViews(source: Pick<PublishedManifest, "views"> | DraftSnapshot) {
  return [...source.views]
    .map((view) => ({
      channel: view.channel,
      id: view.id,
      title: view.title,
      type: view.type,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function resolveBuilderPreviewState(
  draft: DraftSnapshot | null,
  viewId: string,
): BuilderPreviewState {
  if (!draft) {
    return { status: "no-draft" };
  }

  try {
    const manifest = createBuilderPreviewManifest(draft);
    const availableViews = getAvailableViews(manifest);
    const previewRouteKey = findBuilderPreviewRouteKey(manifest, viewId);

    if (!previewRouteKey) {
      return {
        availableViews,
        manifest,
        status: "missing-view",
        viewId,
      };
    }

    const resolvedTarget = resolveNavigationTarget(manifest, previewRouteKey);

    if (resolvedTarget.kind !== "view") {
      return {
        availableViews,
        error: new Error(
          `Preview route key "${previewRouteKey}" resolved to "${resolvedTarget.kind}" instead of a view target.`,
        ),
        manifest,
        status: "runtime-error",
        viewId,
      };
    }

    return {
      availableViews,
      manifest,
      previewRouteKey,
      resolvedTarget,
      status: "ready",
    };
  } catch (error) {
    return {
      availableViews: getAvailableViews(draft),
      error: toError(error),
      manifest: null,
      status: "runtime-error",
      viewId,
    };
  }
}

export function getBuilderPreviewRuntimeErrorCopy(error: Error) {
  if (error instanceof PublishedManifestRuntimeError) {
    switch (error.code) {
      case "duplicate-route-key":
        return {
          description: "The preview manifest generated from the draft contains duplicate route keys. Adjust the preview adapter before this view can resolve safely.",
          title: "Preview route map is invalid",
        };
      case "route-key-not-found":
        return {
          description: "The requested preview route key was not generated from the current draft snapshot.",
          title: "Preview route key not found",
        };
      case "view-not-found":
        return {
          description: "The preview route resolved to a view id that is missing from the preview manifest.",
          title: "Preview view definition is missing",
        };
    }
  }

  return {
    description: error.message,
    title: "Preview runtime failed",
  };
}
