import { useState } from "react";

import {
  Slider,
  SplitButton,
} from "@platform/ui-kit";

export function SliderValueRow({
  ariaLabel,
  defaultValue,
  label,
  max,
  min,
  name,
  step,
  disabled = false,
}: {
  ariaLabel: string;
  defaultValue: number;
  label: string;
  max?: number;
  min?: number;
  name: string;
  step?: number;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="ui-lab-page__slider-row">
      <span className="ui-lab-page__slider-meta">{label} · {disabled ? "disabled" : value}</span>
      <Slider
        aria-label={ariaLabel}
        defaultValue={defaultValue}
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        onValueChange={setValue}
        step={step}
      />
    </div>
  );
}

export function SplitButtonPreview({
  buttonLabel,
  menuLabel,
  size = "md",
  variant = "primary",
}: {
  buttonLabel: string;
  menuLabel: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
}) {
  const [lastAction, setLastAction] = useState("Create manually");

  return (
    <div className="ui-lab-page__stack">
      <SplitButton
        dropdownAriaLabel={`${buttonLabel} more actions`}
        items={[
          { id: "manual", label: "Create manually" },
          { id: "import", label: "Import CSV" },
          { id: "template", label: "Start from template" },
        ]}
        menuLabel={menuLabel}
        onItemSelect={(item) => {
          if (typeof item.label === "string") {
            setLastAction(item.label);
          }
        }}
        size={size}
        variant={variant}
      >
        {buttonLabel}
      </SplitButton>
      <p className="ui-lab-page__muted">Last secondary action: {lastAction}</p>
    </div>
  );
}
