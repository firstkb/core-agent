import type { BuilderViewId } from "../contracts/common";
import type { PublishedManifest } from "../contracts/publish";
import type { ViewDefinition } from "../contracts/view";

import { PublishedManifestRuntimeError } from "./published-manifest-runtime-error";

export function resolveViewDefinition(
  manifest: PublishedManifest,
  viewId: BuilderViewId,
): ViewDefinition {
  const viewDefinition = manifest.views.find((view) => view.id === viewId);

  if (!viewDefinition) {
    throw new PublishedManifestRuntimeError(
      "view-not-found",
      `View "${viewId}" was not found in published manifest.`,
      { viewId },
    );
  }

  return viewDefinition;
}
