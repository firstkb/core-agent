export const PLATFORM_BUILDER_SCHEMA_VERSION = 1 as const;

export type BuilderId = string;
export type BuilderDraftId = BuilderId;
export type BuilderManifestId = BuilderId;
export type BuilderEntityId = BuilderId;
export type BuilderFieldId = BuilderId;
export type BuilderRelationId = BuilderId;
export type BuilderCollectionId = BuilderId;
export type BuilderOptionSetId = BuilderId;
export type BuilderSemanticRoleBindingId = BuilderId;
export type BuilderViewId = BuilderId;
export type BuilderNodeId = BuilderId;
export type BuilderNavigationNodeId = BuilderId;
export type BuilderPolicyId = BuilderId;
export type BuilderWorkflowId = BuilderId;
export type BuilderWorkflowStatusId = BuilderId;
export type BuilderWorkflowTransitionId = BuilderId;
export type BuilderActionBindingId = BuilderId;

export const FIELD_DATA_TYPES = [
  "string",
  "text",
  "number",
  "boolean",
  "date",
  "datetime",
  "enum",
  "relation",
  "file",
  "json",
  "computed",
] as const;

export type FieldDataType = (typeof FIELD_DATA_TYPES)[number];

export const RELATION_KINDS = [
  "one-to-one",
  "many-to-one",
  "one-to-many",
  "many-to-many",
] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];

export const SEMANTIC_ROLES = [
  "title",
  "status",
  "date",
  "owner",
  "location",
] as const;

export type SemanticRole = (typeof SEMANTIC_ROLES)[number];

export const VIEW_TYPES = [
  "form",
  "detail",
  "list",
  "checklist",
  "modal",
] as const;

export type ViewType = (typeof VIEW_TYPES)[number];

export const VIEW_CHANNELS = [
  "web",
  "mobile",
  "pwa",
  "public",
] as const;

export type ViewChannel = (typeof VIEW_CHANNELS)[number];

export const NAVIGATION_NODE_TYPES = [
  "group",
  "item",
  "divider",
] as const;

export type NavigationNodeType = (typeof NAVIGATION_NODE_TYPES)[number];

export const FIELD_ACCESS_LEVELS = [
  "hidden",
  "readonly",
  "editable",
] as const;

export type FieldAccessLevel = (typeof FIELD_ACCESS_LEVELS)[number];

export const FILTER_OPERATORS = [
  "eq",
  "neq",
  "in",
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export const WORKFLOW_EVENTS = [
  "manual",
  "onCreate",
  "onSubmit",
  "onApprove",
] as const;

export type WorkflowEvent = (typeof WORKFLOW_EVENTS)[number];

export type BuilderJsonPrimitive = string | number | boolean | null;
export type BuilderJsonValue =
  | BuilderJsonPrimitive
  | BuilderJsonValue[]
  | { [key: string]: BuilderJsonValue };

export type ValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export type ValidationReport = {
  issues: ValidationIssue[];
  valid: boolean;
};
