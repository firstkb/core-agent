import type {
  BuilderCollectionId,
  BuilderEntityId,
  BuilderFieldId,
  BuilderJsonValue,
  BuilderOptionSetId,
  BuilderRelationId,
  BuilderSemanticRoleBindingId,
  FieldDataType,
  RelationKind,
  SemanticRole,
} from "./common";

export const MODEL_SOURCE_TYPES = [
  "managed",
  "external_locked",
  "external_mirrored",
] as const;

export type ModelSourceType = (typeof MODEL_SOURCE_TYPES)[number];

export const MODEL_STATUSES = ["draft", "published", "archived"] as const;

export type ModelStatus = (typeof MODEL_STATUSES)[number];

export const FIELD_STATUSES = ["draft", "persisted", "published"] as const;

export type FieldStatus = (typeof FIELD_STATUSES)[number];

export const STORAGE_BINDING_STATUSES = ["projected", "published"] as const;

export type StorageBindingStatus = (typeof STORAGE_BINDING_STATUSES)[number];

export const STORAGE_BINDING_TYPES = ["managed", "external"] as const;

export type StorageBindingType = (typeof STORAGE_BINDING_TYPES)[number];

export type FieldLockState = {
  fieldId: BuilderFieldId;
  isLocked: boolean;
};

export type LockPolicy = {
  fieldLocks?: FieldLockState[];
  modelLocked?: boolean;
  structureLocked?: boolean;
  uiOnlyAuthoringAllowed?: boolean;
  viewLocked?: boolean;
};

export type StorageBinding = {
  bindingType?: StorageBindingType;
  dataViewName?: string;
  storageKey?: string;
  tableName?: string;
};

export type FieldStorageBinding = {
  columnName?: string;
  status?: StorageBindingStatus;
  storageKey?: string;
  tableName?: string;
};

export type ModelDefinition = {
  description?: string;
  displayName?: string;
  fields?: ModelFieldDefinition[];
  guid?: string;
  id: BuilderEntityId;
  key: string;
  lockPolicy?: LockPolicy;
  modelStructureVersion?: number;
  name: string;
  pluralName?: string;
  sourceType?: ModelSourceType;
  status?: ModelStatus;
  storageBinding?: StorageBinding;
  storageKey?: string;
  version?: number | string;
};

export type EntityDefinition = ModelDefinition;

export type OptionSetOption = {
  description?: string;
  label: string;
  value: string;
};

export type OptionSetDefinition = {
  description?: string;
  id: BuilderOptionSetId;
  key: string;
  name: string;
  options: OptionSetOption[];
};

export type ModelFieldDefinition = {
  baseType?: FieldDataType;
  dataType: FieldDataType;
  defaultValue?: BuilderJsonValue;
  description?: string;
  displayName?: string;
  entityId: BuilderEntityId;
  id: BuilderFieldId;
  isPersisted?: boolean;
  key: string;
  label: string;
  lockState?: FieldLockState;
  optionSetId?: BuilderOptionSetId;
  relationId?: BuilderRelationId;
  required?: boolean;
  status?: FieldStatus;
  storage?: FieldStorageBinding;
  storageKey?: string;
  uniqueValue?: boolean;
};

export type FieldDefinition = ModelFieldDefinition;

export type RelationDefinition = {
  id: BuilderRelationId;
  key: string;
  kind: RelationKind;
  label?: string;
  sourceEntityId: BuilderEntityId;
  sourceFieldId?: BuilderFieldId;
  targetEntityId: BuilderEntityId;
};

export type ChildCollectionDefinition = {
  childEntityId: BuilderEntityId;
  id: BuilderCollectionId;
  key: string;
  label: string;
  parentEntityId: BuilderEntityId;
  relationId: BuilderRelationId;
};

export type SemanticRoleBinding = {
  entityId: BuilderEntityId;
  fieldId: BuilderFieldId;
  id: BuilderSemanticRoleBindingId;
  role: SemanticRole;
};
