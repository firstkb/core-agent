import { type ReactNode } from "react";

import type { TenantNavigationAccessOption, TenantNavigationAccessOptionsResponse } from "@platform/api-client";
import {
  Button,
  Card,
  CardContent,
  Input,
  RadioGroup,
  RadioGroupItem,
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
  getNavigationBuilderAccessSummary,
  getNavigationBuilderTargetLabel,
  isNavigationBuilderNodeActive,
  isNavigationBuilderRailItemActive,
  navigationBuilderIconOptions,
  navigationBuilderAppModules,
  navigationBuilderAppPages,
  setNavigationBuilderNodeActive,
  setNavigationBuilderRailItemActive,
  type NavigationBuilderAccessPolicy,
  type NavigationBuilderAccessRecipientKind,
  type NavigationBuilderAccessMode,
  type NavigationBuilderChannel,
  type NavigationBuilderFormViewTarget,
  type NavigationBuilderNode,
  type NavigationBuilderNodeStatus,
  type NavigationBuilderRailItem,
} from "../navigation-builder-state";
import { NavigationBuilderIconGlyph } from "./navigation-builder-icons";

type NavigationBuilderInspectorProps = {
  accessOptions: TenantNavigationAccessOptionsResponse;
  accessOptionsError: string | null;
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>;
  isLoadingAccessOptions: boolean;
  node: NavigationBuilderNode | null;
  onAccessChange: (access: NavigationBuilderAccessPolicy) => void;
  onChooseAccessRecipients: (category: NavigationBuilderAccessRecipientKind) => void;
  onDeleteNode: (node: NavigationBuilderNode) => void;
  onNodeChange: (node: NavigationBuilderNode) => void;
  onRailItemChange: (railItem: NavigationBuilderRailItem) => void;
  railItem?: NavigationBuilderRailItem | null;
};

const accessModeLabels: Record<NavigationBuilderAccessMode, string> = {
  "all-authenticated": "Inherits parent",
  "everyone-except": "Everyone except",
  inherit: "Inherits parent",
  "selected-only": "Selected only",
};

const accessModeDescriptions: Record<NavigationBuilderAccessMode, string> = {
  "all-authenticated": "Use the parent rule",
  "everyone-except": "Hide selected recipients",
  inherit: "Use the parent rule",
  "selected-only": "Show selected recipients",
};

const editableAccessModes: NavigationBuilderAccessMode[] = [
  "inherit",
  "selected-only",
  "everyone-except",
];

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

function accessPolicyHasRecipients(access: NavigationBuilderAccessPolicy) {
  return access.users.length > 0 ||
    access.companies.length > 0 ||
    access.companyTypes.length > 0 ||
    access.jobtypes.length > 0;
}

function getAccessRecipientOptions(
  options: TenantNavigationAccessOptionsResponse,
  category: NavigationBuilderAccessRecipientKind,
) {
  return options[category];
}

function formatSelectedAccessLabels(
  ids: ReadonlyArray<string>,
  options: ReadonlyArray<TenantNavigationAccessOption>,
) {
  if (ids.length === 0) {
    return [];
  }

  const labelById = new Map(options.map((option) => [option.id, option.label]));
  return ids.map((id) => labelById.get(id) ?? id);
}

function getAccessRecipientEmptyCopy(category: NavigationBuilderAccessRecipientKind) {
  switch (category) {
    case "companies":
      return "Any company";
    case "companyTypes":
      return "Any company type";
    case "jobtypes":
      return "Any job type";
    case "users":
      return "No direct users";
  }
}

function setAccessMode(
  access: NavigationBuilderAccessPolicy,
  mode: NavigationBuilderAccessMode,
): NavigationBuilderAccessPolicy {
  return {
    ...access,
    mode,
  };
}

function getVisibleAccessMode(mode: NavigationBuilderAccessMode) {
  return mode === "all-authenticated" ? "inherit" : mode;
}

