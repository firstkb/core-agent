import {
  Badge,
  Card,
  CardContent,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  PlusIcon,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from "@platform/ui-kit";
import {
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactElement,
} from "react";

import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import {
  getNavigationBuilderChildren,
  isNavigationBuilderContainerNode,
  isNavigationBuilderNodeActive,
  navigationBuilderRailItems,
  type NavigationBuilderAddNodeKind,
  type NavigationBuilderNode,
} from "../navigation-builder-state";
import {
  NavigationBuilderNodeIcon,
  NavigationBuilderStatusIcon,
} from "./navigation-builder-icons";

type NavigationBuilderTreePanelProps = {
  activePanel: NavigationBuilderTreePanelValue;
  nodes: ReadonlyArray<NavigationBuilderNode>;
  onAddNode: (kind: NavigationBuilderAddNodeKind, parentId?: string) => void;
  onActivePanelChange: (value: NavigationBuilderTreePanelValue) => void;
  onReorderNode: (activeNodeId: string, overNodeId: string) => void;
  onSelectRailItem: (railItemId: string) => void;
  onSelectNode: (nodeId: string) => void;
  selectedRailItemId: string;
  selectedNodeId: string;
};

export type NavigationBuilderTreePanelValue = "railbar" | "sidebar";

const addNodeLabels: Record<NavigationBuilderAddNodeKind, string> = {
  "app-module": "App module",
  "app-page": "App page",
  "external-link": "Link",
  "form-view": "Form view",
  "menu-group": "Menu group",
  section: "Menu title",
};

const rootAddNodeKinds: ReadonlyArray<NavigationBuilderAddNodeKind> = [
  "section",
  "menu-group",
  "form-view",
  "app-page",
  "external-link",
  "app-module",
];
const nestedAddNodeKinds: ReadonlyArray<NavigationBuilderAddNodeKind> = [
  "menu-group",
  "form-view",
  "app-page",
  "external-link",
  "app-module",
];

function isAddNodeKindDisabled(kind: NavigationBuilderAddNodeKind) {
  return kind === "app-module";
}

function getAddNodeKindsForParent(parentId?: string) {
  return parentId ? nestedAddNodeKinds : rootAddNodeKinds;
}

function getNodeTypeLabel(node: NavigationBuilderNode) {
  switch (node.kind) {
    case "locked-dashboard":
      return "Always shown";
    case "app-module":
      return "Module";
    case "menu-group":
      return "Group";
    case "section":
      return "Menu title";
    case "entry":
      if (node.target?.kind === "form-view" || node.targetKind === "form-view") {
        return "Form view";
      }
      if (node.target?.kind === "app-page" || node.targetKind === "app-page") {
        return "App page";
      }
      if (node.target?.kind === "app-module" || node.targetKind === "app-module") {
        return "App module";
      }
      if (node.target?.kind === "external-link" || node.targetKind === "external-link") {
        return "External link";
      }
      return "Entry";
  }
}

function AddNodeMenu({
  children,
  label,
  onAddNode,
  parentId,
}: {
  children: ReactElement;
  label: string;
  onAddNode: (kind: NavigationBuilderAddNodeKind, parentId?: string) => void;
  parentId?: string;
}) {
  const addKinds = getAddNodeKindsForParent(parentId);

  return (
    <Menu align="end">
      <MenuTrigger>
        {children}
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>{label}</MenuLabel>
        {addKinds.map((kind) => (
          <MenuItem
            disabled={isAddNodeKindDisabled(kind)}
            key={kind}
            onClick={() => onAddNode(kind, parentId)}
            title={isAddNodeKindDisabled(kind) ? "App modules are planned for a later Navigation Builder slice." : undefined}
          >
            {isAddNodeKindDisabled(kind)
              ? `${addNodeLabels[kind]} (later)`
              : addNodeLabels[kind]}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

function canDropOnNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  draggedNodeId: string | null,
  node: NavigationBuilderNode,
) {
  if (!draggedNodeId || node.isLocked) {
    return false;
  }

  const draggedNode = nodes.find((candidate) => candidate.id === draggedNodeId);

  return Boolean(
    draggedNode &&
    !draggedNode.isLocked &&
    draggedNode.id !== node.id &&
    draggedNode.parentId === node.parentId,
  );
}

function TreeNodeRows({
  depth,
  dragOverNodeId,
  draggedNodeId,
  nodes,
  onAddNode,
  onDragEnd,
  onDragOverNode,
  onDragStartNode,
  onDropNode,
  onPointerEndNode,
  onPointerEnterNode,
  onPointerStartNode,
  onSelectNode,
  parentId,
  selectedNodeId,
}: {
  depth: number;
  dragOverNodeId: string | null;
  draggedNodeId: string | null;
  nodes: ReadonlyArray<NavigationBuilderNode>;
  onAddNode: (kind: NavigationBuilderAddNodeKind, parentId?: string) => void;
  onDragEnd: () => void;
  onDragOverNode: (nodeId: string) => void;
  onDragStartNode: (nodeId: string) => void;
  onDropNode: (activeNodeId: string, overNodeId: string) => void;
  onPointerEndNode: (nodeId: string, clientX: number, clientY: number) => void;
  onPointerEnterNode: (nodeId: string) => void;
  onPointerStartNode: (nodeId: string, clientX: number, clientY: number) => void;
  onSelectNode: (nodeId: string) => void;
  parentId?: string;
  selectedNodeId: string;
}) {
  return (
    <>
      {getNavigationBuilderChildren(nodes, parentId).map((node) => {
        const children = isNavigationBuilderContainerNode(node)
          ? getNavigationBuilderChildren(nodes, node.id)
          : [];
        const isSelected = node.id === selectedNodeId;
        const isDragging = draggedNodeId === node.id;
        const isDropTarget = dragOverNodeId === node.id && draggedNodeId !== node.id;
        const canReorderNode = !node.isLocked;
        const canSelectNode = !node.isLocked;
        const isContainerNode = isNavigationBuilderContainerNode(node);
        const isActive = isNavigationBuilderNodeActive(node);
        const addModeLabel = `Add item to ${node.label}`;
        const showsNodeIcon = node.kind !== "section" && (node.kind === "locked-dashboard" || Boolean(node.iconKey));

        function canAcceptCurrentDrag(activeNodeId: string | null) {
          if (!activeNodeId) {
            return !node.isLocked;
          }

          return canDropOnNode(nodes, activeNodeId, node);
        }

        function handleDragOver(event: DragEvent<HTMLDivElement>) {
          if (!canAcceptCurrentDrag(draggedNodeId)) {
            return;
          }

          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragOverNode(node.id);
        }

        return (
          <div className="tenant-web__navigation-builder-tree-branch" key={node.id}>
            <div
              className={`tenant-web__navigation-builder-tree-row${isContainerNode ? " tenant-web__navigation-builder-tree-row--can-add" : ""}${node.kind === "section" ? " tenant-web__navigation-builder-tree-row--section" : ""}${showsNodeIcon ? "" : " tenant-web__navigation-builder-tree-row--no-icon"}${isSelected ? " tenant-web__navigation-builder-tree-row--active" : ""}${isDragging ? " tenant-web__navigation-builder-tree-row--dragging" : ""}${isDropTarget ? " tenant-web__navigation-builder-tree-row--drop-target" : ""}`}
              draggable={canReorderNode}
              onDragEnd={onDragEnd}
              onDragOver={handleDragOver}
              onDragStart={(event) => {
                if (!canReorderNode) {
                  return;
                }

                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", node.id);
                onDragStartNode(node.id);
              }}
              onDrop={(event) => {
                const activeNodeId = event.dataTransfer.getData("text/plain") || draggedNodeId;

                if (!activeNodeId || !canDropOnNode(nodes, activeNodeId, node)) {
                  return;
                }

                event.preventDefault();
                onDropNode(activeNodeId, node.id);
              }}
              onPointerDown={(event) => {
                if (!canReorderNode || event.button !== 0) {
                  return;
                }

                onPointerStartNode(node.id, event.clientX, event.clientY);
              }}
              onPointerEnter={() => {
                if (canReorderNode) {
                  onPointerEnterNode(node.id);
                }
              }}
              onPointerUp={(event) => {
                if (!canReorderNode) {
                  return;
                }

                onPointerEndNode(node.id, event.clientX, event.clientY);
              }}
              style={{
                "--navigation-builder-tree-depth": depth,
              } as CSSProperties}
            >
              <button
                aria-disabled={canSelectNode ? undefined : true}
                className="tenant-web__navigation-builder-tree-row-main"
                draggable={canReorderNode}
                onClick={() => {
                  if (canSelectNode) {
                    onSelectNode(node.id);
                  }
                }}
                type="button"
              >
                {canReorderNode ? (
                  <span className="tenant-web__platform-studio-drag-handle" title="Drag to reorder">
                    <DragHandleIcon />
                  </span>
                ) : (
                  <span aria-hidden="true" className="tenant-web__navigation-builder-drag-placeholder" />
                )}
                {showsNodeIcon ? (
                  <span className="tenant-web__navigation-builder-node-icon">
                    <NavigationBuilderNodeIcon iconKey={node.iconKey} kind={node.kind} />
                  </span>
                ) : null}
                <span className="tenant-web__navigation-builder-tree-copy">
                  <span className="tenant-web__navigation-builder-tree-title">
                    {node.label}
                  </span>
                  {node.kind === "section" ? null : (
                    <span className="tenant-web__navigation-builder-tree-meta">
                      {getNodeTypeLabel(node)}
                    </span>
                  )}
                </span>
                <span className="tenant-web__navigation-builder-tree-flags">
                  {!isActive ? (
                    <Badge
                      appearance="soft"
                      className="tenant-web__navigation-builder-state-badge"
                      size="sm"
                      variant="warning"
                    >
                      <NavigationBuilderStatusIcon status="hidden" />
                    </Badge>
                  ) : null}
                  {isActive && node.status !== "visible" ? (
                    <Badge
                      appearance="soft"
                      className="tenant-web__navigation-builder-state-badge"
                      size="sm"
                      variant={node.status === "broken" ? "danger" : "warning"}
                    >
                      <NavigationBuilderStatusIcon status={node.status} />
                    </Badge>
                  ) : null}
                </span>
              </button>
              {isContainerNode ? (
                <AddNodeMenu
                  label={addModeLabel}
                  onAddNode={onAddNode}
                  parentId={node.id}
                >
                  <button
                    aria-label={addModeLabel}
                    className="tenant-web__navigation-builder-row-add"
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <PlusIcon />
                  </button>
                </AddNodeMenu>
              ) : null}
            </div>
            {children.length > 0 ? (
              <TreeNodeRows
                depth={depth + 1}
                dragOverNodeId={dragOverNodeId}
                draggedNodeId={draggedNodeId}
                nodes={nodes}
                onAddNode={onAddNode}
                onDragEnd={onDragEnd}
                onDragOverNode={onDragOverNode}
                onDragStartNode={onDragStartNode}
                onDropNode={onDropNode}
                onPointerEndNode={onPointerEndNode}
                onPointerEnterNode={onPointerEnterNode}
                onPointerStartNode={onPointerStartNode}
                onSelectNode={onSelectNode}
                parentId={node.id}
                selectedNodeId={selectedNodeId}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function NavigationBuilderRootAddRow({
  onAddNode,
}: {
  onAddNode: (kind: NavigationBuilderAddNodeKind, parentId?: string) => void;
}) {
  return (
    <AddNodeMenu
      label="Add to app menu"
      onAddNode={onAddNode}
    >
      <button
        aria-label="Add item to app menu"
        className="tenant-web__navigation-builder-root-add-row"
        type="button"
      >
        <span className="tenant-web__navigation-builder-root-add-icon">
          <PlusIcon />
        </span>
        <span className="tenant-web__navigation-builder-tree-copy">
          <span className="tenant-web__navigation-builder-tree-title">
            Add item
          </span>
          <span className="tenant-web__navigation-builder-tree-meta">
            Add to app menu
          </span>
        </span>
      </button>
    </AddNodeMenu>
  );
}

function NavigationBuilderRailBarPanel({
  onSelectRailItem,
  selectedRailItemId,
}: {
  onSelectRailItem: (railItemId: string) => void;
  selectedRailItemId: string;
}) {
  return (
    <div className="tenant-web__navigation-builder-rail-list">
      {navigationBuilderRailItems.map((item) => (
        <button
          className={`tenant-web__navigation-builder-rail-row${item.id === selectedRailItemId ? " tenant-web__navigation-builder-rail-row--active" : ""}`}
          key={item.id}
          onClick={() => onSelectRailItem(item.id)}
          type="button"
        >
          <span className="tenant-web__navigation-builder-tree-copy">
            <span className="tenant-web__navigation-builder-tree-title">
              {item.label}
            </span>
            <span className="tenant-web__navigation-builder-tree-meta">
              Utility rail item
            </span>
          </span>
          <span className="tenant-web__navigation-builder-tree-flags">
            {item.status !== "visible" ? (
              <Badge
                appearance="soft"
                className="tenant-web__navigation-builder-state-badge"
                size="sm"
                variant="warning"
              >
                <NavigationBuilderStatusIcon status={item.status} />
              </Badge>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

export function NavigationBuilderTreePanel({
  activePanel,
  nodes,
  onAddNode,
  onActivePanelChange,
  onReorderNode,
  onSelectRailItem,
  onSelectNode,
  selectedRailItemId,
  selectedNodeId,
}: NavigationBuilderTreePanelProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const pointerDragRef = useRef<{
    clientX: number;
    clientY: number;
    nodeId: string;
  } | null>(null);

  function resetDragState() {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    pointerDragRef.current = null;
  }

  return (
    <Card className="tenant-web__platform-studio-panel tenant-web__navigation-builder-panel">
      <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
        <Tabs
          defaultValue="sidebar"
          onValueChange={(value) => onActivePanelChange(value as NavigationBuilderTreePanelValue)}
          value={activePanel}
          variant="surface"
        >
          <div className="tenant-web__platform-studio-panel-static">
            <div className="tenant-web__platform-studio-inspector-tabs tenant-web__navigation-builder-panel-tabs">
              <TabsList>
                <TabsTrigger value="sidebar">App menu</TabsTrigger>
                <TabsTrigger value="railbar">Utility rail</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <PlatformStudioPanelScroll aria-label="Navigation Builder navigation panels">
            <TabsPanel value="sidebar">
              <div className="tenant-web__navigation-builder-tree">
                <TreeNodeRows
                  depth={0}
                  dragOverNodeId={dragOverNodeId}
                  draggedNodeId={draggedNodeId}
                  nodes={nodes}
                  onAddNode={onAddNode}
                  onDragEnd={resetDragState}
                  onDragOverNode={setDragOverNodeId}
                  onDragStartNode={(nodeId) => {
                    setDraggedNodeId(nodeId);
                    setDragOverNodeId(nodeId);
                  }}
                  onDropNode={(activeNodeId, overNodeId) => {
                    onReorderNode(activeNodeId, overNodeId);
                    resetDragState();
                  }}
                  onPointerEndNode={(overNodeId, clientX, clientY) => {
                    const pointerDrag = pointerDragRef.current;

                    if (!pointerDrag) {
                      return;
                    }

                    const movement = Math.hypot(
                      clientX - pointerDrag.clientX,
                      clientY - pointerDrag.clientY,
                    );

                    if (movement > 8 && pointerDrag.nodeId !== overNodeId) {
                      onReorderNode(pointerDrag.nodeId, overNodeId);
                    }

                    resetDragState();
                  }}
                  onPointerEnterNode={(nodeId) => {
                    if (!pointerDragRef.current) {
                      return;
                    }

                    setDragOverNodeId(nodeId);
                  }}
                  onPointerStartNode={(nodeId, clientX, clientY) => {
                    pointerDragRef.current = {
                      clientX,
                      clientY,
                      nodeId,
                    };
                    setDraggedNodeId(nodeId);
                    setDragOverNodeId(nodeId);
                  }}
                  onSelectNode={onSelectNode}
                  selectedNodeId={selectedNodeId}
                />
                <NavigationBuilderRootAddRow onAddNode={onAddNode} />
              </div>
            </TabsPanel>
            <TabsPanel value="railbar">
              <NavigationBuilderRailBarPanel
                onSelectRailItem={onSelectRailItem}
                selectedRailItemId={selectedRailItemId}
              />
            </TabsPanel>
          </PlatformStudioPanelScroll>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DragHandleIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
    >
      <circle cx="7" cy="6" fill="currentColor" r="1.1" />
      <circle cx="13" cy="6" fill="currentColor" r="1.1" />
      <circle cx="7" cy="10" fill="currentColor" r="1.1" />
      <circle cx="13" cy="10" fill="currentColor" r="1.1" />
      <circle cx="7" cy="14" fill="currentColor" r="1.1" />
      <circle cx="13" cy="14" fill="currentColor" r="1.1" />
    </svg>
  );
}
