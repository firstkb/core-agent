import {
  Button,
  Combobox,
  type ComboboxOption,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@platform/ui-kit";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getNavigationBuilderNodeLabel,
  getNavigationBuilderNodePath,
  getNavigationBuilderTargetIdentity,
  navigationBuilderAppModules,
  navigationBuilderAppPages,
  type NavigationBuilderAddNodeKind,
  type NavigationBuilderFormViewTarget,
  type NavigationBuilderNode,
} from "../navigation-builder-state";

type NavigationBuilderAddTargetKind = Extract<
  NavigationBuilderAddNodeKind,
  "app-module" | "app-page" | "external-link" | "form-view"
>;

export type NavigationBuilderPendingAdd = {
  kind: NavigationBuilderAddTargetKind;
  parentId?: string;
};

export type NavigationBuilderAddTargetResult =
  | {
      kind: "form-view";
      parentId?: string;
      target: NavigationBuilderFormViewTarget;
    }
  | {
      kind: "app-page";
      label: string;
      page: (typeof navigationBuilderAppPages)[number];
      parentId?: string;
    }
  | {
      appModule: (typeof navigationBuilderAppModules)[number];
      kind: "app-module";
      label: string;
      parentId?: string;
    }
  | {
      kind: "external-link";
      label: string;
      parentId?: string;
      url: string;
    };

type NavigationBuilderAddDialogProps = {
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>;
  nodes: ReadonlyArray<NavigationBuilderNode>;
  onCancel: () => void;
  onConfirm: (result: NavigationBuilderAddTargetResult) => void;
  request: NavigationBuilderPendingAdd | null;
};

const addSheetCopy: Record<
  NavigationBuilderAddTargetKind,
  {
    pickerLabel: string;
    placeholder: string;
    title: string;
  }
> = {
  "app-module": {
    pickerLabel: "App module",
    placeholder: "Select app module",
    title: "Add app module",
  },
  "app-page": {
    pickerLabel: "App page",
    placeholder: "Select app page",
    title: "Add app page",
  },
  "form-view": {
    pickerLabel: "Form view",
    placeholder: "Select form view",
    title: "Add form view",
  },
  "external-link": {
    pickerLabel: "URL",
    placeholder: "https://example.com",
    title: "Add link",
  },
};

function getExternalLinkLabel(value: string) {
  try {
    const parsedUrl = new URL(value.trim());

    return parsedUrl.hostname.replace(/^www\./, "") || "New link";
  } catch {
    return "New link";
  }
}

