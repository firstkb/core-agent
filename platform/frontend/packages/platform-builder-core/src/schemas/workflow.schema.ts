import { z } from "zod";

import {
  builderIdSchema,
  builderJsonValueSchema,
  builderKeySchema,
  builderLabelSchema,
  workflowEventSchema,
} from "./common.schema";

export const workflowStatusDefinitionSchema = z.object({
  colorToken: z.string().trim().min(1).optional(),
  id: builderIdSchema,
  isInitial: z.boolean().optional(),
  key: builderKeySchema,
  label: builderLabelSchema,
});

export const workflowActionBindingSchema = z.object({
  config: z.record(builderJsonValueSchema).optional(),
  event: workflowEventSchema,
  handlerKey: builderKeySchema,
  id: builderIdSchema,
});

export const workflowTransitionDefinitionSchema = z.object({
  actionBindingIds: z.array(builderIdSchema).optional(),
  fromStatusId: builderIdSchema,
  id: builderIdSchema,
  key: builderKeySchema,
  label: builderLabelSchema,
  toStatusId: builderIdSchema,
});

export const workflowDefinitionSchema = z.object({
  actionBindings: z.array(workflowActionBindingSchema).optional(),
  entityId: builderIdSchema,
  id: builderIdSchema,
  key: builderKeySchema,
  name: builderLabelSchema,
  statuses: z.array(workflowStatusDefinitionSchema),
  transitions: z.array(workflowTransitionDefinitionSchema),
});
