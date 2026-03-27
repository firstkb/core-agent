import { z } from "zod";

import {
  FIELD_ACCESS_LEVELS,
  FIELD_DATA_TYPES,
  FILTER_OPERATORS,
  NAVIGATION_NODE_TYPES,
  PLATFORM_BUILDER_SCHEMA_VERSION,
  RELATION_KINDS,
  SEMANTIC_ROLES,
  VIEW_CHANNELS,
  VIEW_TYPES,
  WORKFLOW_EVENTS,
  type BuilderJsonValue,
} from "../contracts/common";

export const builderIdSchema = z.string().trim().min(1);
export const builderKeySchema = z.string().trim().regex(/^[a-z][a-z0-9._-]*$/);
export const builderLabelSchema = z.string().trim().min(1);
export const builderDescriptionSchema = z.string().trim().min(1);
export const builderRouteKeySchema = z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/);
export const builderTimestampSchema = z.string().trim().min(1);
export const builderUrlSchema = z.string().url();
export const schemaVersionSchema = z.literal(PLATFORM_BUILDER_SCHEMA_VERSION);

export const fieldDataTypeSchema = z.enum(FIELD_DATA_TYPES);
export const relationKindSchema = z.enum(RELATION_KINDS);
export const semanticRoleSchema = z.enum(SEMANTIC_ROLES);
export const viewTypeSchema = z.enum(VIEW_TYPES);
export const viewChannelSchema = z.enum(VIEW_CHANNELS);
export const navigationNodeTypeSchema = z.enum(NAVIGATION_NODE_TYPES);
export const fieldAccessLevelSchema = z.enum(FIELD_ACCESS_LEVELS);
export const filterOperatorSchema = z.enum(FILTER_OPERATORS);
export const workflowEventSchema = z.enum(WORKFLOW_EVENTS);

export const builderJsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const builderJsonValueSchema: z.ZodType<BuilderJsonValue> = z.lazy(() =>
  z.union([
    builderJsonPrimitiveSchema,
    z.array(builderJsonValueSchema),
    z.record(builderJsonValueSchema),
  ]),
);
