import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
} from "@platform/ui-kit";

export type LookupSourcePickerFieldOption = {
  key: string;
  label: string;
};

export type LookupSourcePickerModelOption = {
  activeFilterField: string;
  defaultSortField: string;
  fields: ReadonlyArray<LookupSourcePickerFieldOption>;
  id: string;
  label: string;
};

export type LookupSourcePickerModelItem = {
  activeFilterField: string;
  defaultDisplayFields: ReadonlyArray<string>;
  defaultSortField: string;
  fieldCount: number | null;
  id: string;
  label: string;
};

type LookupSourcePickerDialogLabels = {
  availableFields: string;
  availableFieldsCount: string;
  availableModels: string;
  cancel: string;
  emptyDisplayFields: string;
  noAvailableModels: string;
  noSourceSelected: string;
  onlyActiveRecords: string;
  save: string;
  selectedFields: string;
  sortBy: string;
  sourcePickerDescription: string;
  sourcePickerLoading: string;
  sourcePickerTitle: string;
};

type LookupSourcePickerDialogProps = {
  canEdit: boolean;
  error: string | null;
  isLoading: boolean;
  labels: LookupSourcePickerDialogLabels;
  modelItems: ReadonlyArray<LookupSourcePickerModelItem>;
  onCancel: () => void;
  onFieldCheckedChange: (fieldKey: string, checked: boolean) => void;
  onModelChange: (
    modelId: string,
    selectedFieldKeys: ReadonlyArray<string>,
    sortFieldKey: string,
    activeFilterEnabled: boolean,
  ) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onActiveFilterChange: (enabled: boolean) => void;
  onSortFieldChange: (fieldKey: string) => void;
  activeFilterEnabled: boolean;
  open: boolean;
  selectedFieldKeys: ReadonlyArray<string>;
  selectedFieldsSummary: string;
  selectedModel: LookupSourcePickerModelOption | null;
  selectedModelId: string;
  sortFieldKey: string;
};

