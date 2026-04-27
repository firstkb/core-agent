import {
  syncChoiceOptionStyles,
} from "./form-builder-workspace-normalization-helpers";
import {
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderField,
  type FormsPlaceholderFieldOptionStyle,
} from "../forms-placeholder-data";

export function applyChoiceFieldOptionsUpdate(
  field: FormsPlaceholderField,
  updater: (options: ReadonlyArray<string>) => ReadonlyArray<string>,
) {
  const nextOptions = updater(field.options ?? []);

  return {
    ...field,
    choiceDisplay: field.choiceDisplay
      ? {
          ...field.choiceDisplay,
          optionStyles: syncChoiceOptionStyles(nextOptions, field.choiceDisplay.optionStyles),
        }
      : field.choiceDisplay,
    options: nextOptions.length > 0 ? nextOptions : undefined,
  };
}

export function renameChoiceFieldOption(
  field: FormsPlaceholderField,
  optionIndex: number,
  nextValue: string,
) {
  const currentOptions = field.options ?? [];
  const previousValue = currentOptions[optionIndex];
  const nextOptions = currentOptions.map((entry, entryIndex) =>
    entryIndex === optionIndex ? nextValue : entry
  );

  return {
    ...field,
    choiceDisplay: field.choiceDisplay
      ? {
          ...field.choiceDisplay,
          optionStyles: field.choiceDisplay.optionStyles
            ?.map((entry) => previousValue && entry.option === previousValue
              ? {
                  ...entry,
                  option: nextValue,
                }
              : entry)
            .filter((entry) => nextOptions.includes(entry.option)),
        }
      : field.choiceDisplay,
    options: nextOptions.length > 0 ? nextOptions : undefined,
  };
}

export function reorderChoiceFieldOptions(
  options: ReadonlyArray<string>,
  fromIndex: number,
  toIndex: number,
) {
  if (fromIndex === toIndex) {
    return options;
  }

  if (fromIndex < 0 || toIndex < 0 || fromIndex >= options.length || toIndex >= options.length) {
    return options;
  }

  const nextOptions = [...options];
  const [movedOption] = nextOptions.splice(fromIndex, 1);

  if (typeof movedOption === "undefined") {
    return options;
  }

  nextOptions.splice(toIndex, 0, movedOption);
  return nextOptions;
}

export function applyChoiceOptionStyleUpdate(
  choiceDisplay: FormsPlaceholderChoiceDisplay | undefined,
  option: string,
  updater: (style: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
) {
  const currentStyles = choiceDisplay?.optionStyles ?? [];
  const currentStyle = currentStyles.find((entry) => entry.option === option);
  const nextStyle = updater(currentStyle);
  const remainingStyles = currentStyles.filter((entry) => entry.option !== option);
  const nextStyles = nextStyle ? [...remainingStyles, nextStyle] : remainingStyles;

  return {
    ...choiceDisplay,
    optionStyles: nextStyles.length > 0 ? nextStyles : undefined,
  };
}
