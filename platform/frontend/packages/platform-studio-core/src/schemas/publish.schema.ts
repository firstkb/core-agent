import { z } from "zod";

import {
  builderIdSchema,
  builderTimestampSchema,
  schemaVersionSchema,
} from "./common.schema";
import {
  childCollectionDefinitionSchema,
  entityDefinitionSchema,
  fieldDefinitionSchema,
  optionSetDefinitionSchema,
  relationDefinitionSchema,
  semanticRoleBindingSchema,
} from "./model.schema";
import { navigationNodeSchema } from "./navigation.schema";
import { policySetSchema } from "./policy.schema";
import { viewDefinitionSchema } from "./view.schema";
import { workflowDefinitionSchema } from "./workflow.schema";

export const validationIssueSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  path: z.string().trim().min(1),
});

export const validationReportSchema = z.object({
  issues: z.array(validationIssueSchema),
  valid: z.boolean(),
});

export const builderRegistryBundleSchema = z.object({
  childCollections: z.array(childCollectionDefinitionSchema),
  entities: z.array(entityDefinitionSchema),
  fields: z.array(fieldDefinitionSchema),
  navigationNodes: z.array(navigationNodeSchema),
  optionSets: z.array(optionSetDefinitionSchema),
  policies: z.array(policySetSchema),
  relations: z.array(relationDefinitionSchema),
  semanticRoles: z.array(semanticRoleBindingSchema),
  views: z.array(viewDefinitionSchema),
  workflows: z.array(workflowDefinitionSchema),
});

export const draftSnapshotSchema = builderRegistryBundleSchema.extend({
  draftId: builderIdSchema,
  lastValidationReport: validationReportSchema.optional(),
  schemaVersion: schemaVersionSchema,
  snapshotKind: z.literal("draft"),
  updatedAt: builderTimestampSchema,
});

export const publishedManifestSchema = builderRegistryBundleSchema.extend({
  manifestId: builderIdSchema,
  publishedAt: builderTimestampSchema,
  schemaVersion: schemaVersionSchema,
  snapshotKind: z.literal("published"),
  version: z.number().int().positive(),
});