export function LookupSourcePickerDialog({
  activeFilterEnabled,
  canEdit,
  error,
  isLoading,
  labels,
  modelItems,
  onCancel,
  onFieldCheckedChange,
  onModelChange,
  onOpenChange,
  onSave,
  onActiveFilterChange,
  onSortFieldChange,
  open,
  selectedFieldKeys,
  selectedFieldsSummary,
  selectedModel,
  selectedModelId,
  sortFieldKey,
}: LookupSourcePickerDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="tenant-web__platform-studio-filter-dialog">
        <DialogHeader>
          <div>
            <DialogTitle>
              {labels.sourcePickerTitle}
            </DialogTitle>
            <DialogDescription>
              {labels.sourcePickerDescription}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
          {open ? (
            <div className="tenant-web__platform-studio-builder-stack">
              <div className="tenant-web__platform-studio-lookup-picker-columns">
                <div className="tenant-web__platform-studio-lookup-picker-column">
                  <p className="tenant-web__platform-studio-filter-group-title">
                    {labels.availableModels}
                  </p>
                  {modelItems.length > 0 ? (
                    <div className="tenant-web__platform-studio-lookup-picker-list">
                      {modelItems.map((modelOption) => {
                        const checked = selectedModelId === modelOption.id;

                        return (
                          <label
                            className={`tenant-web__platform-studio-lookup-picker-option${checked ? " tenant-web__platform-studio-lookup-picker-option--selected" : ""}`}
                            key={modelOption.id}
                          >
                            <input
                              checked={checked}
                              disabled={!canEdit}
                              name="tenant-platform-studio-lookup-source-model"
                              onChange={() => onModelChange(
                                modelOption.id,
                                modelOption.defaultDisplayFields,
                                modelOption.defaultSortField,
                                Boolean(modelOption.activeFilterField),
                              )}
                              type="radio"
                              value={modelOption.id}
                            />
                            <div className="tenant-web__platform-studio-compact-row-main">
                              <span className="tenant-web__platform-studio-compact-row-label">
                                {modelOption.label}
                              </span>
                              {modelOption.fieldCount !== null ? (
                                <span className="tenant-web__platform-studio-compact-row-summary">
                                  {`${modelOption.fieldCount} ${labels.availableFieldsCount}`}
                                </span>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="tenant-web__platform-studio-inline-help">
                      {labels.noAvailableModels}
                    </p>
                  )}
                </div>

                <div className="tenant-web__platform-studio-lookup-picker-column">
                  <p className="tenant-web__platform-studio-filter-group-title">
                    {labels.availableFields}
                  </p>

                  {isLoading ? (
                    <p className="tenant-web__platform-studio-inline-help">
                      {labels.sourcePickerLoading}
                    </p>
                  ) : error ? (
                    <p className="tenant-web__platform-studio-inline-help">
                      {error}
                    </p>
                  ) : selectedModel ? (
                    <div className="tenant-web__platform-studio-lookup-picker-list">
                      {selectedModel.fields.map((fieldOption) => {
                        const checked = selectedFieldKeys.includes(fieldOption.key);

                        return (
                          <label
                            className={`tenant-web__platform-studio-lookup-picker-option${checked ? " tenant-web__platform-studio-lookup-picker-option--selected" : ""}`}
                            key={`${selectedModel.id}-${fieldOption.key}`}
                          >
                            <input
                              checked={checked}
                              disabled={!canEdit}
                              onChange={(event) => onFieldCheckedChange(fieldOption.key, event.target.checked)}
                              type="checkbox"
                            />
                            <div className="tenant-web__platform-studio-compact-row-main">
                              <span className="tenant-web__platform-studio-compact-row-label">
                                {fieldOption.label}
                              </span>
                              <span className="tenant-web__platform-studio-compact-row-summary">
                                {fieldOption.key}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="tenant-web__platform-studio-inline-help">
                      {labels.noSourceSelected}
                    </p>
                  )}
                </div>
              </div>

              {selectedModel ? (
                <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                  <div className="tenant-web__platform-studio-compact-row">
                    <div className="tenant-web__platform-studio-compact-row-main">
                      <span className="tenant-web__platform-studio-compact-row-label">
                        {labels.selectedFields}
                      </span>
                      <span className="tenant-web__platform-studio-compact-row-summary">
                        {selectedFieldsSummary || labels.emptyDisplayFields}
                      </span>
                    </div>
                  </div>

                  <div className="tenant-web__platform-studio-form-group">
                    <Label htmlFor="tenant-platform-studio-lookup-sort-field">
                      {labels.sortBy}
                    </Label>
                    <Select
                      disabled={!canEdit}
                      id="tenant-platform-studio-lookup-sort-field"
                      onChange={(event) => onSortFieldChange(event.target.value)}
                      value={sortFieldKey}
                    >
                      {selectedModel.fields.map((fieldOption) => (
                        <option key={`${selectedModel.id}-sort-${fieldOption.key}`} value={fieldOption.key}>
                          {fieldOption.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {selectedModel.activeFilterField ? (
                    <label className="tenant-web__platform-studio-lookup-picker-option">
                      <input
                        checked={activeFilterEnabled}
                        disabled={!canEdit}
                        onChange={(event) => onActiveFilterChange(event.target.checked)}
                        type="checkbox"
                      />
                      <div className="tenant-web__platform-studio-compact-row-main">
                        <span className="tenant-web__platform-studio-compact-row-label">
                          {labels.onlyActiveRecords}
                        </span>
                        <span className="tenant-web__platform-studio-compact-row-summary">
                          {selectedModel.activeFilterField}
                        </span>
                      </div>
                    </label>
                  ) : null}
                </div>
              ) : null}

              <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                <Button onClick={onCancel} size="sm" variant="ghost">
                  {labels.cancel}
                </Button>
                <Button
                  disabled={!canEdit || !selectedModel || selectedFieldKeys.length === 0}
                  onClick={onSave}
                  size="sm"
                  variant="primary"
                >
                  {labels.save}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
