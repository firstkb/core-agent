import {
  Label,
  Select,
} from "@platform/ui-kit";

export type ViewSettingsSystemFieldOption = {
  id: string;
  label: string;
};

export type ViewSettingsSystemFieldItem = {
  boundFieldId: string;
  compatibleFields: ReadonlyArray<ViewSettingsSystemFieldOption>;
  finalValue: string;
  initialValue: string;
  label: string;
  noCompatibleText: string;
  role: string;
  summary: string;
  workflowStatusOptions: ReadonlyArray<string>;
};

type ViewSettingsSystemFieldsSectionProps = {
  canEdit: boolean;
  disabled: boolean;
  finalValueLabel: string;
  initialValueLabel: string;
  onSystemFieldChange: (role: string, fieldId: string) => void;
  onWorkflowStatusOptionChange: (key: "finalValue" | "initialValue", value: string) => void;
  sectionTitle: string;
  systemFields: ReadonlyArray<ViewSettingsSystemFieldItem>;
  unboundLabel: string;
};

export function ViewSettingsSystemFieldsSection({
  canEdit,
  disabled,
  finalValueLabel,
  initialValueLabel,
  onSystemFieldChange,
  onWorkflowStatusOptionChange,
  sectionTitle,
  systemFields,
  unboundLabel,
}: ViewSettingsSystemFieldsSectionProps) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{sectionTitle}</span>
      </div>
      <div className="tenant-web__platform-studio-builder-stack">
        {systemFields.map((item) => (
          <div className="tenant-web__platform-studio-system-field-card" key={item.role}>
            <div className="tenant-web__platform-studio-system-field-card-header">
              <div className="tenant-web__platform-studio-compact-row-main">
                <span className="tenant-web__platform-studio-compact-row-label">
                  {item.label}
                </span>
                <span className="tenant-web__platform-studio-compact-row-summary">
                  {item.summary}
                </span>
              </div>
            </div>

            <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
              <Select
                aria-label={item.label}
                disabled={!canEdit || disabled}
                id={`tenant-platform-studio-system-field-${item.role}`}
                onChange={(event) => onSystemFieldChange(item.role, event.target.value)}
                value={item.boundFieldId}
              >
                <option value="">{unboundLabel}</option>
                {item.compatibleFields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </Select>
            </div>

            {item.compatibleFields.length === 0 ? (
              <p className="tenant-web__platform-studio-inline-help">
                {item.noCompatibleText}
              </p>
            ) : null}

            {item.role === "workflowStatus" ? (
              <div className="tenant-web__platform-studio-sort-row">
                <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                  <Label htmlFor="tenant-platform-studio-system-field-status-initial">
                    {initialValueLabel}
                  </Label>
                  <Select
                    disabled={!canEdit || disabled || !item.boundFieldId || item.workflowStatusOptions.length === 0}
                    id="tenant-platform-studio-system-field-status-initial"
                    onChange={(event) => onWorkflowStatusOptionChange("initialValue", event.target.value)}
                    value={item.initialValue}
                  >
                    <option value="">{unboundLabel}</option>
                    {item.workflowStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                  <Label htmlFor="tenant-platform-studio-system-field-status-final">
                    {finalValueLabel}
                  </Label>
                  <Select
                    disabled={!canEdit || disabled || !item.boundFieldId || item.workflowStatusOptions.length === 0}
                    id="tenant-platform-studio-system-field-status-final"
                    onChange={(event) => onWorkflowStatusOptionChange("finalValue", event.target.value)}
                    value={item.finalValue}
                  >
                    <option value="">{unboundLabel}</option>
                    {item.workflowStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
