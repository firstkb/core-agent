import type {
  FormBuilderElementCategory as FormBuilderElementCategoryContract,
  FormBuilderNodeType as FormBuilderNodeTypeContract,
  FormBuilderPaletteSectionKey,
  FormBuilderSubformType as FormBuilderSubformTypeContract,
} from "../forms-builder-contract";
import type { FormBuilderLibraryFieldDefinition } from "../forms-builder-library";
import type {
  FormBuilderFilterDefinitions,
  FormBuilderNodeRules,
} from "./form-builder-filter-rule-types";

export type * from "./form-builder-filter-rule-types";

export type FormBuilderElementCategory = FormBuilderElementCategoryContract;
export type FormBuilderNodeType = FormBuilderNodeTypeContract;
export type FormBuilderSubformType = FormBuilderSubformTypeContract;
export type FormBuilderNodeVisibility = "hidden" | "readonly" | "visible";
export type FormBuilderRuntimePreset =
  | "badge"
  | "geo_capture"
  | "radio_chips"
  | "readonly_card"
  | "relation_summary_card"
  | "select"
  | "signature_pad";
export type FormBuilderFieldPaletteCategory = Exclude<
  FormBuilderPaletteSectionKey,
  "content" | "layout" | "systemFields"
>;
export type FormBuilderSystemFields = {
  version: 1;
  reportedBy?: {
    fieldId: string;
  };
  reportedDate?: {
    fieldId: string;
  };
  workflowStatus?: {
    fieldId: string;
    finalValue?: string;
    initialValue?: string;
  };
};
export type FormBuilderViewOnlyBinding =
  | {
      kind: "lookup_derived_output";
      outputKey: string;
      sourceFieldId: string;
    }
  | {
      kind: "root_record_id";
    };
export type FormBuilderGridColumnDefinition = {
  fieldId: string;
  id: string;
  order: number;
  visible: boolean;
};

export type FormBuilderNode = {
  containerKey?: string;
  fieldId?: string;
  helperText?: string;
  id: string;
  order: number;
  parentId: string | null;
  childGridColumns?: ReadonlyArray<FormBuilderGridColumnDefinition>;
  required?: boolean;
  rules?: FormBuilderNodeRules;
  schemaScopeId?: string;
  runtimePreset?: FormBuilderRuntimePreset;
  subformType?: FormBuilderSubformType;
  tableKey?: string;
  text?: string;
  title?: string;
  type: FormBuilderNodeType;
  viewOnlyBinding?: FormBuilderViewOnlyBinding;
  visibility: FormBuilderNodeVisibility;
};

export type FormBuilderViewSettings = {
  actions: {
    canAdd: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canView: boolean;
  };
  correctiveAction: {
    enabled: boolean;
    modelKey: "corrective_action";
    sourceType: "platform_static";
  };
  iconDataUrl?: string;
  list: {
    columns: ReadonlyArray<FormBuilderGridColumnDefinition>;
    sorting: {
      direction: "asc" | "desc";
      fieldId?: string;
    };
  };
};

export type FormBuilderSubformViewSettings = {
  actions: {
    canAdd: boolean;
    canDelete: boolean;
    canEdit: boolean;
  };
  list: {
    columns: ReadonlyArray<FormBuilderGridColumnDefinition>;
    sorting: {
      direction: "asc" | "desc";
      fieldId?: string;
    };
  };
};

export type FormBuilderScopeUiSchema = {
  currentParentId: string | null;
  nodes: ReadonlyArray<FormBuilderNode>;
  selectedNodeId: string | null;
  unplacedFieldIds: ReadonlyArray<string>;
};

export type FormBuilderDataScopeRuntime = {
  dataViewName: string;
  mvTableName?: string;
  rtAlias: string;
  sourceCreatedAtColumn?: string;
  sourceGuidColumn?: string;
  sourceIdColumn?: string;
  sourceTenantIdColumn?: string;
  sourceUpdatedAtColumn?: string;
  tableName: string;
  tenantScoped?: boolean;
};

export type FormBuilderViewScopeRuntime = {
  dataViewName: string;
  gridViewName: string;
  viewRtAlias: string;
};

export type FormBuilderRootScope = {
  dataSchema: {
    fieldIds: ReadonlyArray<string>;
    runtime?: FormBuilderDataScopeRuntime;
  };
  runtime?: FormBuilderViewScopeRuntime;
  scopeId: "root";
  scopeType: "ROOT";
  uiSchema: FormBuilderScopeUiSchema;
};

export type FormBuilderSubformScope = {
  dataSchema: {
    fieldIds: ReadonlyArray<string>;
    runtime?: FormBuilderDataScopeRuntime;
  };
  filterDefinitions: FormBuilderFilterDefinitions;
  parentSubformNodeId: string;
  runtime?: FormBuilderViewScopeRuntime;
  scopeId: string;
  scopeType: "SUBFORM";
  subformType: FormBuilderSubformType;
  tableKey: string;
  uiSchema: FormBuilderScopeUiSchema;
  viewSettings: FormBuilderSubformViewSettings;
};

export type FormBuilderScope = FormBuilderRootScope | FormBuilderSubformScope;

export type FormBuilderDocument = {
  activeScopeId: "root" | string;
  currentParentId: string | null;
  filterDefinitions: FormBuilderFilterDefinitions;
  nodes: ReadonlyArray<FormBuilderNode>;
  rootScope: FormBuilderRootScope;
  selectedNodeId: string | null;
  subformScopes: ReadonlyArray<FormBuilderSubformScope>;
  systemFields: FormBuilderSystemFields;
  viewKind: "detail" | "form";
  viewSettings: FormBuilderViewSettings;
  viewDescription: string;
  viewTitle: string;
};

export type FormBuilderWorkspaceAccess = {
  canAddElementItems: boolean;
  canAddFieldItems: boolean;
  canEditSettings: boolean;
  canMoveItems: boolean;
  canRemoveItems: boolean;
  lockReasonKey: string | null;
  structureLockReasonKey: string | null;
};

export type FormBuilderElementDefinition = {
  category: FormBuilderElementCategory;
  descriptionKey: string;
  iconKey: string;
  initialNode?: {
    subformType?: FormBuilderSubformType;
    title?: string;
  };
  labelKey: string;
  nodeType: Exclude<FormBuilderNodeType, "field">;
  searchTerms: ReadonlyArray<string>;
};

export type FormBuilderElementPaletteItem = FormBuilderElementDefinition & {
  disabled: boolean;
  disabledReasonKey: string | null;
  kind: "element";
};

export type FormBuilderFieldPaletteItem = {
  category: FormBuilderFieldPaletteCategory;
  descriptionKey: string;
  disabled: boolean;
  disabledReasonKey: string | null;
  definition: FormBuilderLibraryFieldDefinition;
  iconKey: string;
  kind: "field";
};

export type FormBuilderPaletteItem = FormBuilderElementPaletteItem | FormBuilderFieldPaletteItem;
