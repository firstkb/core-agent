import {
  Button,
  Input,
  Label,
  Select,
  Switch,
} from "@platform/ui-kit";

import {
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderChoiceOrientation,
  type FormsPlaceholderChoiceRenderStyle,
  type FormsPlaceholderFieldOptionStyle,
} from "../forms-placeholder-data";
import { ChoiceButtonStylesSection } from "./choice-button-styles-section";
import {
  ChoiceOptionRow,
  type ChoiceOptionRowLabels,
} from "./choice-option-row";

type ChoiceFieldSettingsLabels = ChoiceOptionRowLabels & {
  addOption: string;
  allowEmpty: string;
  buttonStyles: string;
  display: string;
  emptyOptions: string;
  maxSelections: string;
  minSelections: string;
  options: string;
  orientation: string;
  orientationHorizontal: string;
  orientationVertical: string;
  renderStyle: string;
  renderStyleButtons: string;
  renderStyleNative: string;
  selection: string;
  styleVariant: string;
  styleVariantDanger: string;
  styleVariantDefault: string;
  styleVariantInfo: string;
  styleVariantPrimary: string;
  styleVariantSecondary: string;
  styleVariantSuccess: string;
  styleVariantWarning: string;
};

type ChoiceFieldSettingsProps = {
  canEdit: boolean;
  canMoveOptions: boolean;
  choiceDisplay: FormsPlaceholderChoiceDisplay | undefined;
  dragOverOptionIndex: number | null;
  draggedOptionIndex: number | null;
  fieldKind: "multi_select" | "single_select";
  fieldTypeLabel: string;
  labels: ChoiceFieldSettingsLabels;
  onAddOption: () => void;
  onChoiceDisplayChange: (
    updater: (choiceDisplay: FormsPlaceholderChoiceDisplay | undefined) => FormsPlaceholderChoiceDisplay | undefined,
  ) => void;
  onDragEnd: () => void;
  onDragOverOption: (index: number) => void;
  onDragStartOption: (index: number) => void;
  onDropOption: (index: number) => void;
  onOptionChange: (index: number, value: string) => void;
  onOptionRemove: (index: number) => void;
  onOptionStyleChange: (
    option: string,
    updater: (currentStyle: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
  ) => void;
  options: ReadonlyArray<string>;
};

export function ChoiceFieldSettings({
  canEdit,
  canMoveOptions,
  choiceDisplay,
  dragOverOptionIndex,
  draggedOptionIndex,
  fieldKind,
  fieldTypeLabel,
  labels,
  onAddOption,
  onChoiceDisplayChange,
  onDragEnd,
  onDragOverOption,
  onDragStartOption,
  onDropOption,
  onOptionChange,
  onOptionRemove,
  onOptionStyleChange,
  options,
}: ChoiceFieldSettingsProps) {
  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{fieldTypeLabel}</span>
      </div>

      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{labels.options}</span>
      </div>

      {options.length === 0 ? (
        <p className="tenant-web__platform-studio-inline-help">
          {labels.emptyOptions}
        </p>
      ) : (
        <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
          {options.map((option, optionIndex) => (
            <ChoiceOptionRow
              canEdit={canEdit}
              canMoveItems={canMoveOptions}
              dragOverOptionIndex={dragOverOptionIndex}
              draggedOptionIndex={draggedOptionIndex}
              index={optionIndex}
              key={`choice-option-${optionIndex}`}
              labels={labels}
              onChangeValue={(nextValue) => onOptionChange(optionIndex, nextValue)}
              onDragEnd={onDragEnd}
              onDragOverOption={() => onDragOverOption(optionIndex)}
              onDragStartOption={() => onDragStartOption(optionIndex)}
              onDropOption={() => onDropOption(optionIndex)}
              onRemove={() => onOptionRemove(optionIndex)}
              value={option}
            />
          ))}
        </div>
      )}

      <div className="tenant-web__platform-studio-button-row">
        <Button
          disabled={!canEdit}
          onClick={onAddOption}
          size="sm"
          variant="secondary"
        >
          {labels.addOption}
        </Button>
      </div>

      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{labels.display}</span>
      </div>

      <div className="tenant-web__platform-studio-sort-row">
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-choice-render-style">
            {labels.renderStyle}
          </Label>
          <Select
            id="tenant-platform-studio-choice-render-style"
            onChange={(event) => onChoiceDisplayChange((currentChoiceDisplay) => ({
              ...currentChoiceDisplay,
              renderStyle: event.target.value as FormsPlaceholderChoiceRenderStyle,
            }))}
            value={choiceDisplay?.renderStyle ?? "native"}
          >
            <option value="native">{labels.renderStyleNative}</option>
            <option value="buttons">{labels.renderStyleButtons}</option>
          </Select>
        </div>

        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-choice-orientation">
            {labels.orientation}
          </Label>
          <Select
            id="tenant-platform-studio-choice-orientation"
            onChange={(event) => onChoiceDisplayChange((currentChoiceDisplay) => ({
              ...currentChoiceDisplay,
              orientation: event.target.value as FormsPlaceholderChoiceOrientation,
            }))}
            value={choiceDisplay?.orientation ?? "vertical"}
          >
            <option value="vertical">{labels.orientationVertical}</option>
            <option value="horizontal">{labels.orientationHorizontal}</option>
          </Select>
        </div>
      </div>

      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{labels.selection}</span>
      </div>

      {fieldKind === "single_select" ? (
        <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
          <span className="tenant-web__platform-studio-form-inline-label">
            {labels.allowEmpty}
          </span>
          <Switch
            checked={choiceDisplay?.allowEmpty ?? false}
            onCheckedChange={(checked) => onChoiceDisplayChange((currentChoiceDisplay) => ({
              ...currentChoiceDisplay,
              allowEmpty: checked,
            }))}
            size="sm"
          />
        </div>
      ) : (
        <div className="tenant-web__platform-studio-sort-row">
          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-choice-min-selections">
              {labels.minSelections}
            </Label>
            <Input
              id="tenant-platform-studio-choice-min-selections"
              min={0}
              onChange={(event) => onChoiceDisplayChange((currentChoiceDisplay) => ({
                ...currentChoiceDisplay,
                minSelections: Math.max(0, Number(event.target.value) || 0),
              }))}
              type="number"
              value={choiceDisplay?.minSelections ?? 0}
            />
          </div>
          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-choice-max-selections">
              {labels.maxSelections}
            </Label>
            <Input
              id="tenant-platform-studio-choice-max-selections"
              min={0}
              onChange={(event) => onChoiceDisplayChange((currentChoiceDisplay) => {
                const rawValue = event.target.value.trim();
                return {
                  ...currentChoiceDisplay,
                  maxSelections: rawValue ? Math.max(0, Number(rawValue) || 0) : undefined,
                };
              })}
              type="number"
              value={choiceDisplay?.maxSelections ?? ""}
            />
          </div>
        </div>
      )}

      <ChoiceButtonStylesSection
        choiceDisplay={choiceDisplay}
        labels={labels}
        onOptionStyleChange={onOptionStyleChange}
        options={options}
      />
    </div>
  );
}
