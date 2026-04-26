import { type ReactNode } from "react";

import {
  Card,
  CardContent,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from "@platform/ui-kit";

import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";

export type InspectorPanelTabValue = "grid" | "selection" | "view";

type InspectorPanelLabels = {
  grid: string;
  selection: string;
  view: string;
};

type InspectorPanelProps = {
  activeTab: InspectorPanelTabValue;
  children: ReactNode;
  isViewTabAvailable: boolean;
  labels: InspectorPanelLabels;
  onTabChange: (tab: InspectorPanelTabValue) => void;
};

export function InspectorPanel({
  activeTab,
  children,
  isViewTabAvailable,
  labels,
  onTabChange,
}: InspectorPanelProps) {
  return (
    <Card className="tenant-web__platform-studio-panel">
      <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
        <Tabs
          defaultValue="selection"
          onValueChange={(value) => onTabChange(value as InspectorPanelTabValue)}
          value={activeTab}
          variant="surface"
        >
          <div className="tenant-web__platform-studio-panel-static">
            <div className="tenant-web__platform-studio-inspector-tabs">
              <TabsList>
                <TabsTrigger value="selection">{labels.selection}</TabsTrigger>
                <TabsTrigger disabled={!isViewTabAvailable} value="view">{labels.view}</TabsTrigger>
                <TabsTrigger value="grid">{labels.grid}</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <PlatformStudioPanelScroll>
            <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
              {children}
            </div>
          </PlatformStudioPanelScroll>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function InspectorPanelTab({
  children,
  value,
}: {
  children: ReactNode;
  value: InspectorPanelTabValue;
}) {
  return (
    <TabsPanel value={value}>
      {children}
    </TabsPanel>
  );
}
