import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
} from "@platform/ui-kit";

import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import {
  BuilderCanvasNodeRow,
  type BuilderCanvasNodeItem,
  type BuilderCanvasNodeVisibility,
} from "./builder-canvas-node-row";

export type {
  BuilderCanvasNodeItem,
  BuilderCanvasNodeVisibility,
};

export type BuilderCanvasBreadcrumbItem = {
  id: string;
  label: string;
};

export type BuilderCanvasUnplacedFieldItem = {
  id: string;
  label: string;
  summary: string;
};

type BuilderCanvasProps = {
  breadcrumbItems: ReadonlyArray<BuilderCanvasBreadcrumbItem>;
  canEditVisibility: boolean;
  canMoveItems: boolean;
  canPlaceUnplacedFields: boolean;
  canvasEmptyText: string;
  currentLevelId: string | null;
  currentLevelBadgeLabel: string;
  currentLevelLabel: string;
  dragToReorderLabel: string;
  dragOverNodeId: string | null;
  draggedNodeId: string | null;
  nodeItems: ReadonlyArray<BuilderCanvasNodeItem>;
  onDragEnd: () => void;
  onDragOverNode: (nodeId: string) => void;
  onDragStartNode: (nodeId: string) => void;
  onDropNode: (nodeId: string) => void;
  onOpenBreadcrumb: (nodeId: string) => void;
  onOpenLevel: (nodeId: string) => void;
  onOpenRoot: () => void;
  onPlaceUnplacedField: (fieldId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleVisibility: (nodeId: string, visibility: BuilderCanvasNodeVisibility) => void;
  openWorkspaceLabel: string;
  rootLevelLabel: string;
  selectedNodeId: string | null;
  title: string;
  unplacedFields: ReadonlyArray<BuilderCanvasUnplacedFieldItem>;
  unplacedFieldsDescription: string;
  unplacedFieldsHint: string | null;
  unplacedFieldsPlaceActionLabel: string;
  unplacedFieldsTitle: string;
  visibilityLabels: Record<BuilderCanvasNodeVisibility, string>;
};

export function BuilderCanvas({
  breadcrumbItems,
  canEditVisibility,
  canMoveItems,
  canPlaceUnplacedFields,
  canvasEmptyText,
  currentLevelId,
  currentLevelBadgeLabel,
  currentLevelLabel,
  dragToReorderLabel,
  dragOverNodeId,
  draggedNodeId,
  nodeItems,
  onDragEnd,
  onDragOverNode,
  onDragStartNode,
  onDropNode,
  onOpenBreadcrumb,
  onOpenLevel,
  onOpenRoot,
  onPlaceUnplacedField,
  onSelectNode,
  onToggleVisibility,
  openWorkspaceLabel,
  rootLevelLabel,
  selectedNodeId,
  title,
  unplacedFields,
  unplacedFieldsDescription,
  unplacedFieldsHint,
  unplacedFieldsPlaceActionLabel,
  unplacedFieldsTitle,
  visibilityLabels,
}: BuilderCanvasProps) {
  return (
    <Card className="tenant-web__platform-studio-panel">
      <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
        <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
          <div className="tenant-web__platform-studio-workspace-header">
            <p className="tenant-web__platform-studio-workspace-title">{title}</p>
            <Breadcrumb className="tenant-web__platform-studio-workspace-breadcrumbs">
              <BreadcrumbList className="tenant-web__platform-studio-workspace-breadcrumb-list">
                {breadcrumbItems.length > 0 ? (
                  <>
                    <BreadcrumbItem>
                      <button
                        className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--button"
                        onClick={onOpenRoot}
                        type="button"
                      >
                        {rootLevelLabel}
                      </button>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                      <span className="tenant-web__platform-studio-workspace-breadcrumb-separator">/</span>
                    </BreadcrumbSeparator>
                    {breadcrumbItems.map((item, index) => {
                      const isLast = index === breadcrumbItems.length - 1;

                      return (
                        <Fragment key={item.id}>
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage>
                                <span className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--active">
                                  {item.label}
                                </span>
                              </BreadcrumbPage>
                            ) : (
                              <button
                                className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--button"
                                onClick={() => onOpenBreadcrumb(item.id)}
                                type="button"
                              >
                                {item.label}
                              </button>
                            )}
                          </BreadcrumbItem>
                          {!isLast ? (
                            <BreadcrumbSeparator>
                              <span className="tenant-web__platform-studio-workspace-breadcrumb-separator">/</span>
                            </BreadcrumbSeparator>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      <span className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--active">
                        {currentLevelLabel}
                      </span>
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <PlatformStudioPanelScroll>
          <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--compact-x tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
            <div className="tenant-web__platform-studio-canvas-list">
              {nodeItems.length > 0 ? (
                nodeItems.map((item) => (
                  <BuilderCanvasNodeRow
                    canEditVisibility={canEditVisibility}
                    canMoveItems={canMoveItems}
                    currentLevelId={currentLevelId}
                    dragOverNodeId={dragOverNodeId}
                    draggedNodeId={draggedNodeId}
                    item={item}
                    key={item.id}
                    onDragEnd={onDragEnd}
                    onDragOverNode={() => onDragOverNode(item.id)}
                    onDragStartNode={() => onDragStartNode(item.id)}
                    onDropNode={() => onDropNode(item.id)}
                    onOpenLevel={() => onOpenLevel(item.id)}
                    onSelect={() => onSelectNode(item.id)}
                    onToggleVisibility={() => onToggleVisibility(item.id, item.visibility)}
                    currentLevelBadgeLabel={currentLevelBadgeLabel}
                    dragToReorderLabel={dragToReorderLabel}
                    openWorkspaceLabel={openWorkspaceLabel}
                    selectedNodeId={selectedNodeId}
                    visibilityLabels={visibilityLabels}
                  />
                ))
              ) : (
                <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                  <p>{canvasEmptyText}</p>
                </div>
              )}
            </div>

            {unplacedFields.length > 0 ? (
              <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                  <span>{unplacedFieldsTitle}</span>
                </div>
                <p className="tenant-web__platform-studio-inline-help">
                  {unplacedFieldsDescription}
                </p>

                <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                  {unplacedFields.map((field) => (
                    <div className="tenant-web__platform-studio-compact-row" key={`unplaced-${field.id}`}>
                      <div className="tenant-web__platform-studio-compact-row-main">
                        <span className="tenant-web__platform-studio-compact-row-label">
                          {field.label}
                        </span>
                        <span className="tenant-web__platform-studio-compact-row-summary">
                          {field.summary}
                        </span>
                      </div>
                      <Button
                        disabled={!canPlaceUnplacedFields}
                        onClick={() => onPlaceUnplacedField(field.id)}
                        size="sm"
                        variant="secondary"
                      >
                        {unplacedFieldsPlaceActionLabel}
                      </Button>
                    </div>
                  ))}
                </div>

                {unplacedFieldsHint ? (
                  <p className="tenant-web__platform-studio-inline-help">
                    {unplacedFieldsHint}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </PlatformStudioPanelScroll>
      </CardContent>
    </Card>
  );
}
