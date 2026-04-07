import type {
  BuilderNavigationNodeId,
  BuilderPolicyId,
  BuilderViewId,
  ViewChannel,
} from "./common";

export type NavigationTarget =
  | { kind: "view"; viewId: BuilderViewId }
  | { kind: "system-module"; moduleKey: string }
  | { kind: "external-link"; url: string };

type NavigationNodeBase = {
  id: BuilderNavigationNodeId;
  order: number;
  parentId?: BuilderNavigationNodeId;
};

export type NavigationGroupNode = NavigationNodeBase & {
  icon?: string;
  label: string;
  type: "group";
};

export type NavigationItemNode = NavigationNodeBase & {
  channels?: ViewChannel[];
  icon?: string;
  label: string;
  routeKey: string;
  target: NavigationTarget;
  type: "item";
  visibilityPolicyId?: BuilderPolicyId;
};

export type NavigationDividerNode = NavigationNodeBase & {
  type: "divider";
};

export type NavigationNode =
  | NavigationGroupNode
  | NavigationItemNode
  | NavigationDividerNode;
