import type { CollectionTableSearchSuggestionsResponse } from "../index";

export const searchSuggestions: CollectionTableSearchSuggestionsResponse = {
  groups: [
    {
      fieldId: "title",
      items: [
        {
          count: 7,
          fieldId: "title",
          id: "title-guardrail",
          value: "Guardrail",
        },
        {
          count: 4,
          fieldId: "title",
          id: "title-cable",
          value: "Cable",
        },
      ],
      label: "Observation",
    },
    {
      fieldId: "site",
      items: [
        {
          count: 12,
          fieldId: "site",
          id: "site-north-plant",
          value: "North Plant",
        },
        {
          count: 9,
          fieldId: "site",
          id: "site-warehouse-4",
          value: "Warehouse 4",
        },
      ],
      label: "Site",
    },
    {
      fieldId: "status",
      items: [
        {
          count: 18,
          fieldId: "status",
          id: "status-open",
          value: "Open",
        },
        {
          count: 6,
          fieldId: "status",
          id: "status-in-review",
          value: "In review",
        },
      ],
      label: "Status",
    },
  ],
};
