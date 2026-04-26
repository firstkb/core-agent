import {
  Input,
  Label,
  Switch,
  Textarea,
} from "@platform/ui-kit";

export type ViewSettingsRootLabels = {
  activeView: string;
  correctiveAction: string;
  correctiveActionSource: string;
  defaultViewStructureOnlyNotice: string;
  locked: string;
  modelLock: string;
  unbound: string;
  unlocked: string;
  viewActive: string;
  viewDescription: string;
  viewInactive: string;
  viewLock: string;
  viewTitle: string;
  workflowSection: string;
};

export function RootViewDetailsSection({
  canEditSettings,
  labels,
  onViewDescriptionChange,
  onViewTitleChange,
  viewDescription,
  viewTitle,
}: {
  canEditSettings: boolean;
  labels: Pick<ViewSettingsRootLabels, "viewDescription" | "viewTitle">;
  onViewDescriptionChange: (description: string) => void;
  onViewTitleChange: (title: string) => void;
  viewDescription: string;
  viewTitle: string;
}) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-form">
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-view-title">
            {labels.viewTitle}
          </Label>
          <Input
            disabled={!canEditSettings}
            id="tenant-platform-studio-view-title"
            onChange={(event) => onViewTitleChange(event.target.value)}
            value={viewTitle}
          />
        </div>

        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-view-description">
            {labels.viewDescription}
          </Label>
          <Textarea
            disabled={!canEditSettings}
            id="tenant-platform-studio-view-description"
            onChange={(event) => onViewDescriptionChange(event.target.value)}
            rows={5}
            value={viewDescription}
          />
        </div>
      </div>
    </div>
  );
}

export function AuthoringLocksSection({
  canEditSettings,
  canToggleModelLocks,
  canToggleViewLocks,
  isRootActor,
  isStaticModel,
  labels,
  modelStructureLocked,
  onModelStructureLockedChange,
  onViewActiveChange,
  onViewLockedChange,
  viewActive,
  viewLocked,
}: {
  canEditSettings: boolean;
  canToggleModelLocks: boolean;
  canToggleViewLocks: boolean;
  isRootActor: boolean;
  isStaticModel: boolean;
  labels: Pick<ViewSettingsRootLabels, "activeView" | "defaultViewStructureOnlyNotice" | "locked" | "modelLock" | "unlocked" | "viewActive" | "viewInactive" | "viewLock">;
  modelStructureLocked: boolean;
  onModelStructureLockedChange: (checked: boolean) => void;
  onViewActiveChange: (checked: boolean) => void;
  onViewLockedChange: (checked: boolean) => void;
  viewActive: boolean;
  viewLocked: boolean;
}) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{labels.activeView}</span>
      </div>
      <div className="tenant-web__platform-studio-builder-stack">
        <SwitchRow
          checked={viewActive}
          disabled={!canEditSettings}
          label={labels.activeView}
          offSummary={labels.viewInactive}
          onChange={onViewActiveChange}
          onSummary={labels.viewActive}
        />
        {isRootActor ? (
          <>
            {!isStaticModel ? (
              <SwitchRow
                checked={modelStructureLocked}
                disabled={!canToggleModelLocks}
                label={labels.modelLock}
                offSummary={labels.unlocked}
                onChange={onModelStructureLockedChange}
                onSummary={labels.locked}
              />
            ) : null}
            <SwitchRow
              checked={viewLocked}
              disabled={!canToggleViewLocks}
              label={labels.viewLock}
              offSummary={labels.unlocked}
              onChange={onViewLockedChange}
              onSummary={labels.locked}
            />
            {!canToggleModelLocks ? (
              <p className="tenant-web__platform-studio-inline-help">
                {labels.defaultViewStructureOnlyNotice}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function WorkflowSection({
  canEditSettings,
  correctiveActionEnabled,
  labels,
  onCorrectiveActionChange,
}: {
  canEditSettings: boolean;
  correctiveActionEnabled: boolean;
  labels: Pick<ViewSettingsRootLabels, "correctiveAction" | "correctiveActionSource" | "unbound" | "workflowSection">;
  onCorrectiveActionChange: (checked: boolean) => void;
}) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{labels.workflowSection}</span>
      </div>
      <div className="tenant-web__platform-studio-builder-stack">
        <SwitchRow
          checked={correctiveActionEnabled}
          disabled={!canEditSettings}
          label={labels.correctiveAction}
          offSummary={labels.unbound}
          onChange={onCorrectiveActionChange}
          onSummary={labels.correctiveActionSource}
        />
      </div>
    </div>
  );
}

function SwitchRow({
  checked,
  disabled,
  label,
  offSummary,
  onChange,
  onSummary,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  offSummary: string;
  onChange: (checked: boolean) => void;
  onSummary: string;
}) {
  return (
    <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain">
      <div>
        <p className="tenant-web__platform-studio-compact-row-label">
          {label}
        </p>
        <p className="tenant-web__platform-studio-compact-row-summary">
          {checked ? onSummary : offSummary}
        </p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        size="sm"
      />
    </div>
  );
}
