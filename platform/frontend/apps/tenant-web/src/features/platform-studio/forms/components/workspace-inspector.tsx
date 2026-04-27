import { type ReactNode } from "react";

import { type useTranslation } from "@platform/i18n";

import {
  InspectorPanel,
  InspectorPanelTab,
  type InspectorPanelTabValue,
} from "./inspector-panel";

export type { InspectorPanelTabValue } from "./inspector-panel";

type Translate = ReturnType<typeof useTranslation>["t"];

type WorkspaceInspectorProps = {
  activeTab: InspectorPanelTabValue;
  gridTab: ReactNode;
  isViewTabAvailable: boolean;
  onTabChange: (tab: InspectorPanelTabValue) => void;
  selectionTab: ReactNode;
  t: Translate;
  viewTab: ReactNode;
};

export function WorkspaceInspector({
  activeTab,
  gridTab,
  isViewTabAvailable,
  onTabChange,
  selectionTab,
  t,
  viewTab,
}: WorkspaceInspectorProps) {
  return (
    <InspectorPanel
      activeTab={activeTab}
      isViewTabAvailable={isViewTabAvailable}
      labels={{
        grid: t("tenant.platformStudio.forms.builder.gridTab"),
        selection: t("tenant.platformStudio.forms.builder.selectionTab"),
        view: t("tenant.platformStudio.forms.builder.viewTab"),
      }}
      onTabChange={onTabChange}
    >
      <InspectorPanelTab value="selection">
        {selectionTab}
      </InspectorPanelTab>
      <InspectorPanelTab value="grid">
        {gridTab}
      </InspectorPanelTab>
      <InspectorPanelTab value="view">
        {viewTab}
      </InspectorPanelTab>
    </InspectorPanel>
  );
}
