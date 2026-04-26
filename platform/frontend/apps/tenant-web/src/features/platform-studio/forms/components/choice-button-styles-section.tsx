import {
  Input,
  Label,
} from "@platform/ui-kit";

import {
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderFieldOptionStyle,
} from "../forms-placeholder-data";

type ChoiceButtonStylesLabels = {
  backgroundColor: string;
  borderColor: string;
  buttonStyles: string;
  textColor: string;
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
        {options.map((option) => {
          const optionStyle = getChoiceOptionStyle(choiceDisplay, option);

          return (
            <div className="tenant-web__platform-studio-compact-row tenant-web__platform-studio-choice-style-row" key={`choice-style-${option}`}>
              <div className="tenant-web__platform-studio-compact-row-main">
                <span className="tenant-web__platform-studio-compact-row-label">{option}</span>
              </div>

              <div className="tenant-web__platform-studio-choice-style-controls">
                <ChoiceColorInput
                  id={`tenant-platform-studio-choice-background-${option}`}
                  label={labels.backgroundColor}
                  onChange={(value) => onOptionStyleChange(option, (currentStyle) => ({
                    ...(currentStyle ?? { option }),
                    backgroundColor: normalizeHexColor(value) || undefined,
                    option,
                  }))}
                  value={optionStyle?.backgroundColor ?? "#000000"}
                />
                <ChoiceColorInput
                  id={`tenant-platform-studio-choice-text-${option}`}
                  label={labels.textColor}
                  onChange={(value) => onOptionStyleChange(option, (currentStyle) => ({
                    ...(currentStyle ?? { option }),
                    option,
                    textColor: normalizeHexColor(value) || undefined,
                  }))}
                  value={optionStyle?.textColor ?? "#ffffff"}
                />
                <ChoiceColorInput
                  id={`tenant-platform-studio-choice-border-${option}`}
                  label={labels.borderColor}
                  onChange={(value) => onOptionStyleChange(option, (currentStyle) => ({
                    ...(currentStyle ?? { option }),
                    borderColor: normalizeHexColor(value) || undefined,
                    option,
                  }))}
                  value={optionStyle?.borderColor ?? "#000000"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChoiceColorInput({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
      <Label htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value}
      />
    </div>
  );
}

function getChoiceOptionStyle(
  choiceDisplay: FormsPlaceholderChoiceDisplay | undefined,
  option: string,
) {
  return choiceDisplay?.optionStyles?.find((entry) => entry.option === option) ?? null;
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : "";
}
