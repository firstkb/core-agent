import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
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
  "app-module" | "app-page" | "form-view"
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
};

export function NavigationBuilderAddDialog({
  formViewTargets,
  nodes,
  onCancel,
  onConfirm,
  request,
}: NavigationBuilderAddDialogProps) {
  const [customLabel, setCustomLabel] = useState("");
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

  useEffect(() => {
    setCustomLabel("");
    setSelectedTargetId("");
  }, [request]);

  const selectedLabel =
    selectedFormViewTarget?.viewLabel
    ?? selectedAppPage?.label
    ?? selectedAppModule?.label
    ?? "";
  const resolvedLabel = customLabel.trim() || selectedLabel;
  const selectedTargetIdentity = useMemo(() => {
    if (!request) {
      return "";
    }

    if (request.kind === "form-view" && selectedFormViewTarget) {
      return getNavigationBuilderTargetIdentity({
        kind: "form-view",
        modelId: selectedFormViewTarget.modelId,
        routePath: selectedFormViewTarget.routePath,
        targetType: "form_builder_view",
        viewId: selectedFormViewTarget.viewId,
      });
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

    return "";
  }, [request, selectedAppModule, selectedAppPage, selectedFormViewTarget]);
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
  const canAdd = Boolean(request && selectedTargetId && !duplicateNode);

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
            <label className="tenant-web__navigation-builder-field">
              <span>{copy.pickerLabel}</span>
              <Select
                disabled={request?.kind === "form-view" && formViewTargets.length === 0}
                onChange={(event) => handleTargetChange(event.target.value)}
                value={selectedTargetId}
              >
                <option value="">
                  {request?.kind === "form-view" && formViewTargets.length === 0
                    ? "No Form Builder views loaded"
                    : copy.placeholder}
                </option>
                {request?.kind === "form-view" ? (
                  formViewTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.label}
                    </option>
                  ))
                ) : null}
                {request?.kind === "app-page" ? (
                  navigationBuilderAppPages.map((page) => (
                    <option key={page.key} value={page.key}>
                      {page.label}
                    </option>
                  ))
                ) : null}
                {request?.kind === "app-module" ? (
                  navigationBuilderAppModules.map((appModule) => (
                    <option key={appModule.key} value={appModule.key}>
                      {appModule.label}
                    </option>
                  ))
                ) : null}
              </Select>
            </label>

            <label className="tenant-web__navigation-builder-field">
              <span>Menu label</span>
              <Input
                disabled={!selectedTargetId || request?.kind === "form-view"}
                onChange={(event) => setCustomLabel(event.target.value)}
                placeholder={request?.kind === "form-view" ? "Uses selected View title" : "Menu label"}
                value={request?.kind === "form-view" ? selectedLabel : customLabel}
              />
            </label>

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
