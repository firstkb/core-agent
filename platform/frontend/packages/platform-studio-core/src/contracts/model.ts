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

export type ModelDefinition = {
  description?: string;
  id: BuilderEntityId;
  key: string;
  name: string;
  pluralName?: string;
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
  dataType: FieldDataType;
  defaultValue?: BuilderJsonValue;
  description?: string;
  entityId: BuilderEntityId;
  id: BuilderFieldId;
  key: string;
  label: string;
  optionSetId?: BuilderOptionSetId;
  relationId?: BuilderRelationId;
  required?: boolean;
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
