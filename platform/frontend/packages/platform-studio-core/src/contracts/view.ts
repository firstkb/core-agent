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

export const VIEW_STATUSES = ["draft", "published", "archived"] as const;

export type ViewStatus = (typeof VIEW_STATUSES)[number];

export const VIEW_WARNING_CODES = [
  "model-structure-changed",
  "field-count-changed",
] as const;

export type ViewWarningCode = (typeof VIEW_WARNING_CODES)[number];

export type ViewLockState = {
  viewLocked?: boolean;
};

export type ViewWarning = {
  code: ViewWarningCode;
  message: string;
};

export type ViewDefinition = {
  channel: ViewChannel;
  description?: string;
  displayName?: string;
  entityId: BuilderEntityId;
  guid?: string;
  id: BuilderViewId;
  isDefault?: boolean;
  key: string;
  lastAlignedModelStructureVersion?: number;
  lockState?: ViewLockState;
  modelId?: BuilderEntityId;
  nodes: ViewLayoutNode[];
  rootNodeId: BuilderNodeId;
  status?: ViewStatus;
  title: string;
  type: ViewType;
  variantOf?: BuilderViewId;
  version?: number | string;
  viewType?: ViewType;
  viewVersion?: number;
  warnings?: ViewWarning[];
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
  title?: string;
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
