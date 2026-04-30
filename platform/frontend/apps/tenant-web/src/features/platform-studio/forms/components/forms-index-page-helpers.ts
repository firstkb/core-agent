import {
  getFormsPlaceholderViewRouteId,
} from "../forms-route-helpers";
import {
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";

export type AuthoringDialogState =
  | {
      kind: "create-model";
      title: string;
    }
  | {
      kind: "create-view";
      modelId: string;
      title: string;
    }
  | {
      kind: "copy-view";
      modelId: string;
      title: string;
      viewId: string;
    };

export type DeleteIntent = {
  kind: "view";
  modelId: string;
  title: string;
  viewId: string;
};

export type DeleteModelIntent = {
  modelId: string;
  title: string;
};

export function createCopiedViewTitle(title: string, existingTitles: ReadonlyArray<string>) {
  const baseTitle = `${title} Copy`;
  if (!existingTitles.includes(baseTitle)) {
    return baseTitle;
  }

  let index = 2;
  while (existingTitles.includes(`${baseTitle} ${index}`)) {
    index += 1;
  }

  return `${baseTitle} ${index}`;
}

export function getViewStatusKey(isActive: boolean) {
  return isActive
    ? "tenant.platformStudio.forms.viewActive"
    : "tenant.platformStudio.forms.viewInactive";
}

export function isStaticFormsModel(model: Pick<FormsPlaceholderModel, "sourceType"> | null | undefined) {
  return Boolean(model?.sourceType && model.sourceType !== "managed");
}

export function triggerBrowserDownload(file: {
  blob: Blob;
  fileName: string;
}) {
  const objectUrl = globalThis.URL.createObjectURL(file.blob);
  const link = globalThis.document.createElement("a");
  link.href = objectUrl;
  link.download = file.fileName;
  link.style.display = "none";
  globalThis.document.body.append(link);
  link.click();
  link.remove();
  globalThis.setTimeout(() => {
    globalThis.URL.revokeObjectURL(objectUrl);
  }, 0);
}

export function resolveMutationSelectedViewRouteId(
  model: Pick<FormsPlaceholderModel, "screens">,
  selectedViewId: string | null,
) {
  const normalizedSelectedViewId = selectedViewId?.trim() ?? "";
  if (!normalizedSelectedViewId) {
    return null;
  }

  const selectedView = model.screens.find((screen) => screen.id === normalizedSelectedViewId);
  return selectedView ? getFormsPlaceholderViewRouteId(selectedView) : null;
}
