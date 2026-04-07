import { z } from "zod";

import { VISIBILITY_POLICY_MODES } from "../contracts/policy";
import {
  builderDescriptionSchema,
  builderIdSchema,
  builderKeySchema,
  builderLabelSchema,
  builderJsonPrimitiveSchema,
  fieldAccessLevelSchema,
  filterOperatorSchema,
} from "./common.schema";

export const fieldPolicySchema = z.object({
  access: fieldAccessLevelSchema,
  fieldId: builderIdSchema,
});

export const actionPolicySchema = z.object({
  actionKey: builderKeySchema,
  allowed: z.boolean(),
});

export const recordFilterRuleSchema = z.object({
  fieldKey: builderKeySchema,
  operator: filterOperatorSchema,
  value: z.union([
    builderJsonPrimitiveSchema,
    z.array(builderJsonPrimitiveSchema),
  ]),
});

export const visibilityPolicyModeSchema = z.enum(VISIBILITY_POLICY_MODES);

export const visibilityRecipientAssignmentsSchema = z.object({
  companyIds: z.array(builderIdSchema).optional(),
  contactIds: z.array(builderIdSchema).optional(),
  jobTypeIds: z.array(builderIdSchema).optional(),
});

const visibilityPolicyBaseSchema = z.object({
  assignments: visibilityRecipientAssignmentsSchema.optional(),
});

export const pageVisibilityPolicySchema = visibilityPolicyBaseSchema.extend({
  mode: visibilityPolicyModeSchema,
});

const genericVisibilityPolicySchema = visibilityPolicyBaseSchema.extend({
  mode: z.undefined().optional(),
});

export const visibilityPolicySchema = z.union([
  pageVisibilityPolicySchema,
  genericVisibilityPolicySchema,
]);

export const policySetSchema = z.object({
  actionPolicies: z.array(actionPolicySchema).optional(),
  description: builderDescriptionSchema.optional(),
  fieldPolicies: z.array(fieldPolicySchema).optional(),
  id: builderIdSchema,
  key: builderKeySchema,
  name: builderLabelSchema,
  recordFilters: z.array(recordFilterRuleSchema).optional(),
  roleKeys: z.array(builderKeySchema),
  visibility: visibilityPolicySchema.optional(),
});