function AccessModePicker({
  access,
  disabled,
  onChange,
}: {
  access: NavigationBuilderAccessPolicy;
  disabled: boolean;
  onChange: (access: NavigationBuilderAccessPolicy) => void;
}) {
  const selectedMode = getVisibleAccessMode(access.mode);

  return (
    <RadioGroup aria-label="Access strategy" className="tenant-web__navigation-builder-access-mode-grid">
      {editableAccessModes.map((mode) => (
        <label
          className={`tenant-web__navigation-builder-access-mode${disabled ? " tenant-web__navigation-builder-access-option--disabled" : ""}`}
          key={mode}
        >
          <RadioGroupItem
            checked={selectedMode === mode}
            disabled={disabled}
            name="navigation-access-mode"
            onChange={() => onChange(setAccessMode(access, mode))}
          />
          <span>
            <strong>{accessModeLabels[mode]}</strong>
            <small>{accessModeDescriptions[mode]}</small>
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}

function AccessRecipientRuleRow({
  access,
  category,
  disabled,
  label,
  onChoose,
  options,
}: {
  access: NavigationBuilderAccessPolicy;
  category: NavigationBuilderAccessRecipientKind;
  disabled: boolean;
  label: string;
  onChoose: (category: NavigationBuilderAccessRecipientKind) => void;
  options: TenantNavigationAccessOptionsResponse;
}) {
  const ids = access[category];
  const labels = formatSelectedAccessLabels(ids, getAccessRecipientOptions(options, category));
  const visibleLabels = labels.slice(0, 3);
  const overflowCount = labels.length - visibleLabels.length;
  const emptyCopy = getAccessRecipientEmptyCopy(category);
  const countCopy = ids.length > 0 ? `${ids.length} selected` : null;

  return (
    <div className={`tenant-web__navigation-builder-access-rule-row tenant-web__navigation-builder-access-rule-row--${category}`}>
      <div className="tenant-web__navigation-builder-access-rule-row-main">
        <div className="tenant-web__navigation-builder-access-rule-row-heading">
          <strong>{label}</strong>
          {countCopy ? (
            <span className="tenant-web__navigation-builder-access-count-chip">{countCopy}</span>
          ) : null}
        </div>
        <div className="tenant-web__navigation-builder-access-chip-row">
          {visibleLabels.length === 0 ? (
            <span className="tenant-web__navigation-builder-access-empty-chip">{emptyCopy}</span>
          ) : visibleLabels.map((value) => (
            <span className="tenant-web__navigation-builder-access-chip" key={value}>{value}</span>
          ))}
          {overflowCount > 0 ? (
            <span className="tenant-web__navigation-builder-access-chip">+{overflowCount}</span>
          ) : null}
        </div>
      </div>
      <Button
        disabled={disabled}
        onClick={() => onChoose(category)}
        size="sm"
        variant="outline"
      >
        Choose {label.toLowerCase()}
      </Button>
    </div>
  );
}

function AccessRuleOperator({ children }: { children: ReactNode }) {
  return (
    <div className="tenant-web__navigation-builder-access-rule-operator">
      <span>{children}</span>
    </div>
  );
}

function AccessEditor({
  access,
  canEdit,
  isLoadingOptions,
  onAccessChange,
  onChooseRecipients,
  options,
  optionsError,
}: {
  access: NavigationBuilderAccessPolicy;
  canEdit: boolean;
  isLoadingOptions: boolean;
  onAccessChange: (access: NavigationBuilderAccessPolicy) => void;
  onChooseRecipients: (category: NavigationBuilderAccessRecipientKind) => void;
  options: TenantNavigationAccessOptionsResponse;
  optionsError: string | null;
}) {
  const showsRule = access.mode === "selected-only" || access.mode === "everyone-except";
  const hasRecipients = accessPolicyHasRecipients(access);
  const effectiveSummary = access.mode === "all-authenticated"
    ? "Uses app default access"
    : getNavigationBuilderAccessSummary(access);
  const effectiveHint = access.mode === "selected-only"
    ? "Visible only when one direct user or audience rule branch matches."
    : access.mode === "everyone-except"
      ? "Visible unless one direct user or audience rule branch matches."
      : "Resolved from the nearest parent that defines access.";
  const emptyRecipientCopy = access.mode === "everyone-except"
    ? "Choose who should be excluded."
    : "Choose who can see this item.";

  return (
    <div className="tenant-web__navigation-builder-field-stack">
      <ElementSection title="Strategy">
        <AccessModePicker
          access={access}
          disabled={!canEdit}
          onChange={onAccessChange}
        />
      </ElementSection>

      {!showsRule ? (
        <div className="tenant-web__navigation-builder-access-effective">
          <span>Effective access</span>
          <strong>{effectiveSummary}</strong>
          <small>{effectiveHint}</small>
        </div>
      ) : null}

      {showsRule ? (
        <ElementSection title="Recipients">
          <div className="tenant-web__navigation-builder-access-inline-summary">
            <strong>{effectiveSummary}</strong>
            <span>{effectiveHint}</span>
          </div>
          <div className="tenant-web__navigation-builder-access-expression" aria-label="Access recipient rule">
            <span>Users</span>
            <strong>OR</strong>
            <span>(Companies OR company types) AND job types</span>
          </div>
          <div className="tenant-web__navigation-builder-access-rule-board">
            <div className="tenant-web__navigation-builder-access-rule-card tenant-web__navigation-builder-access-rule-card--users">
              <div className="tenant-web__navigation-builder-access-rule-card-header">
                <strong>Direct users</strong>
                <span>Specific people</span>
              </div>
              <AccessRecipientRuleRow
                access={access}
                category="users"
                disabled={!canEdit || isLoadingOptions}
                label="Users"
                onChoose={onChooseRecipients}
                options={options}
              />
            </div>

            <AccessRuleOperator>OR</AccessRuleOperator>

            <div className="tenant-web__navigation-builder-access-rule-card tenant-web__navigation-builder-access-rule-card--audience">
              <div className="tenant-web__navigation-builder-access-rule-card-header">
                <strong>Audience rule</strong>
                <span>Company scope plus role</span>
              </div>
              <AccessRecipientRuleRow
                access={access}
                category="companies"
                disabled={!canEdit || isLoadingOptions}
                label="Companies"
                onChoose={onChooseRecipients}
                options={options}
              />
              <AccessRuleOperator>OR</AccessRuleOperator>
              <AccessRecipientRuleRow
                access={access}
                category="companyTypes"
                disabled={!canEdit || isLoadingOptions}
                label="Company types"
                onChoose={onChooseRecipients}
                options={options}
              />
              <AccessRuleOperator>AND</AccessRuleOperator>
              <AccessRecipientRuleRow
                access={access}
                category="jobtypes"
                disabled={!canEdit || isLoadingOptions}
                label="Job types"
                onChoose={onChooseRecipients}
                options={options}
              />
            </div>
          </div>
          {!hasRecipients ? (
            <p className="tenant-web__navigation-builder-access-validation">
              {emptyRecipientCopy}
            </p>
          ) : null}
        </ElementSection>
      ) : null}

      {isLoadingOptions ? (
        <p className="tenant-web__platform-studio-inline-help">
          <span>Loading recipient lists...</span>
        </p>
      ) : null}

      {optionsError ? (
        <p className="tenant-web__platform-studio-inline-help">
          <WarningTriangleIcon />
          <span>{optionsError}</span>
        </p>
      ) : null}
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
  const selectedIconKey = node.iconKey ?? "none";

  return (
    <div className="tenant-web__navigation-builder-icon-grid">
      <button
        aria-pressed={selectedIconKey === "none"}
        className={`tenant-web__navigation-builder-icon-option${selectedIconKey === "none" ? " tenant-web__navigation-builder-icon-option--active" : ""}`}
        onClick={() => onNodeChange({ ...node, iconKey: undefined })}
        type="button"
      >
        <span className="tenant-web__navigation-builder-icon-option-glyph tenant-web__navigation-builder-icon-option-glyph--none" />
        <span>None</span>
      </button>
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
  return !node.isLocked && node.kind !== "section";
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
  accessOptions,
  accessOptionsError,
  formViewTargets,
  isLoadingAccessOptions,
  node,
  onAccessChange,
  onChooseAccessRecipients,
  onDeleteNode,
  onNodeChange,
  onRailItemChange,
  railItem,
}: NavigationBuilderInspectorProps) {
  if (railItem) {
    const isRailItemActive = isNavigationBuilderRailItemActive(railItem);

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
                      <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__navigation-builder-active-row">
                        <span className="tenant-web__navigation-builder-active-copy">
                          <span>Show in utility rail</span>
                          <small>{isRailItemActive ? "Visible in utility rail" : "Hidden from utility rail"}</small>
                        </span>
                        <Switch
                          checked={isRailItemActive}
                          onCheckedChange={(checked) =>
                            onRailItemChange(setNavigationBuilderRailItemActive(railItem, checked))}
                          size="sm"
                        />
                      </div>
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
                  <AccessEditor
                    access={railItem.access}
                    canEdit
                    isLoadingOptions={isLoadingAccessOptions}
                    onAccessChange={onAccessChange}
                    onChooseRecipients={onChooseAccessRecipients}
                    options={accessOptions}
                    optionsError={accessOptionsError}
                  />
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
                <AccessEditor
                  access={node.access}
                  canEdit={canEditAccess}
                  isLoadingOptions={isLoadingAccessOptions}
                  onAccessChange={onAccessChange}
                  onChooseRecipients={onChooseAccessRecipients}
                  options={accessOptions}
                  optionsError={accessOptionsError}
                />
              </TabsPanel>

            </div>
          </PlatformStudioPanelScroll>
        </Tabs>
      </CardContent>
    </Card>
  );
}
