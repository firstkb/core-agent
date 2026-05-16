import {
  type RuntimeFormChecklistItemChange,
  type RuntimeFormChoiceOptionStyleVariant,
  type RuntimeFormSubformDataById,
  type RuntimeFormSubformRow,
} from "@platform/forms";

import type {
  FormRuntimeFormResponse,
  FormRuntimeRecordResponse,
} from "./form-runtime-collection-table-client";
import { coerceLooseRuntimeValues } from "./form-runtime-value-helpers";

export function runtimeSubformsFromRecord(record: FormRuntimeRecordResponse) {
  const subforms: RuntimeFormSubformDataById = {};
  record.subtables.forEach((subtable) => {
    const rows: RuntimeFormSubformRow[] = subtable.rows.map((row) => ({
      cells: Object.fromEntries(
        Object.entries(row.cells).map(([fieldId, cell]) => [fieldId, {
          displayValue: cell.displayValue,
          html: cell.html,
          label: cell.label,
          value: cell.value,
        }]),
      ),
      id: row.id,
    }));
    subforms[subtable.id] = { rows };
  });
  return subforms;
}

export function runtimeSubformsFromFormResponse(response: FormRuntimeFormResponse) {
  const subforms: RuntimeFormSubformDataById = {};
  Object.entries(response.subforms ?? {}).forEach(([subformId, subform]) => {
    if (!subform?.checklist) {
      return;
    }
    subforms[subformId] = {
      checklist: {
        groups: subform.checklist.groups.map((group) => ({
          id: group.id,
          items: group.items.map((item) => ({
            active: item.active,
            answerOptions: item.answerOptions?.map((option) => ({
              label: option.label,
              styleVariant: option.styleVariant as RuntimeFormChoiceOptionStyleVariant,
              value: option.value,
            })),
            description: item.description,
            groupId: item.groupId,
            groupTitle: item.groupTitle,
            inactiveSaved: item.inactiveSaved,
            label: item.label,
            notes: item.notes,
            required: item.required,
            savedRowDocGuid: item.savedRowDocGuid,
            sourceGuid: item.sourceGuid,
            sourceValue: item.sourceValue,
            value: item.value,
            values: coerceLooseRuntimeValues(item.values),
            visibleWhen: item.visibleWhen,
          })),
          title: group.title,
        })),
      },
    };
  });
  return subforms;
}

export function mergeRuntimeSubformData(
  current: RuntimeFormSubformDataById,
  next: RuntimeFormSubformDataById,
) {
  const merged: RuntimeFormSubformDataById = { ...current };
  Object.entries(next).forEach(([subformId, nextSubform]) => {
    const currentSubform = merged[subformId];
    merged[subformId] = {
      checklist: nextSubform?.checklist ?? currentSubform?.checklist,
      rows: nextSubform?.rows ?? currentSubform?.rows,
    };
  });
  return merged;
}

export function mergeRuntimeChecklistItemState(
  current: RuntimeFormSubformDataById,
  subformId: string,
  sourceValue: string,
  change: RuntimeFormChecklistItemChange,
  savedRowDocGuid?: string,
): RuntimeFormSubformDataById {
  const currentSubform = current[subformId];
  const checklist = currentSubform?.checklist;
  if (!checklist) {
    return current;
  }

  return {
    ...current,
    [subformId]: {
      ...currentSubform,
      checklist: {
        groups: checklist.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => {
            if (item.sourceValue !== sourceValue) {
              return item;
            }
            return {
              ...item,
              notes: change.notes ?? item.notes,
              savedRowDocGuid: savedRowDocGuid ?? item.savedRowDocGuid,
              value: change.value ?? item.value,
              values: change.values ? {
                ...(item.values ?? {}),
                ...change.values,
              } : item.values,
            };
          }),
        })),
      },
    },
  };
}
