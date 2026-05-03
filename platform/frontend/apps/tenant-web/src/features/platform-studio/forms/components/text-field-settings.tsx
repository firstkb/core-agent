import {
  Input,
  Label,
  Select,
  Switch,
} from "@platform/ui-kit";

import { type FormsPlaceholderFieldValidation } from "../forms-placeholder-data";

type TextFieldSettingsLabels = {
  autocomplete: string;
  mask: string;
  placeholder: string;
  uniqueValue: string;
  unbound: string;
  validation: string;
  validationEmail: string;
  validationPhone: string;
  validationUrl: string;
};

type TextFieldSettingsProps = {
  autocompleteChecked: boolean;
  fieldTypeLabel: string;
  labels: TextFieldSettingsLabels;
  mask: string;
  onAutocompleteChange: (checked: boolean) => void;
  onMaskChange: (value: string) => void;
  onPlaceholderChange: (value: string) => void;
  onUniqueValueChange: (checked: boolean) => void;
  onValidationChange: (validation: FormsPlaceholderFieldValidation | undefined) => void;
  placeholder: string;
  showValidation: boolean;
  showUniqueValue: boolean;
  uniqueValueChecked: boolean;
  validation: FormsPlaceholderFieldValidation | undefined;
};

export function TextFieldSettings({
  autocompleteChecked,
  fieldTypeLabel,
  labels,
  mask,
  onAutocompleteChange,
  onMaskChange,
  onPlaceholderChange,
  onUniqueValueChange,
  onValidationChange,
  placeholder,
  showValidation,
  showUniqueValue,
  uniqueValueChecked,
  validation,
}: TextFieldSettingsProps) {
  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{fieldTypeLabel}</span>
      </div>

      <div className="tenant-web__platform-studio-sort-row">
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-preset-placeholder">
            {labels.placeholder}
          </Label>
          <Input
            id="tenant-platform-studio-preset-placeholder"
            onChange={(event) => onPlaceholderChange(event.target.value)}
            value={placeholder}
          />
        </div>
      </div>

      <div className="tenant-web__platform-studio-sort-row">
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-preset-mask">
            {labels.mask}
          </Label>
          <Input
            id="tenant-platform-studio-preset-mask"
            onChange={(event) => onMaskChange(event.target.value)}
            value={mask}
          />
        </div>
        {showValidation ? (
          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-preset-validation">
              {labels.validation}
            </Label>
            <Select
              id="tenant-platform-studio-preset-validation"
              onChange={(event) => onValidationChange(
                (event.target.value || undefined) as FormsPlaceholderFieldValidation | undefined,
              )}
              value={validation ?? ""}
            >
              <option value="">{labels.unbound}</option>
              <option value="email">{labels.validationEmail}</option>
              <option value="phone">{labels.validationPhone}</option>
              <option value="url">{labels.validationUrl}</option>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
        <span className="tenant-web__platform-studio-form-inline-label">
          {labels.autocomplete}
        </span>
        <Switch
          checked={autocompleteChecked}
          onCheckedChange={onAutocompleteChange}
          size="sm"
        />
      </div>

      {showUniqueValue ? (
        <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
          <span className="tenant-web__platform-studio-form-inline-label">
            {labels.uniqueValue}
          </span>
          <Switch
            checked={uniqueValueChecked}
            onCheckedChange={onUniqueValueChange}
            size="sm"
          />
        </div>
      ) : null}
    </div>
  );
}
