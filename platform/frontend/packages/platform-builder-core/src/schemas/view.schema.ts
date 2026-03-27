import { z } from "zod";

import {
  builderDescriptionSchema,
  builderIdSchema,
  builderKeySchema,
  builderLabelSchema,
  viewChannelSchema,
  viewTypeSchema,
} from "./common.schema";

export const viewSectionNodeSchema = z.object({
  id: builderIdSchema,
  kind: z.literal("section"),
  slots: z.object({
    body: z.array(builderIdSchema),
  }),
  title: builderLabelSchema.optional(),
});

export const viewGroupNodeSchema = z.object({
  id: builderIdSchema,
  kind: z.literal("group"),
  label: builderLabelSchema.optional(),
  slots: z.object({
    body: z.array(builderIdSchema),
  }),
});

export const viewTabsNodeSchema = z.object({
  id: builderIdSchema,
  kind: z.literal("tabs"),
  slots: z.object({
    tabs: z.array(builderIdSchema),
  }),
});

export const viewTabNodeSchema = z.object({
  id: builderIdSchema,
  kind: z.literal("tab"),
  label: builderLabelSchema,
  slots: z.object({
    body: z.array(builderIdSchema),
  }),
});

export const viewFieldNodeSchema = z.object({
  fieldId: builderIdSchema,
  id: builderIdSchema,
  kind: z.literal("field"),
  widgetKey: z.string().trim().min(1),
});

export const viewCollectionNodeSchema = z.object({
  collectionId: builderIdSchema,
  id: builderIdSchema,
  kind: z.literal("collection"),
  presentation: z.enum(["stack", "table"]).optional(),
});

export const viewTextNodeSchema = z.object({
  id: builderIdSchema,
  kind: z.literal("text"),
  text: z.string(),
});

export const viewDividerNodeSchema = z.object({
  id: builderIdSchema,
  kind: z.literal("divider"),
});

export const viewLayoutNodeSchema = z.discriminatedUnion("kind", [
  viewSectionNodeSchema,
  viewGroupNodeSchema,
  viewTabsNodeSchema,
  viewTabNodeSchema,
  viewFieldNodeSchema,
  viewCollectionNodeSchema,
  viewTextNodeSchema,
  viewDividerNodeSchema,
]);

export const viewDefinitionSchema = z.object({
  channel: viewChannelSchema,
  description: builderDescriptionSchema.optional(),
  entityId: builderIdSchema,
  id: builderIdSchema,
  isDefault: z.boolean().optional(),
  key: builderKeySchema,
  nodes: z.array(viewLayoutNodeSchema),
  rootNodeId: builderIdSchema,
  title: builderLabelSchema,
  type: viewTypeSchema,
  variantOf: builderIdSchema.optional(),
});
