import { z } from "zod";

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

export const modelDefinitionSchema = entityDefinitionSchema;

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
  dataType: fieldDataTypeSchema,
  defaultValue: builderJsonValueSchema.optional(),
  description: builderDescriptionSchema.optional(),
  entityId: builderIdSchema,
  id: builderIdSchema,
  key: builderKeySchema,
  label: builderLabelSchema,
  optionSetId: builderIdSchema.optional(),
  relationId: builderIdSchema.optional(),
  required: z.boolean().optional(),
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
