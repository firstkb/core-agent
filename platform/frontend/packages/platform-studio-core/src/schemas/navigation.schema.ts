import { z } from "zod";

import {
  builderIdSchema,
  builderKeySchema,
  builderLabelSchema,
  builderRouteKeySchema,
  builderUrlSchema,
  viewChannelSchema,
} from "./common.schema";

export const navigationTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("view"),
    viewId: builderIdSchema,
  }),
  z.object({
    kind: z.literal("system-module"),
    moduleKey: builderKeySchema,
  }),
  z.object({
    kind: z.literal("external-link"),
    url: builderUrlSchema,
  }),
]);

const navigationNodeBaseSchema = z.object({
  id: builderIdSchema,
  order: z.number().int().nonnegative(),
  parentId: builderIdSchema.optional(),
});

export const navigationGroupNodeSchema = navigationNodeBaseSchema.extend({
  icon: z.string().trim().min(1).optional(),
  label: builderLabelSchema,
  type: z.literal("group"),
});

export const navigationItemNodeSchema = navigationNodeBaseSchema.extend({
  channels: z.array(viewChannelSchema).optional(),
  icon: z.string().trim().min(1).optional(),
  label: builderLabelSchema,
  routeKey: builderRouteKeySchema,
  target: navigationTargetSchema,
  type: z.literal("item"),
  visibilityPolicyId: builderIdSchema.optional(),
});

export const navigationDividerNodeSchema = navigationNodeBaseSchema.extend({
  type: z.literal("divider"),
});

export const navigationNodeSchema = z.discriminatedUnion("type", [
  navigationGroupNodeSchema,
  navigationItemNodeSchema,
  navigationDividerNodeSchema,
]);