function isValidExternalLinkUrl(value: string) {
  try {
    const parsedUrl = new URL(value.trim());

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function getFormViewTargetIdentity(target: NavigationBuilderFormViewTarget) {
  return getNavigationBuilderTargetIdentity({
    kind: "form-view",
    modelId: target.modelId,
    routePath: target.routePath,
    targetType: "form_builder_view",
    viewId: target.viewId,
  });
}

function getTargetUsageMap(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>,
) {
  const usageMap = new Map<string, string>();

  for (const node of nodes) {
    const identity = getNavigationBuilderTargetIdentity(node.target);
    if (!identity || usageMap.has(identity)) {
      continue;
    }

    const path = getNavigationBuilderNodePath(nodes, node.id)
      .map((entry) => getNavigationBuilderNodeLabel(entry, formViewTargets))
      .join(" > ");
    usageMap.set(identity, path || getNavigationBuilderNodeLabel(node, formViewTargets));
  }

  return usageMap;
}

export function NavigationBuilderAddDialog({
  formViewTargets,
  nodes,
  onCancel,
  onConfirm,
  request,
}: NavigationBuilderAddDialogProps) {
  const [customLabel, setCustomLabel] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const copy = request ? addSheetCopy[request.kind] : addSheetCopy["form-view"];

  const selectedFormViewTarget = useMemo(
    () => formViewTargets.find((target) => target.id === selectedTargetId) ?? null,
    [formViewTargets, selectedTargetId],
  );
  const selectedAppPage = useMemo(
    () => navigationBuilderAppPages.find((page) => page.key === selectedTargetId) ?? null,
    [selectedTargetId],
  );
  const selectedAppModule = useMemo(
    () => navigationBuilderAppModules.find((appModule) => appModule.key === selectedTargetId) ?? null,
    [selectedTargetId],
  );
  const targetUsageMap = useMemo(
    () => getTargetUsageMap(nodes, formViewTargets),
    [formViewTargets, nodes],
  );
  const formViewOptions = useMemo<ComboboxOption[]>(
    () => formViewTargets.map((target) => {
      const usedPath = targetUsageMap.get(getFormViewTargetIdentity(target));

      return {
        description: usedPath ? `Used in ${usedPath}` : target.description || target.modelLabel,
        disabled: Boolean(usedPath),
        label: target.label,
        meta: usedPath ? "Used" : undefined,
        searchText: `${target.label} ${target.modelLabel} ${target.viewLabel} ${target.description}`,
        value: target.id,
      };
    }),
    [formViewTargets, targetUsageMap],
  );
  const appPageOptions = useMemo<ComboboxOption[]>(
    () => navigationBuilderAppPages.map((page) => {
      const identity = getNavigationBuilderTargetIdentity({
        kind: "app-page",
        pageKey: page.key,
        routePath: page.routePath,
      });
      const usedPath = targetUsageMap.get(identity);

      return {
        description: usedPath ? `Used in ${usedPath}` : page.description,
        disabled: Boolean(usedPath),
        label: page.label,
        meta: usedPath ? "Used" : undefined,
        searchText: `${page.label} ${page.description}`,
        value: page.key,
      };
    }),
    [targetUsageMap],
  );
  const appModuleOptions = useMemo<ComboboxOption[]>(
    () => navigationBuilderAppModules.map((appModule) => {
      const identity = getNavigationBuilderTargetIdentity({
        disabled: true,
        kind: "app-module",
        moduleKey: appModule.key,
      });
      const usedPath = targetUsageMap.get(identity);

      return {
        description: usedPath ? `Used in ${usedPath}` : appModule.description,
        disabled: true,
        label: appModule.label,
        meta: usedPath ? "Used" : "Later",
        searchText: `${appModule.label} ${appModule.description}`,
        value: appModule.key,
      };
    }),
    [targetUsageMap],
  );
  const pickerOptions = request?.kind === "form-view"
    ? formViewOptions
    : request?.kind === "app-page"
      ? appPageOptions
      : request?.kind === "app-module"
        ? appModuleOptions
        : [];

  useEffect(() => {
    setCustomLabel("");
    setExternalUrl("");
    setSelectedTargetId("");
  }, [request]);

  const selectedPickerLabel =
    selectedFormViewTarget?.viewLabel
    ?? selectedAppPage?.label
    ?? selectedAppModule?.label
    ?? "";
  const selectedLabel =
    request?.kind === "external-link" ? getExternalLinkLabel(externalUrl) : selectedPickerLabel;
  const resolvedLabel = customLabel.trim() || selectedLabel;
  const trimmedExternalUrl = externalUrl.trim();
  const hasExternalUrl = Boolean(trimmedExternalUrl);
  const isExternalUrlValid = isValidExternalLinkUrl(trimmedExternalUrl);
  const selectedTargetIdentity = useMemo(() => {
    if (!request) {
      return "";
    }

    if (request.kind === "form-view" && selectedFormViewTarget) {
      return getFormViewTargetIdentity(selectedFormViewTarget);
    }

    if (request.kind === "app-page" && selectedAppPage) {
      return getNavigationBuilderTargetIdentity({
        kind: "app-page",
        pageKey: selectedAppPage.key,
        routePath: selectedAppPage.routePath,
      });
    }

    if (request.kind === "app-module" && selectedAppModule) {
      return getNavigationBuilderTargetIdentity({
        disabled: true,
        kind: "app-module",
        moduleKey: selectedAppModule.key,
      });
    }

    if (request.kind === "external-link" && isExternalUrlValid) {
      return getNavigationBuilderTargetIdentity({
        kind: "external-link",
        url: trimmedExternalUrl,
      });
    }

    return "";
  }, [
    isExternalUrlValid,
    request,
    selectedAppModule,
    selectedAppPage,
    selectedFormViewTarget,
    trimmedExternalUrl,
  ]);
  const duplicateNode = useMemo(() => {
    if (!selectedTargetIdentity) {
      return null;
    }

    return nodes.find((node) =>
      getNavigationBuilderTargetIdentity(node.target) === selectedTargetIdentity
    ) ?? null;
  }, [nodes, selectedTargetIdentity]);
  const duplicatePath = duplicateNode
    ? getNavigationBuilderNodePath(nodes, duplicateNode.id)
      .map((node) => getNavigationBuilderNodeLabel(node, formViewTargets))
      .join(" > ")
    : "";
  const canAdd = Boolean(
    request &&
    !duplicateNode &&
    (request.kind === "external-link"
      ? isExternalUrlValid && resolvedLabel
      : selectedTargetId),
  );

  function handleTargetChange(value: string) {
    setSelectedTargetId(value);

    if (!request || request.kind === "form-view") {
      setCustomLabel("");
      return;
    }

    const targetLabel =
      navigationBuilderAppPages.find((page) => page.key === value)?.label
      ?? navigationBuilderAppModules.find((appModule) => appModule.key === value)?.label
      ?? "";
    setCustomLabel(targetLabel);
  }

  function handleConfirm() {
    if (!request) {
      return;
    }

    if (request.kind === "form-view" && selectedFormViewTarget) {
      onConfirm({
        kind: "form-view",
        parentId: request.parentId,
        target: selectedFormViewTarget,
      });
      return;
    }

    if (request.kind === "app-page" && selectedAppPage && resolvedLabel) {
      onConfirm({
        kind: "app-page",
        label: resolvedLabel,
        page: selectedAppPage,
        parentId: request.parentId,
      });
      return;
    }

    if (request.kind === "app-module" && selectedAppModule && resolvedLabel) {
      onConfirm({
        appModule: selectedAppModule,
        kind: "app-module",
        label: resolvedLabel,
        parentId: request.parentId,
      });
      return;
    }

    if (request.kind === "external-link" && isExternalUrlValid && resolvedLabel) {
      onConfirm({
        kind: "external-link",
        label: resolvedLabel,
        parentId: request.parentId,
        url: trimmedExternalUrl,
      });
    }
  }

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        onCancel();
      }
    }} open={Boolean(request)}>
      <DialogContent className="tenant-web__navigation-builder-add-dialog">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="tenant-web__navigation-builder-dialog-stack">
            {request?.kind === "external-link" ? (
              <label className="tenant-web__navigation-builder-field">
                <span>{copy.pickerLabel}</span>
                <Input
                  onChange={(event) => setExternalUrl(event.target.value)}
                  placeholder={copy.placeholder}
                  type="url"
                  value={externalUrl}
                />
              </label>
            ) : (
              <label className="tenant-web__navigation-builder-field">
                <span>{copy.pickerLabel}</span>
                <Combobox
                  disabled={request?.kind === "form-view" && formViewTargets.length === 0}
                  emptyLabel="No matching targets"
                  label={copy.pickerLabel}
                  onValueChange={(value) => handleTargetChange(value ?? "")}
                  options={pickerOptions}
                  placeholder={
                    request?.kind === "form-view" && formViewTargets.length === 0
                      ? "No Form Builder views loaded"
                      : copy.placeholder
                  }
                  searchInputAriaLabel={`Search ${copy.pickerLabel}`}
                  searchPlaceholder={`Search ${copy.pickerLabel.toLowerCase()}`}
                  selectionMode="single"
                  triggerAriaLabel={copy.pickerLabel}
                  value={selectedTargetId || null}
                />
              </label>
            )}

            <label className="tenant-web__navigation-builder-field">
              <span>Menu label</span>
              <Input
                disabled={request?.kind === "form-view" || (
                  request?.kind === "external-link" ? !hasExternalUrl : !selectedTargetId
                )}
                onChange={(event) => setCustomLabel(event.target.value)}
                placeholder={request?.kind === "form-view" ? "Uses selected View title" : "Menu label"}
                value={request?.kind === "form-view" ? selectedLabel : customLabel}
              />
            </label>

            {request?.kind === "external-link" && hasExternalUrl && !isExternalUrlValid ? (
              <p className="tenant-web__platform-studio-inline-help tenant-web__navigation-builder-dialog-warning">
                Use a full http or https URL.
              </p>
            ) : null}

            {duplicateNode ? (
              <p className="tenant-web__platform-studio-inline-help tenant-web__navigation-builder-dialog-warning">
                This target is already in {duplicatePath}.
              </p>
            ) : null}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button disabled={!canAdd} onClick={handleConfirm}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
