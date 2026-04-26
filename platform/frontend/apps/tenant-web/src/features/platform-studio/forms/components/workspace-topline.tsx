import {
  Badge,
  Button,
  StarIcon,
} from "@platform/ui-kit";

type WorkspaceToplineLabels = {
  backToModel: string;
  canEditViewsOnly: string;
  debugAction: string;
  defaultView: string;
  saveAction: string;
  savedAction: string;
  savingAction: string;
  structureLocked: string;
  syncingDraft: string;
  viewLocked: string;
};

type WorkspaceToplineProps = {
  canEditViewsOnly: boolean;
  draftSyncError: string | null;
  isDefaultView: boolean;
  isDraftSyncing: boolean;
  isRootActor: boolean;
  isSavingDraft: boolean;
  isSaveButtonDisabled: boolean;
  isStructureLocked: boolean;
  isViewLocked: boolean;
  labels: WorkspaceToplineLabels;
  modelTitle: string;
  onBackToModel: () => void;
  onDebugOpen: () => void;
  onSave: () => void;
  savePulse: boolean;
};

export function WorkspaceTopline({
  canEditViewsOnly,
  draftSyncError,
  isDefaultView,
  isDraftSyncing,
  isRootActor,
  isSavingDraft,
  isSaveButtonDisabled,
  isStructureLocked,
  isViewLocked,
  labels,
  modelTitle,
  onBackToModel,
  onDebugOpen,
  onSave,
  savePulse,
}: WorkspaceToplineProps) {
  return (
    <div className="tenant-web__platform-studio-workspace-topline">
      <div className="tenant-web__platform-studio-panel-actions tenant-web__platform-studio-panel-actions--workspace-primary">
        <Button
          leadingIcon={<BackArrowIcon />}
          onClick={onBackToModel}
          variant="ghost"
        >
          {labels.backToModel}
        </Button>
        {isRootActor ? (
          <Button
            onClick={onDebugOpen}
            size="sm"
            variant="outline"
          >
            {labels.debugAction}
          </Button>
        ) : null}
        <Button
          disabled={isSaveButtonDisabled}
          onClick={onSave}
          size="sm"
          variant={savePulse ? "secondary" : "primary"}
        >
          {savePulse
            ? labels.savedAction
            : isSavingDraft
              ? labels.savingAction
              : labels.saveAction}
        </Button>
      </div>
      <div className="tenant-web__platform-studio-badge-row">
        <Badge appearance="soft" size="sm" variant="brand">
          {modelTitle}
        </Badge>
        {isDefaultView ? (
          <Badge appearance="soft" size="sm" variant="brand">
            <span className="tenant-web__platform-studio-badge-label">
              <StarIcon
                aria-hidden="true"
                className="tenant-web__platform-studio-badge-icon"
              />
              {labels.defaultView}
            </span>
          </Badge>
        ) : null}
        {isDraftSyncing ? (
          <Badge appearance="soft" size="sm" variant="info">
            {labels.syncingDraft}
          </Badge>
        ) : null}
        {draftSyncError ? (
          <Badge appearance="soft" size="sm" variant="warning">
            {draftSyncError}
          </Badge>
        ) : null}
        {isStructureLocked ? (
          <Badge appearance="soft" size="sm" variant="warning">
            {labels.structureLocked}
          </Badge>
        ) : null}
        {isViewLocked ? (
          <Badge appearance="soft" size="sm" variant="warning">
            {labels.viewLocked}
          </Badge>
        ) : null}
        {canEditViewsOnly ? (
          <Badge appearance="soft" size="sm" variant="info">
            {labels.canEditViewsOnly}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function BackArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="tenant-web__platform-studio-back-icon"
      fill="none"
      height="16"
      viewBox="0 0 20 20"
      width="16"
    >
      <path
        d="M10.5 5.5 6 10l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 5.5 2 10l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
