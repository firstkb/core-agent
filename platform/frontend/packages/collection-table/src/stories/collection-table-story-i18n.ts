import type { LocaleResourceTree, LocaleResources } from "@platform/i18n";

const collectionTableMessages = {
  admin: {
    collectionTable: {
      actions: {
        clear: "Clear",
        exportXls: "Export XLS",
        favorite: "Favorite",
        reload: "Reload",
        resetFilters: "Reset filters",
        saveFilterSet: "Save filter set",
        saved: "Saved",
        setActive: "Set active",
        setInactive: "Set inactive",
        startNew: "Start New",
      },
      dialog: {
        cancel: "Cancel",
        placeholder: "Filter name",
        save: "Save",
        title: "Set Filter Name",
        validation: {
          duplicate: "A saved filter with this name already exists.",
          empty: "Enter a filter name.",
        },
      },
      empty: {
        noRecords: "No records found",
      },
      errors: {
        remoteAdapter: "Remote adapter",
        remoteMetadata: "The remote collection adapter did not return metadata. Retry to reload the backend contract.",
        requestFailed: "Collection request failed",
        retryRequest: "Retry request",
      },
      favorite: {
        add: "Add to favorites",
        remove: "Remove from favorites",
      },
      menu: {
        deleteSavedFilter: "Delete saved filter {{label}}",
        moreActions: "More actions",
        noSavedFilters: "No saved filters yet",
        openSavedFilters: "Open saved filters",
        openTableActions: "Open table actions",
        savedFilters: "Saved filters",
      },
      operators: {
        contains: "Contains",
        isEmpty: "is empty",
        isEqualTo: "Is equal to",
        isGreaterOrEqualTo: "Is greater or equal to",
        isGreaterThan: "Is greater than",
        isLessOrEqualTo: "Is less or equal to",
        isLessThan: "Is less than",
        isNotEmpty: "is not empty",
        isNotEqualTo: "Is not equal to",
      },
      pagination: {
        entries: "entries",
        entry: "entry",
        rowsPerPage: "Rows per page",
      },
      rowActions: {
        edit: "Edit",
        moreActions: "More actions",
        openActions: "Open row actions",
        pdf: "PDF",
        view: "View",
      },
      search: {
        all: "All",
        fieldAria: "Search field",
        inputAria: "Search records",
        operatorAria: "Search operator",
        placeholder: "Search...",
        pressEnter: "Press Enter to apply",
        selectDate: "Select date",
      },
      selection: {
        bulkActions: "Bulk actions",
        confirm: "Confirm",
        confirmTitle: "Confirm bulk action",
        selectAllVisible: "Select all visible rows",
        selectedCount: "{{count}} selected",
        selectRow: "Select {{label}}",
      },
    },
  },
} satisfies LocaleResourceTree;

export const collectionTableStoryResources: LocaleResources = {
  en: collectionTableMessages,
  es: collectionTableMessages,
};
