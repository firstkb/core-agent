import type {
  RuntimeFormChecklistData,
  RuntimeFormChecklistGroup,
  RuntimeFormChecklistItem,
} from "./runtime-form-types";

type RuntimeChecklistVisibleWhenRule = {
  expectedValues: ReadonlyArray<string>;
  sourceValue: string;
};

function parseRuntimeChecklistVisibleWhen(
  expression: string | undefined,
): RuntimeChecklistVisibleWhenRule | null {
  const trimmedExpression = expression?.trim();
  if (!trimmedExpression) {
    return null;
  }

  const separatorIndex = trimmedExpression.indexOf("=");
  if (separatorIndex <= 0 || separatorIndex === trimmedExpression.length - 1) {
    return null;
  }

  const sourceValue = trimmedExpression.slice(0, separatorIndex).trim();
  const expectedValues = trimmedExpression
    .slice(separatorIndex + 1)
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!sourceValue || expectedValues.length === 0) {
    return null;
  }

  return {
    expectedValues,
    sourceValue,
  };
}

export function getRuntimeChecklistAnswerMap(
  checklist: RuntimeFormChecklistData | undefined,
): ReadonlyMap<string, string> {
  const answers = new Map<string, string>();
  for (const group of checklist?.groups ?? []) {
    for (const item of group.items) {
      const answer = item.value?.trim();
      if (item.sourceValue && answer) {
        answers.set(item.sourceValue, answer);
      }
    }
  }
  return answers;
}

export function isRuntimeChecklistItemVisible(
  item: RuntimeFormChecklistItem,
  answersBySourceValue: ReadonlyMap<string, string>,
  referencedSourceValues: ReadonlySet<string> = new Set(),
): boolean {
  if (referencedSourceValues.has(item.sourceValue)) {
    return true;
  }

  if (!item.visibleWhen?.trim()) {
    return true;
  }

  const rule = parseRuntimeChecklistVisibleWhen(item.visibleWhen);
  if (!rule) {
    return false;
  }

  const answer = answersBySourceValue.get(rule.sourceValue)?.trim().toLowerCase();
  if (!answer) {
    return false;
  }

  return rule.expectedValues
    .map((expectedValue) => expectedValue.toLowerCase())
    .includes(answer);
}

export function getRuntimeChecklistVisibleGroups(
  checklist: RuntimeFormChecklistData | undefined,
): RuntimeFormChecklistGroup[] {
  const answersBySourceValue = getRuntimeChecklistAnswerMap(checklist);
  const referencedSourceValues = new Set<string>();
  for (const group of checklist?.groups ?? []) {
    for (const item of group.items) {
      const rule = parseRuntimeChecklistVisibleWhen(item.visibleWhen);
      if (rule) {
        referencedSourceValues.add(rule.sourceValue);
      }
    }
  }

  return (checklist?.groups ?? [])
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        isRuntimeChecklistItemVisible(item, answersBySourceValue, referencedSourceValues),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
