import { type LookupSourceModelOption } from "../controller/form-builder-workspace-lookup-options";
import { type FormBuilderLookupSourcePickerState } from "../controller/form-builder-workspace-lookup-source-picker";
import {
  type LookupSourcePickerModelItem,
  LookupSourcePickerDialog,
} from "./lookup-source-picker-dialog";
import { DebugDialog } from "./debug-dialog";
import { DeleteNodeConfirmationDialog } from "./delete-node-confirmation-dialog";
import { UnsavedLeaveConfirmationDialog } from "./unsaved-leave-confirmation-dialog";
import { type WorkspaceDialogTranslate } from "./workspace-dialog-types";

export type WorkspaceDeleteNodeDialogProps = {
  deleteNodeOpen: boolean;
  onConfirmDeleteNode: () => void;
  onDeleteNodeOpenChange: (open: boolean) => void;
  selectedNodeLabel: string;
  t: WorkspaceDialogTranslate;
};

export type WorkspaceLookupSourceDialogProps = {
  canEditSettings: boolean;
  closeLookupSourcePicker: () => void;
  isLookupSourcePickerLoading: boolean;
  lookupSourcePicker: FormBuilderLookupSourcePickerState | null;
  lookupSourcePickerError: string | null;
  lookupSourcePickerModel: LookupSourceModelOption | null;
  lookupSourcePickerModelItems: ReadonlyArray<LookupSourcePickerModelItem>;
  lookupSourcePickerSelectedFieldsSummary: string;
  onLookupSourcePickerActiveFilterChange: (enabled: boolean) => void;
  onLookupSourcePickerFieldCheckedChange: (fieldKey: string, checked: boolean) => void;
  onLookupSourcePickerModelChange: (
    modelId: string,
    selectedFieldKeys: ReadonlyArray<string>,
    sortFieldKey: string,
    activeFilterEnabled: boolean,
  ) => void;
  onLookupSourcePickerOpenChange: (open: boolean) => void;
  onLookupSourcePickerSortFieldChange: (fieldKey: string) => void;
  onSaveLookupSourcePicker: () => void;
  t: WorkspaceDialogTranslate;
};

export type WorkspaceSupportDialogsProps = {
  debugCompiledRuntime: string;
  debugDataSchema: string;
  debugOpen: boolean;
  debugUiSchema: string;
  leaveConfirmOpen: boolean;
  onDebugOpenChange: (open: boolean) => void;
  onLeaveConfirmOpenChange: (open: boolean) => void;
  onResolveLeaveConfirmation: (confirmed: boolean) => void;
  t: WorkspaceDialogTranslate;
};

export function WorkspaceDeleteNodeDialog({
  deleteNodeOpen,
  onConfirmDeleteNode,
  onDeleteNodeOpenChange,
  selectedNodeLabel,
  t,
}: WorkspaceDeleteNodeDialogProps) {
  return (
    <DeleteNodeConfirmationDialog
      cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
      confirmLabel={t("tenant.platformStudio.forms.builder.deleteNode")}
      description={t("tenant.platformStudio.forms.builder.confirmDeleteNodeDescription", { title: selectedNodeLabel })}
      onConfirm={onConfirmDeleteNode}
      onOpenChange={onDeleteNodeOpenChange}
      open={deleteNodeOpen}
      title={t("tenant.platformStudio.forms.builder.confirmDeleteNode", { title: selectedNodeLabel })}
    />
  );
}

