import { type ReactNode } from "react";

import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Switch,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  WarningTriangleIcon,
} from "@platform/ui-kit";

import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import {
  getNavigationBuilderNodeLabel,
  getNavigationBuilderTargetLabel,
  isNavigationBuilderNodeActive,
  navigationBuilderIconOptions,
  navigationBuilderAppModules,
  navigationBuilderAppPages,
  setNavigationBuilderNodeActive,
  type NavigationBuilderAccessMode,
  type NavigationBuilderChannel,
  type NavigationBuilderFormViewTarget,
  type NavigationBuilderNode,
  type NavigationBuilderNodeStatus,
  type NavigationBuilderRailItem,
} from "../navigation-builder-state";
import { NavigationBuilderIconGlyph } from "./navigation-builder-icons";

type NavigationBuilderInspectorProps = {
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>;
  node: NavigationBuilderNode | null;
  onConfigureAccess: () => void;
  onDeleteNode: (node: NavigationBuilderNode) => void;
  onNodeChange: (node: NavigationBuilderNode) => void;
  railItem?: NavigationBuilderRailItem | null;
};

const accessModeLabels: Record<NavigationBuilderAccessMode, string> = {
  "all-authenticated": "All authenticated users",
  "custom-preview": "Custom access preview",
  inherit: "Inherits parent access",
};

const statusLabels: Record<NavigationBuilderNodeStatus, string> = {
  broken: "Broken target",
  hidden: "Hidden",
  restricted: "Restricted",
  visible: "Visible",
};

const channelLabels: Record<NavigationBuilderChannel, string> = {
  all: "All channels",
  web: "Web",
};

function getStatusLabel(node: NavigationBuilderNode) {
  if (!isNavigationBuilderNodeActive(node)) {
    return "Hidden from app menu";
  }

  return statusLabels[node.status];
}

function ElementSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="tenant-web__navigation-builder-element-section">
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function getNodeKindLabel(node: NavigationBuilderNode) {
  switch (node.kind) {
    case "locked-dashboard":
      return "Always shown";
    case "app-module":
      return "Module";
    case "menu-group":
      return "Menu group";
    case "section":
      return "Menu title";
    case "entry":
      if (node.target?.kind === "form-view" || node.targetKind === "form-view") {
        return "Form view";
      }
      if (node.target?.kind === "app-page" || node.targetKind === "app-page") {
        return "App page";
      }
      if (node.target?.kind === "app-module" || node.targetKind === "app-module") {
        return "App module";
      }
      if (node.target?.kind === "external-link" || node.targetKind === "external-link") {
        return "External link";
      }
      return "Entry";
  }
}

function getTargetSummaryHint(node: NavigationBuilderNode) {
  const targetKind = node.target?.kind ?? node.targetKind;

  switch (targetKind) {
    case "form-view":
      return "Form Builder view";
    case "app-page":
      return "Static app page";
    case "external-link":
      return "External link";
    case "app-module":
      return "Planned app module";
    default:
      return "No runtime screen";
  }
}

function getNodeHelperCopy(node: NavigationBuilderNode) {
  if (node.description) {
    return node.description;
  }

  switch (node.kind) {
    case "section":
      return "Root-only text divider. It does not open a screen, show an icon, or carry access rules.";
    case "menu-group":
      return "Container for nested menu items. It does not open its own screen.";
    case "app-module":
      if (node.target?.kind === "app-module" || node.targetKind === "app-module") {
        return "Future app module target. Module pages are represented in V1 but not active yet.";
      }

      return "Module container for nested app menu items.";
    case "entry":
    case "locked-dashboard":
      return "";
  }
}

