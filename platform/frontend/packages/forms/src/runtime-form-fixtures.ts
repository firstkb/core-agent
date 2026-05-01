import type {
  RuntimeFormCommitMode,
  RuntimeFormDefinition,
  RuntimeFormMode,
  RuntimeFormValues,
} from "./runtime-form";

export type RuntimeFormFixtureInput = {
  commitMode?: RuntimeFormCommitMode;
  docGuid?: string;
  mode: RuntimeFormMode;
  modelId: string;
  viewId: string;
};

export type RuntimeFormFixture = {
  definition: RuntimeFormDefinition;
  values: RuntimeFormValues;
};

const statusOptions = [
  { label: "Current", value: "current" },
  { label: "Complete", value: "complete" },
] as const;

export function createRuntimeFormFixtureDefinition({
  commitMode = "autosave",
  docGuid,
  mode,
  modelId,
  viewId,
}: RuntimeFormFixtureInput): RuntimeFormDefinition {
  return {
    commitMode,
    description: `${modelId} / ${viewId}${docGuid ? ` / ${docGuid}` : ""}`,
    id: `fixture-${modelId}-${viewId}`,
    mode,
    sections: [
      {
        description: "Core fields used by the runtime record.",
        fields: [
          {
            id: "location",
            label: "Location",
            placeholder: "Enter location",
            required: true,
            type: "short_text",
          },
          {
            id: "inspection_date",
            label: "Date",
            required: true,
            type: "date",
          },
          {
            id: "estimated_hours",
            label: "Estimated hours",
            placeholder: "0.00",
            type: "decimal",
          },
        ],
        id: "summary",
        title: "Summary",
      },
      {
        description: "System and choice fields driven by Form Builder metadata.",
        fields: [
          {
            id: "reported_by",
            label: "Reported by",
            readonly: true,
            type: "system",
          },
          {
            id: "status",
            label: "Status",
            options: statusOptions,
            readonly: true,
            type: "single_select",
          },
          {
            id: "type",
            label: "Type",
            options: [
              { label: "Satisfactory", value: "satisfactory" },
              { label: "Unsatisfactory", value: "unsatisfactory" },
              { label: "Not applicable", value: "not_applicable" },
            ],
            required: true,
            type: "single_select",
          },
          {
            choiceLayout: "inline",
            id: "priority",
            label: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "Normal", value: "normal" },
              { label: "High", value: "high" },
            ],
            type: "radio",
          },
        ],
        id: "workflow",
        title: "Workflow",
      },
      {
        fields: [
          {
            id: "needs_corrective_action",
            label: "Corrective action",
            placeholder: "Requires corrective action",
            type: "boolean",
          },
          {
            id: "reference_note",
            label: "Reference note",
            placeholder: "Full-width single-line field",
            type: "short_text",
            width: "full",
          },
          {
            id: "categories",
            label: "Categories",
            options: [
              { label: "Aerial lifts", value: "aerial_lifts" },
              { label: "Pinchpoints", value: "pinchpoints" },
              { label: "Housekeeping", value: "housekeeping" },
            ],
            required: true,
            type: "multi_select",
          },
          {
            id: "comment",
            label: "Comment",
            placeholder: "Add details",
            rows: 5,
            type: "rich_text",
            width: "full",
          },
        ],
        id: "details",
        title: "Details",
      },
    ],
    title: mode === "create" ? "Start new record" : "Edit record",
    workflowStatus: {
      fieldId: "status",
      finalValue: "complete",
      initialValue: "current",
    },
  };
}

export function createRuntimeFormFixture(input: RuntimeFormFixtureInput): RuntimeFormFixture {
  const definition = createRuntimeFormFixtureDefinition(input);

  if (input.mode === "create") {
    return {
      definition,
      values: {
        categories: [],
        comment: "",
        estimated_hours: "",
        inspection_date: "",
        location: "",
        needs_corrective_action: false,
        priority: "normal",
        reference_note: "",
        reported_by: "Andrii K.",
        status: "",
        type: "",
      },
    };
  }

  return {
    definition,
    values: {
      categories: ["aerial_lifts", "pinchpoints"],
      comment: "Clear and organize wood and debris to maintain neat storage.",
      estimated_hours: "1.50",
      inspection_date: "2026-02-20",
      location: "TEST",
      needs_corrective_action: true,
      priority: "high",
      reference_note: "General SOR layout check",
      reported_by: "Andrii K.",
      status: "current",
      type: "unsatisfactory",
    },
  };
}
