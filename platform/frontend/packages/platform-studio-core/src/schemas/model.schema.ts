import { z } from "zod";

import {
  FIELD_STATUSES,
  MODEL_SOURCE_TYPES,
  MODEL_STATUSES,
  STORAGE_BINDING_STATUSES,
  STORAGE_BINDING_TYPES,
} from "../contracts/model";
import {
  builderDescriptionSchema,
  builderIdSchema,
  builderJsonValueSchema,
  builderKeySchema,
  builderLabelSchema,
  fieldDataTypeSchema,
  relationKindSchema,
  semanticRoleSchema,
} from "./common.schema";

export const entityDefinitionSchema = z.object({
  description: builderDescriptionSchema.optional(),
  id: builderIdSchema,
  key: builderKeySchema,
  name: builderLabelSchema,
  pluralName: builderLabelSchema.optional(),
});

export const modelSourceTypeSchema = z.enum(MODEL_SOURCE_TYPES);
export const modelStatusSchema = z.enum(MODEL_STATUSES);
export const fieldStatusSchema = z.enum(FIELD_STATUSES);
export const storageBindingStatusSchema = z.enum(STORAGE_BINDING_STATUSES);
export const storageBindingTypeSchema = z.enum(STORAGE_BINDING_TYPES);

export const fieldLockStateSchema = z.object({
  fieldId: builderIdSchema,
  isLocked: z.boolean(),
});

export const lockPolicySchema = z.object({
  fieldLocks: z.array(fieldLockStateSchema).optional(),
  modelLocked: z.boolean().optional(),
  structureLocked: z.boolean().optional(),
  uiOnlyAuthoringAllowed: z.boolean().optional(),
  viewLocked: z.boolean().optional(),
});

export const storageBindingSchema = z.object({
  bindingType: storageBindingTypeSchema.optional(),
  dataViewName: builderKeySchema.optional(),
  storageKey: builderKeySchema.optional(),
  tableName: builderKeySchema.optional(),
});

export const fieldStorageBindingSchema = z.object({
  columnName: builderKeySchema.optional(),
  status: storageBindingStatusSchema.optional(),
  storageKey: builderKeySchema.optional(),
  tableName: builderKeySchema.optional(),
});

export const optionSetOptionSchema = z.object({
  description: builderDescriptionSchema.optional(),
  label: builderLabelSchema,
  value: z.string().min(1),
});

export const optionSetDefinitionSchema = z.object({
  description: builderDescriptionSchema.optional(),
  id: builderIdSchema,
  key: builderKeySchema,
  name: builderLabelSchema,
  options: z.array(optionSetOptionSchema),
});

export const fieldDefinitionSchema = z.object({
  baseType: fieldDataTypeSchema.optional(),
  dataType: fieldDataTypeSchema,
  defaultValue: builderJsonValueSchema.optional(),
  description: builderDescriptionSchema.optional(),
  displayName: builderLabelSchema.optional(),
  entityId: builderIdSchema,
  id: builderIdSchema,
  isPersisted: z.boolean().optional(),
  key: builderKeySchema,
  label: builderLabelSchema,
  lockState: fieldLockStateSchema.optional(),
  optionSetId: builderIdSchema.optional(),
  relationId: builderIdSchema.optional(),
  required: z.boolean().optional(),
  status: fieldStatusSchema.optional(),
  storage: fieldStorageBindingSchema.optional(),
  storageKey: builderKeySchema.optional(),
});

export const modelDefinitionSchema = entityDefinitionSchema.extend({
  displayName: builderLabelSchema.optional(),
  fields: z.array(fieldDefinitionSchema).optional(),
  guid: builderIdSchema.optional(),
  lockPolicy: lockPolicySchema.optional(),
  modelStructureVersion: z.number().int().nonnegative().optional(),
  sourceType: modelSourceTypeSchema.optional(),
  status: modelStatusSchema.optional(),
  storageBinding: storageBindingSchema.optional(),
  storageKey: builderKeySchema.optional(),
  version: z
    .union([z.number().int().nonnegative(), z.string().trim().min(1)])
    .optional(),
});

export const modelFieldDefinitionSchema = fieldDefinitionSchema;

export const relationDefinitionSchema = z.object({
  id: builderIdSchema,
  key: builderKeySchema,
  kind: relationKindSchema,
  label: builderLabelSchema.optional(),
  sourceEntityId: builderIdSchema,
  sourceFieldId: builderIdSchema.optional(),
  targetEntityId: builderIdSchema,
});

export const childCollectionDefinitionSchema = z.object({
  childEntityId: builderIdSchema,
  id: builderIdSchema,
  key: builderKeySchema,
  label: builderLabelSchema,
  parentEntityId: builderIdSchema,
  relationId: builderIdSchema,
});

export const semanticRoleBindingSchema = z.object({
  entityId: builderIdSchema,
  fieldId: builderIdSchema,
  id: builderIdSchema,
  role: semanticRoleSchema,
});