function TargetFields({
  formViewTargets,
  isLocked,
  node,
  onNodeChange,
}: {
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>;
  isLocked: boolean;
  node: NavigationBuilderNode;
  onNodeChange: (node: NavigationBuilderNode) => void;
}) {
  const targetKind = node.target?.kind ?? node.targetKind;
  const selectedFormViewValue = node.target?.kind === "form-view"
    ? `${node.target.modelId}:${node.target.viewId}`
    : "";
  const selectedFormViewOptionExists = Boolean(
    selectedFormViewValue &&
    formViewTargets.some((target) => target.id === selectedFormViewValue),
  );

  if (!targetKind) {
    return (
      <div className="tenant-web__navigation-builder-inspector-empty">
        This item organizes the app menu and does not open its own screen.
      </div>
    );
  }

  return (
    <div className="tenant-web__navigation-builder-target-stack">
      {targetKind === "form-view" ? (
        <label className="tenant-web__navigation-builder-field">
          <span>Form view</span>
          <Select
            disabled={isLocked || formViewTargets.length === 0}
            onChange={(event) => {
              const target = formViewTargets.find((candidate) => candidate.id === event.target.value);
              if (!target) {
                return;
              }

              onNodeChange({
                ...node,
                diagnostic: undefined,
                status: "visible",
                target: {
                  kind: "form-view",
                  modelLabel: target.modelLabel,
                  modelId: target.modelId,
                  routePath: target.routePath,
                  targetType: "form_builder_view",
                  viewLabel: target.viewLabel,
                  viewId: target.viewId,
                },
                targetKind: "form-view",
                label: target.viewLabel,
              });
            }}
            value={selectedFormViewValue}
          >
            <option value="">
              {formViewTargets.length === 0 ? "No Form Builder views loaded" : "Select form view"}
            </option>
            {selectedFormViewValue && !selectedFormViewOptionExists ? (
              <option value={selectedFormViewValue}>
                {getNavigationBuilderTargetLabel(node.target, formViewTargets)}
              </option>
            ) : null}
            {formViewTargets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      {targetKind === "app-page" ? (
        <label className="tenant-web__navigation-builder-field">
          <span>App page</span>
          <Select
            disabled={isLocked}
            onChange={(event) => {
              const page = navigationBuilderAppPages.find((candidate) => candidate.key === event.target.value);
              if (!page) {
                return;
              }

              onNodeChange({
                ...node,
                diagnostic: undefined,
                routeKey: page.key,
                status: "visible",
                target: {
                  kind: "app-page",
                  pageKey: page.key,
                  routePath: page.routePath,
                },
                targetKind: "app-page",
              });
            }}
            value={node.target?.kind === "app-page" ? node.target.pageKey : ""}
          >
            <option value="">Select app page</option>
            {navigationBuilderAppPages.map((page) => (
              <option key={page.key} value={page.key}>
                {page.label}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      {targetKind === "external-link" ? (
        <label className="tenant-web__navigation-builder-field">
          <span>External link</span>
          <Input
            disabled={isLocked}
            onChange={(event) => {
              onNodeChange({
                ...node,
                target: {
                  kind: "external-link",
                  url: event.target.value,
                },
                targetKind: "external-link",
              });
            }}
            value={node.target?.kind === "external-link" ? node.target.url : ""}
          />
        </label>
      ) : null}

      {targetKind === "app-module" ? (
        <label className="tenant-web__navigation-builder-field">
          <span>App module</span>
          <Select
            disabled={isLocked}
            onChange={(event) => {
              const module = navigationBuilderAppModules.find((candidate) => candidate.key === event.target.value);
              if (!module) {
                return;
              }

              onNodeChange({
                ...node,
                diagnostic: "App Module targets are planned and preview-only in this version.",
                routeKey: module.key,
                status: "hidden",
                target: {
                  disabled: true,
                  kind: "app-module",
                  moduleKey: module.key,
                },
                targetKind: "app-module",
              });
            }}
            value={node.target?.kind === "app-module" ? node.target.moduleKey : ""}
          >
            <option value="">Select app module</option>
            {navigationBuilderAppModules.map((module) => (
              <option key={module.key} value={module.key}>
                {module.label}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      <div className="tenant-web__navigation-builder-target-summary">
        <span>{getNavigationBuilderTargetLabel(node.target, formViewTargets)}</span>
        <small>{getTargetSummaryHint(node)}</small>
      </div>
    </div>
  );
}

function IconPicker({
  node,
  onNodeChange,
}: {
  node: NavigationBuilderNode;
  onNodeChange: (node: NavigationBuilderNode) => void;
}) {
  const selectedIconKey = node.iconKey ?? (node.kind === "menu-group" ? "folder" : "briefcase");

  return (
    <div className="tenant-web__navigation-builder-icon-grid">
      {navigationBuilderIconOptions.map((option) => {
        const isSelected = option.key === selectedIconKey;

        return (
          <button
            aria-pressed={isSelected}
            className={`tenant-web__navigation-builder-icon-option${isSelected ? " tenant-web__navigation-builder-icon-option--active" : ""}`}
            key={option.key}
            onClick={() => onNodeChange({ ...node, iconKey: option.key })}
            type="button"
          >
            <span className="tenant-web__navigation-builder-icon-option-glyph">
              <NavigationBuilderIconGlyph iconKey={option.key} />
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function shouldShowActiveControl(node: NavigationBuilderNode) {
  return !node.isLocked && node.kind !== "section";
}

function shouldShowIconPicker(node: NavigationBuilderNode) {
  return node.kind === "menu-group" || node.kind === "app-module";
}

function shouldShowTargetSection(node: NavigationBuilderNode) {
  return Boolean(node.target?.kind ?? node.targetKind);
}

function shouldShowChannelSection(node: NavigationBuilderNode) {
  return !node.isLocked && node.kind !== "section";
}

function canConfigureAccess(node: NavigationBuilderNode) {
  return !node.isLocked && node.kind !== "section";
}

function isPlannedAppModuleTarget(node: NavigationBuilderNode) {
  return node.target?.kind === "app-module" && node.target.disabled;
}

export function NavigationBuilderInspector({
  formViewTargets,
  node,
  onConfigureAccess,
  onDeleteNode,
  onNodeChange,
  railItem,
}: NavigationBuilderInspectorProps) {
  if (railItem) {
    return (
      <Card className="tenant-web__platform-studio-panel tenant-web__navigation-builder-panel">
        <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split tenant-web__navigation-builder-inspector-content">
          <Tabs defaultValue="element" variant="surface">
            <div className="tenant-web__platform-studio-panel-static">
              <div className="tenant-web__platform-studio-inspector-tabs tenant-web__navigation-builder-inspector-tabs">
                <TabsList>
                  <TabsTrigger value="element">Element</TabsTrigger>
                  <TabsTrigger value="access">Access</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <PlatformStudioPanelScroll>
              <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
                <TabsPanel value="element">
                  <div className="tenant-web__navigation-builder-field-stack">
                    <ElementSection title="Utility">
                      <label className="tenant-web__navigation-builder-field">
                        <span>Label</span>
                        <Input
                          disabled
                          value={railItem.label}
                        />
                      </label>
                      <div className="tenant-web__navigation-builder-readonly-grid">
                        <div>
                          <span>Type</span>
                          <strong>Utility rail item</strong>
                        </div>
                        <div>
                          <span>Status</span>
                          <strong>{statusLabels[railItem.status]}</strong>
                        </div>
                      </div>
                      <p className="tenant-web__navigation-builder-muted-copy">
                        {railItem.description}
                      </p>
                    </ElementSection>

                    <ElementSection title="Channel">
                      <label className="tenant-web__navigation-builder-field">
                        <span>Available in</span>
                        <Input
                          disabled
                          value={channelLabels[railItem.channel]}
                        />
                      </label>
                    </ElementSection>

                  </div>
                </TabsPanel>

                <TabsPanel value="access">
                  <div className="tenant-web__navigation-builder-field-stack">
                    <div className="tenant-web__navigation-builder-access-summary">
                      <span>{accessModeLabels[railItem.accessMode]}</span>
                      <strong>{railItem.accessSummary}</strong>
                    </div>
                    <Button
                      onClick={onConfigureAccess}
                      variant="outline"
                    >
                      Configure access preview
                    </Button>
                    <p className="tenant-web__platform-studio-inline-help">
                      <WarningTriangleIcon />
                      <span>Utility rail access is preview-only in V1. Backend route/API enforcement is not active yet.</span>
                    </p>
                  </div>
                </TabsPanel>

              </div>
            </PlatformStudioPanelScroll>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  if (!node) {
    return (
      <Card className="tenant-web__platform-studio-panel tenant-web__navigation-builder-panel">
        <CardContent className="tenant-web__platform-studio-panel-content tenant-web__navigation-builder-inspector-content">
          <div className="tenant-web__navigation-builder-inspector-empty">
            Select an app menu item to edit it.
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLocked = Boolean(node.isLocked);
  const isActive = isNavigationBuilderNodeActive(node);
  const nodeLabel = getNavigationBuilderNodeLabel(node, formViewTargets);
  const targetKind = node.target?.kind ?? node.targetKind;
  const isFormViewElement = targetKind === "form-view";
  const helperCopy = getNodeHelperCopy(node);
  const hasWarnings = Boolean(node.diagnostic || node.status === "broken");
  const showActiveControl = shouldShowActiveControl(node);
  const showIconPicker = shouldShowIconPicker(node);
  const showTargetSection = shouldShowTargetSection(node);
  const showChannelSection = shouldShowChannelSection(node);
  const canEditAccess = canConfigureAccess(node);
  const isPlannedAppModule = isPlannedAppModuleTarget(node);

  return (
    <Card className="tenant-web__platform-studio-panel tenant-web__navigation-builder-panel">
      <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split tenant-web__navigation-builder-inspector-content">
        <Tabs defaultValue="element" variant="surface">
          <div className="tenant-web__platform-studio-panel-static">
            <div className="tenant-web__platform-studio-inspector-tabs tenant-web__navigation-builder-inspector-tabs">
              <TabsList>
                <TabsTrigger value="element">Element</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <PlatformStudioPanelScroll>
            <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
              <TabsPanel value="element">
                <div className="tenant-web__navigation-builder-field-stack">
                  <div className="tenant-web__navigation-builder-element-section">
                    <label className="tenant-web__navigation-builder-field">
                      <span>Label</span>
                      <Input
                        disabled={isLocked || isFormViewElement}
                        onChange={(event) => onNodeChange({ ...node, label: event.target.value })}
                        placeholder={isFormViewElement ? "Select a form view to set label" : undefined}
                        value={isFormViewElement ? nodeLabel : node.label}
                      />
                    </label>
                    <div className="tenant-web__navigation-builder-readonly-grid">
                      <div>
                        <span>Type</span>
                        <strong>{getNodeKindLabel(node)}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong>{getStatusLabel(node)}</strong>
                      </div>
                    </div>
                    {helperCopy ? (
                      <p className="tenant-web__navigation-builder-muted-copy">
                        {helperCopy}
                      </p>
                    ) : null}
                    {showActiveControl ? (
                      <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__navigation-builder-active-row">
                        <span className="tenant-web__navigation-builder-active-copy">
                          <span>Show in app menu</span>
                          <small>
                            {isPlannedAppModule
                              ? "Hidden until app module routes ship"
                              : isActive ? "Visible in app menu" : "Hidden from app menu"}
                          </small>
                        </span>
                        <Switch
                          checked={isActive}
                          disabled={isPlannedAppModule}
                          onCheckedChange={(checked) =>
                            onNodeChange(setNavigationBuilderNodeActive(node, checked))}
                          size="sm"
                        />
                      </div>
                    ) : null}
                  </div>

                  {showIconPicker ? (
                    <ElementSection title="Icon">
                      <IconPicker node={node} onNodeChange={onNodeChange} />
                    </ElementSection>
                  ) : null}

                  {showTargetSection ? (
                    <ElementSection title="Opens">
                      <TargetFields
                        formViewTargets={formViewTargets}
                        isLocked={isLocked}
                        node={node}
                        onNodeChange={onNodeChange}
                      />
                    </ElementSection>
                  ) : null}

                  {showChannelSection ? (
                    <ElementSection title="Channel">
                      <label className="tenant-web__navigation-builder-field">
                        <span>Available in</span>
                        <Select
                          onChange={(event) => {
                            onNodeChange({
                              ...node,
                              channel: event.target.value as NavigationBuilderChannel,
                            });
                          }}
                          value={node.channel}
                        >
                          <option value="web">Web</option>
                          <option value="all">All channels</option>
                        </Select>
                      </label>
                    </ElementSection>
                  ) : null}

                  {hasWarnings ? (
                    <ElementSection title="Warnings">
                      <div className="tenant-web__navigation-builder-field-stack tenant-web__navigation-builder-field-stack--tight">
                        {node.diagnostic ? (
                          <p className="tenant-web__platform-studio-inline-help">
                            <WarningTriangleIcon />
                            <span>{node.diagnostic}</span>
                          </p>
                        ) : null}
                        {node.status === "broken" && !node.diagnostic ? (
                          <p className="tenant-web__platform-studio-inline-help">
                            <WarningTriangleIcon />
                            <span>Select a target before saving this item.</span>
                          </p>
                        ) : null}
                      </div>
                    </ElementSection>
                  ) : null}

                  {!isLocked ? (
                    <div className="tenant-web__platform-studio-inspector-section">
                      <div className="tenant-web__platform-studio-danger-zone">
                        <Button
                          onClick={() => onDeleteNode(node)}
                          variant="danger"
                        >
                          Delete item
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </TabsPanel>

              <TabsPanel value="access">
                <div className="tenant-web__navigation-builder-field-stack">
                  <div className="tenant-web__navigation-builder-access-summary">
                    <span>{accessModeLabels[node.accessMode]}</span>
                    <strong>{node.accessSummary}</strong>
                  </div>
                  <Button
                    disabled={!canEditAccess}
                    onClick={onConfigureAccess}
                    variant="outline"
                  >
                    Configure access preview
                  </Button>
                  <p className="tenant-web__platform-studio-inline-help">
                    <WarningTriangleIcon />
                    <span>Access is preview-only in V1. Backend route/API enforcement is not active yet.</span>
                  </p>
                </div>
              </TabsPanel>

            </div>
          </PlatformStudioPanelScroll>
        </Tabs>
      </CardContent>
    </Card>
  );
}