export function WorkspaceLookupSourceDialog({
  canEditSettings,
  closeLookupSourcePicker,
  isLookupSourcePickerLoading,
  lookupSourcePicker,
  lookupSourcePickerError,
  lookupSourcePickerModel,
  lookupSourcePickerModelItems,
  lookupSourcePickerSelectedFieldsSummary,
  onLookupSourcePickerActiveFilterChange,
  onLookupSourcePickerFieldCheckedChange,
  onLookupSourcePickerModelChange,
  onLookupSourcePickerOpenChange,
  onLookupSourcePickerSortFieldChange,
  onSaveLookupSourcePicker,
  t,
}: WorkspaceLookupSourceDialogProps) {
  return (
    <LookupSourcePickerDialog
      activeFilterEnabled={lookupSourcePicker?.activeFilterEnabled ?? false}
      canEdit={canEditSettings}
      error={lookupSourcePickerError}
      isLoading={isLookupSourcePickerLoading}
      labels={{
        availableFields: t("tenant.platformStudio.forms.builder.fieldSettings.availableFields"),
        availableFieldsCount: t("tenant.platformStudio.forms.builder.fieldSettings.availableFieldsCount"),
        availableModels: t("tenant.platformStudio.forms.builder.fieldSettings.availableModels"),
        cancel: t("tenant.platformStudio.forms.cancelDelete"),
        emptyDisplayFields: t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields"),
        noAvailableModels: t("tenant.platformStudio.forms.builder.fieldSettings.noAvailableModels"),
        noSourceSelected: t("tenant.platformStudio.forms.builder.fieldSettings.noSourceSelected"),
        onlyActiveRecords: t("tenant.platformStudio.forms.builder.fieldSettings.onlyActiveRecords"),
        save: t("tenant.platformStudio.forms.builder.saveAction"),
        selectedFields: t("tenant.platformStudio.forms.builder.fieldSettings.selectedFields"),
        sortBy: t("tenant.platformStudio.forms.builder.fieldSettings.sortBy"),
        sourcePickerDescription: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerDescription"),
        sourcePickerLoading: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerLoading"),
        sourcePickerTitle: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerTitle"),
      }}
      modelItems={lookupSourcePickerModelItems}
      onCancel={closeLookupSourcePicker}
      onActiveFilterChange={onLookupSourcePickerActiveFilterChange}
      onFieldCheckedChange={onLookupSourcePickerFieldCheckedChange}
      onModelChange={onLookupSourcePickerModelChange}
      onOpenChange={onLookupSourcePickerOpenChange}
      onSave={onSaveLookupSourcePicker}
      onSortFieldChange={onLookupSourcePickerSortFieldChange}
      open={Boolean(lookupSourcePicker)}
      selectedFieldKeys={lookupSourcePicker?.selectedFieldKeys ?? []}
      selectedFieldsSummary={lookupSourcePickerSelectedFieldsSummary}
      selectedModel={lookupSourcePickerModel}
      selectedModelId={lookupSourcePicker?.modelId ?? ""}
      sortFieldKey={lookupSourcePicker?.sortFieldKey ?? ""}
    />
  );
}

export function WorkspaceSupportDialogs({
  debugCompiledRuntime,
  debugDataSchema,
  debugOpen,
  debugUiSchema,
  leaveConfirmOpen,
  onDebugOpenChange,
  onLeaveConfirmOpenChange,
  onResolveLeaveConfirmation,
  t,
}: WorkspaceSupportDialogsProps) {
  return (
    <>
      <DebugDialog
        compiledRuntime={debugCompiledRuntime}
        labels={{
          compiledRuntimeDescription: "Derived storage and SQL mapping for scopes and fields.",
          compiledRuntimeTitle: "Compiled Runtime",
          description: t("tenant.platformStudio.forms.builder.debugDialogDescription"),
          modelSchemaDescription: t("tenant.platformStudio.forms.builder.debugModelSchemaDescription"),
          modelSchemaTitle: t("tenant.platformStudio.forms.builder.debugModelSchemaTitle"),
          title: t("tenant.platformStudio.forms.builder.debugDialogTitle"),
          uiSchemaDescription: t("tenant.platformStudio.forms.builder.debugUiSchemaDescription"),
          uiSchemaTitle: t("tenant.platformStudio.forms.builder.debugUiSchemaTitle"),
        }}
        modelSchema={debugDataSchema}
        onOpenChange={onDebugOpenChange}
        open={debugOpen}
        uiSchema={debugUiSchema}
      />

      <UnsavedLeaveConfirmationDialog
        cancelLabel={t("tenant.platformStudio.forms.builder.stayAction")}
        confirmLabel={t("tenant.platformStudio.forms.builder.leaveWithoutSavingAction")}
        description={t("tenant.platformStudio.forms.builder.unsavedLeaveDescription")}
        onCancel={() => onResolveLeaveConfirmation(false)}
        onConfirm={() => onResolveLeaveConfirmation(true)}
        onOpenChange={onLeaveConfirmOpenChange}
        open={leaveConfirmOpen}
        title={t("tenant.platformStudio.forms.builder.unsavedLeaveTitle")}
      />
    </>
  );
}
