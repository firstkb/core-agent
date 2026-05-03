import {
  Label,
  Select,
} from "@platform/ui-kit";

import {
  formsPlaceholderChoiceOptionStyleVariants,
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderChoiceOptionStyleVariant,
  type FormsPlaceholderFieldOptionStyle,
} from "../forms-placeholder-data";

type ChoiceButtonStylesLabels = {
  buttonStyles: string;
  styleVariant: string;
  styleVariantDanger: string;
  styleVariantDefault: string;
  styleVariantInfo: string;
  styleVariantPrimary: string;
  styleVariantSecondary: string;
  styleVariantSuccess: string;
  styleVariantWarning: string;
};

type ChoiceButtonStylesSectionProps = {
  choiceDisplay: FormsPlaceholderChoiceDisplay | undefined;
  labels: ChoiceButtonStylesLabels;
  onOptionStyleChange: (
    option: string,
    updater: (currentStyle: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
  ) => void;
  options: ReadonlyArray<string>;
};

export function ChoiceButtonStylesSection({
  choiceDisplay,
  labels,
  onOptionStyleChange,
  options,
}: ChoiceButtonStylesSectionProps) {
  if (choiceDisplay?.renderStyle !== "buttons" || options.length === 0) {
    return null;
  }

  return (
    <>
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{labels.buttonStyles}</span>
      </div>

      <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
        {options.map((option, optionIndex) => {
          const optionStyle = getChoiceOptionStyle(choiceDisplay, option);

          return (
            <div className="tenant-web__platform-studio-compact-row tenant-web__platform-studio-choice-style-row" key={`choice-style-${option}-${optionIndex}`}>
              <div className="tenant-web__platform-studio-compact-row-main">
                <span className="tenant-web__platform-studio-compact-row-label">{option}</span>
              </div>

              <div className="tenant-web__platform-studio-choice-style-controls">
                <ChoiceStyleVariantSelect
                  id={`tenant-platform-studio-choice-style-${optionIndex}`}
                  label={labels.styleVariant}
                  labels={labels}
                  onChange={(variant) => onOptionStyleChange(option, () =>
                    variant === "default" ? undefined : { option, variant }
                  )}
                  value={optionStyle?.variant ?? "default"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChoiceStyleVariantSelect({
  id,
  label,
  labels,
  onChange,
  value,
}: {
  id: string;
  label: string;
  labels: ChoiceButtonStylesLabels;
  onChange: (value: FormsPlaceholderChoiceOptionStyleVariant) => void;
  value: FormsPlaceholderChoiceOptionStyleVariant;
}) {
  return (
    <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
      <Label htmlFor={id}>
        {label}
      </Label>
      <Select
        id={id}
        onChange={(event) => onChange(event.target.value as FormsPlaceholderChoiceOptionStyleVariant)}
        value={value}
      >
        {formsPlaceholderChoiceOptionStyleVariants.map((variant) => (
          <option key={variant} value={variant}>
            {getChoiceStyleVariantLabel(variant, labels)}
          </option>
        ))}
      </Select>
    </div>
  );
}

function getChoiceOptionStyle(
  choiceDisplay: FormsPlaceholderChoiceDisplay | undefined,
  option: string,
) {
  return choiceDisplay?.optionStyles?.find((entry) => entry.option === option) ?? null;
}

function getChoiceStyleVariantLabel(
  variant: FormsPlaceholderChoiceOptionStyleVariant,
  labels: ChoiceButtonStylesLabels,
) {
  switch (variant) {
    case "danger":
      return labels.styleVariantDanger;
    case "info":
      return labels.styleVariantInfo;
    case "primary":
      return labels.styleVariantPrimary;
    case "secondary":
      return labels.styleVariantSecondary;
    case "success":
      return labels.styleVariantSuccess;
    case "warning":
      return labels.styleVariantWarning;
    default:
      return labels.styleVariantDefault;
  }
}
