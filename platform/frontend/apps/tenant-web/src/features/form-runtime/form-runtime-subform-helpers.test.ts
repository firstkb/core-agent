import { describe, expect, it } from "vitest";

import type { RuntimeFormSubformDataById } from "@platform/forms";

import { mergeRuntimeChecklistItemState } from "./form-runtime-subform-helpers";

describe("form runtime subform helpers", () => {
  it("merges checklist item changes into the matching source row only", () => {
    const current: RuntimeFormSubformDataById = {
      checklist: {
        checklist: {
          groups: [
            {
              id: "environmental",
              items: [
                {
                  label: "First question",
                  notes: "old note",
                  savedRowDocGuid: "saved-row-1",
                  sourceValue: "42",
                  value: "Yes",
                  values: {
                    severity: "low",
                  },
                },
                {
                  label: "Second question",
                  notes: "unchanged",
                  sourceValue: "77",
                  value: "N/A",
                },
              ],
              title: "Environmental",
            },
          ],
        },
      },
    };

    const next = mergeRuntimeChecklistItemState(
      current,
      "checklist",
      "42",
      {
        notes: "new note",
        value: "No",
        values: {
          severity: "high",
          status: "open",
        },
      },
      "saved-row-2",
    );

    const nextChecklist = next.checklist?.checklist;
    const currentChecklist = current.checklist?.checklist;
    if (!nextChecklist || !currentChecklist) {
      throw new Error("Expected checklist state.");
    }

    expect(nextChecklist.groups[0]?.items[0]).toMatchObject({
      notes: "new note",
      savedRowDocGuid: "saved-row-2",
      sourceValue: "42",
      value: "No",
      values: {
        severity: "high",
        status: "open",
      },
    });
    expect(nextChecklist.groups[0]?.items[1]).toBe(currentChecklist.groups[0]?.items[1]);
  });

  it("keeps the current state when the subform has no checklist data", () => {
    const current: RuntimeFormSubformDataById = {
      contacts: {
        rows: [
          {
            cells: {},
            id: "row-1",
          },
        ],
      },
    };

    expect(mergeRuntimeChecklistItemState(current, "contacts", "42", {
      value: "Yes",
    })).toBe(current);
  });
});
