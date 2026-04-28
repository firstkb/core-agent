import type { CollectionTableMetaResponse } from "../index";

export const safetyTableMeta: CollectionTableMetaResponse = {
  actions: {
    create: {
      label: "New observation",
      visible: true,
    },
    exportXls: {
      visible: true,
    },
    favorite: {
      isFavorite: false,
      visible: true,
    },
    reload: {
      visible: true,
    },
  },
  bulkActions: [
    {
      id: "mark-reviewed",
      kind: "state-change",
      label: "Mark reviewed",
      tone: "success",
    },
  ],
  columns: [
    {
      defaultVisible: true,
      fieldId: "title",
      id: "title",
      label: "Observation",
      type: "text",
      width: "minmax(220px, 1.5fr)",
    },
    {
      defaultVisible: true,
      fieldId: "site",
      id: "site",
      label: "Site",
      type: "text",
      width: "minmax(150px, 1fr)",
    },
    {
      defaultVisible: true,
      fieldId: "status",
      id: "status",
      label: "Status",
      type: "badge",
      width: "120px",
    },
    {
      defaultVisible: true,
      fieldId: "risk",
      id: "risk",
      label: "Risk",
      type: "badge",
      width: "110px",
    },
    {
      defaultVisible: true,
      fieldId: "owner",
      id: "owner",
      label: "Owner",
      type: "text",
      width: "minmax(140px, 1fr)",
    },
    {
      align: "right",
      defaultVisible: true,
      fieldId: "updated_at",
      id: "updated_at",
      label: "Updated",
      type: "date",
      width: "130px",
    },
  ],
  defaultSort: {
    columnId: "updated_at",
    direction: "desc",
  },
  fields: [
    {
      id: "title",
      label: "Observation",
      searchable: true,
      sortable: true,
      suggestable: true,
      type: "text",
    },
    {
      id: "site",
      label: "Site",
      searchable: true,
      sortable: true,
      suggestable: true,
      type: "text",
    },
    {
      id: "status",
      label: "Status",
      searchable: true,
      sortable: true,
      suggestable: true,
      type: "badge",
    },
    {
      id: "risk",
      label: "Risk",
      searchable: true,
      sortable: true,
      suggestable: true,
      type: "badge",
    },
    {
      id: "owner",
      label: "Owner",
      searchable: true,
      sortable: true,
      suggestable: true,
      type: "text",
    },
    {
      id: "updated_at",
      label: "Updated",
      searchable: true,
      sortable: true,
      suggestable: false,
      type: "date",
    },
    {
      id: "summary",
      label: "Summary",
      searchable: true,
      sortable: false,
      suggestable: false,
      type: "text",
    },
  ],
  pageSizeOptions: [5, 10, 25],
  rowActions: [
    {
      execution: "frontend",
      id: "view",
      kind: "button",
      label: "View",
    },
    {
      execution: "backend",
      id: "pdf",
      kind: "button",
      label: "PDF",
    },
  ],
  rowLayout: {
    secondaryRowFieldId: "summary",
  },
  savedFilterSets: [
    {
      id: "open-high-risk",
      label: "Open high risk",
      quickFilters: [
        {
          fieldId: "status",
          id: "status-open",
          operator: "is_equal_to",
          value: "Open",
        },
        {
          fieldId: "risk",
          id: "risk-high",
          operator: "is_equal_to",
          value: "High",
        },
      ],
    },
  ],
  search: {
    defaultFieldId: "all",
    placeholder: "Search observations...",
  },
  selection: {
    columnPosition: "leading",
    enabled: true,
    mode: "multi",
  },
  surfaceId: "story-safety-observations",
  title: "Safety observations",
};
