import type {
  BuilderCollectionId,
  BuilderEntityId,
  BuilderFieldId,
  BuilderNodeId,
  BuilderViewId,
  ViewChannel,
  ViewType,
} from "./common";

export const VIEW_LAYOUT_NODE_KINDS = [
  "section",
  "group",
  "tabs",
  "tab",
  "field",
  "collection",
  "text",
  "divider",
] as const;

export type ViewLayoutNodeKind = (typeof VIEW_LAYOUT_NODE_KINDS)[number];

export type ViewDefinition = {
  channel: ViewChannel;
  description?: string;
  entityId: BuilderEntityId;
  id: BuilderViewId;
  isDefault?: boolean;
  key: string;
  nodes: ViewLayoutNode[];
  rootNodeId: BuilderNodeId;
  title: string;
  type: ViewType;
  variantOf?: BuilderViewId;
};

export type ViewSectionNode = {
  id: BuilderNodeId;
  kind: "section";
  slots: { body: BuilderNodeId[] };
  title?: string;
};

export type ViewGroupNode = {
  id: BuilderNodeId;
  kind: "group";
  label?: string;
  slots: { body: BuilderNodeId[] };
};

export type ViewTabsNode = {
  id: BuilderNodeId;
  kind: "tabs";
  slots: { tabs: BuilderNodeId[] };
};

export type ViewTabNode = {
  id: BuilderNodeId;
  kind: "tab";
  label: string;
  slots: { body: BuilderNodeId[] };
};

export type ViewFieldNode = {
  fieldId: BuilderFieldId;
  id: BuilderNodeId;
  kind: "field";
  widgetKey: string;
};

export type ViewCollectionNode = {
  collectionId: BuilderCollectionId;
  id: BuilderNodeId;
  kind: "collection";
  presentation?: "stack" | "table";
};

export type ViewTextNode = {
  id: BuilderNodeId;
  kind: "text";
  text: string;
};

export type ViewDividerNode = {
  id: BuilderNodeId;
  kind: "divider";
};

export type ViewLayoutNode =
  | ViewSectionNode
  | ViewGroupNode
  | ViewTabsNode
  | ViewTabNode
  | ViewFieldNode
  | ViewCollectionNode
  | ViewTextNode
  | ViewDividerNode;
