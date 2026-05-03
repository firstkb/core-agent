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
        nodes: [
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
            id: "summary-help",
            content: "Basic fields cover text, numbers, dates, booleans, and long-form values before relationships or presets are added.",
            contentType: "text",
            nodeType: "content",
            styleVariant: "muted",
            width: "full",
          },
          {
            id: "schedule-grid",
            layoutType: "grid",
            nodeType: "layout",
            nodes: [
              {
                id: "estimated_hours",
                label: "Estimated hours",
                placeholder: "0.00",
                type: "decimal",
              },
              {
                id: "crew_size",
                label: "Crew size",
                placeholder: "0",
                type: "integer",
              },
              {
                id: "estimated_cost",
                label: "Estimated cost",
                placeholder: "0.00",
                type: "currency",
              },
              {
                id: "follow_up_at",
                label: "Follow-up",
                type: "date_time",
              },
            ],
            title: "Schedule and estimate",
            width: "full",
          },
        ],
        id: "summary",
        title: "Summary",
      },
      {
        description: "System and choice fields driven by Form Builder metadata.",
        nodes: [
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
            choiceOrientation: "horizontal",
            choiceRenderStyle: "buttons",
            id: "priority",
            label: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "Normal", value: "normal" },
              { label: "High", value: "high" },
            ],
            type: "single_select",
          },
        ],
        id: "workflow",
        title: "Workflow",
      },
      {
        nodes: [
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
            id: "detail-heading",
            alignment: "left",
            content: "Additional runtime coverage",
            contentType: "heading",
            level: 3,
            nodeType: "content",
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
            description: "A compact group for helper, disabled, and readonly field states.",
            id: "field-state-group",
            layoutType: "group",
            nodeType: "layout",
            nodes: [
              {
                helperText: "Example of field-level helper text from Form Builder.",
                id: "external_ticket",
                label: "External ticket",
                placeholder: "Ticket or reference",
                type: "short_text",
              },
              {
                disabled: true,
                helperText: "Disabled fields keep their footprint but do not accept edits.",
                id: "review_owner",
                label: "Review owner",
                placeholder: "Assigned reviewer",
                type: "short_text",
              },
              {
                id: "calculated_score",
                label: "Calculated score",
                readonly: true,
                type: "readonly",
              },
              {
                choiceOrientation: "vertical",
                choiceRenderStyle: "buttons",
                id: "follow_up_route",
                label: "Follow-up route",
                options: [
                  { label: "No follow-up", value: "none" },
                  { label: "Supervisor review", value: "supervisor" },
                  { label: "Safety meeting", value: "meeting" },
                ],
                type: "single_select",
              },
            ],
            title: "Field state examples",
            width: "full",
          },
          {
            id: "failed-note",
            content: "Unsatisfactory records should include enough detail for a follow-up action plan.",
            contentType: "text",
            nodeType: "content",
            rules: {
              visibilityRules: [
                {
                  effect: "show",
                  id: "show-when-unsatisfactory",
                  when: {
                    all: [
                      {
                        fieldId: "type",
                        operator: "eq",
                        value: "unsatisfactory",
                      },
                    ],
                  },
                },
              ],
            },
            styleVariant: "info",
            width: "full",
          },
          {
            id: "details-divider",
            label: "Notes",
            layoutType: "divider",
            nodeType: "layout",
            width: "full",
          },
          {
            id: "details-spacer",
            layoutType: "spacer",
            nodeType: "layout",
            size: "sm",
            width: "full",
          },
          {
            id: "comment",
            label: "Comment",
            placeholder: "Add details",
            rows: 5,
            rules: {
              requirementRules: [
                {
                  effect: "required",
                  id: "require-comment-for-ca",
                  when: {
                    all: [
                      {
                        fieldId: "needs_corrective_action",
                        operator: "eq",
                        value: true,
                      },
                    ],
                  },
                },
              ],
            },
            type: "rich_text",
            width: "full",
          },
          {
            defaultTabId: "review-output",
            id: "operator-tabs",
            layoutType: "tabs",
            nodeType: "layout",
            scrollable: true,
            styleVariant: "surface",
            tabs: [
              {
                id: "field-notes",
                nodes: [
                  {
                    id: "work_scope",
                    label: "Work scope",
                    placeholder: "Describe the affected work scope",
                    rows: 4,
                    type: "long_text",
                    width: "full",
                  },
                ],
                title: "Notes",
              },
              {
                id: "review-output",
                nodes: [
                  {
                    contentType: "view_only_field",
                    id: "record-preview",
                    label: "Runtime output",
                    nodeType: "content",
                    value: "View-only content placeholder",
                    width: "full",
                  },
                  {
                    id: "review_result",
                    label: "Review result",
                    options: [
                      { label: "Pending", value: "pending" },
                      { label: "Accepted", value: "accepted" },
                      { label: "Needs revision", value: "needs_revision" },
                    ],
                    placeholder: "Select review result",
                    type: "single_select",
                    width: "full",
                  },
                ],
                title: "Review",
              },
              {
                id: "measurement-output",
                nodes: [
                  {
                    id: "risk_score",
                    label: "Risk score",
                    placeholder: "0",
                    type: "integer",
                  },
                  {
                    id: "estimated_material_cost",
                    label: "Material cost",
                    placeholder: "0.00",
                    type: "currency",
                  },
                ],
                title: "Measurements",
              },
              {
                id: "distribution-output",
                nodes: [
                  {
                    choiceOrientation: "horizontal",
                    choiceRenderStyle: "buttons",
                    id: "notify_groups",
                    label: "Notify groups",
                    options: [
                      { label: "Operations", value: "operations" },
                      { label: "Safety", value: "safety" },
                      { label: "Leadership", value: "leadership" },
                    ],
                    type: "multi_select",
                    width: "full",
                  },
                ],
                title: "Distribution",
              },
              {
                id: "history-output",
                nodes: [
                  {
                    content: "History content is display-only in this fixture. Runtime write behavior remains a backend-gated slice.",
                    contentType: "text",
                    id: "history-note",
                    nodeType: "content",
                    styleVariant: "muted",
                    width: "full",
                  },
                ],
                title: "History",
              },
            ],
            width: "full",
          },
          {
            id: "guidance-accordion",
            items: [
              {
                id: "guidance-1",
                nodes: [
                  {
                    content: "Content blocks are authored display nodes. They do not create model-backed editable values.",
                    contentType: "rich_text_block",
                    id: "guidance-copy",
                    nodeType: "content",
                    width: "full",
                  },
                ],
                title: "Runtime guidance",
              },
            ],
            layoutType: "accordion",
            nodeType: "layout",
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
        calculated_score: "",
        comment: "",
        crew_size: "",
        estimated_material_cost: "",
        estimated_hours: "",
        estimated_cost: "",
        external_ticket: "",
        follow_up_route: "none",
        follow_up_at: "",
        inspection_date: "",
        location: "",
        needs_corrective_action: false,
        notify_groups: [],
        priority: "normal",
        reference_note: "",
        reported_by: "Andrii K.",
        review_owner: "",
        review_result: "",
        risk_score: "",
        status: "",
        type: "",
        work_scope: "",
      },
    };
  }

  return {
    definition,
    values: {
      categories: ["aerial_lifts", "pinchpoints"],
      calculated_score: "82",
      comment: "Clear and organize wood and debris to maintain neat storage.",
      crew_size: "3",
      estimated_material_cost: "425.00",
      estimated_hours: "1.50",
      estimated_cost: "850.00",
      external_ticket: "EXT-1042",
      follow_up_route: "supervisor",
      follow_up_at: "2026-02-21T08:00",
      inspection_date: "2026-02-20",
      location: "TEST",
      needs_corrective_action: true,
      notify_groups: ["operations", "safety"],
      priority: "high",
      reference_note: "General SOR layout check",
      reported_by: "Andrii K.",
      review_owner: "Safety lead",
      review_result: "pending",
      risk_score: "7",
      status: "current",
      type: "unsatisfactory",
      work_scope: "Exterior staging area and material storage lanes.",
    },
  };
}
