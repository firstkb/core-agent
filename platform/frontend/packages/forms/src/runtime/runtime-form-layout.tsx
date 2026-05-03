import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Separator,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from "@platform/ui-kit";

import type {
  RuntimeFormActiveTabs,
  RuntimeFormLayoutDefinition,
  RuntimeFormNodeDefinition,
  RuntimeFormTabsLayoutDefinition,
} from "./runtime-form-types";
import {
  cx,
  getRuntimeLayoutChildNodes,
  isRuntimeFormFieldNode,
  isRuntimeFormLayoutNode,
} from "./runtime-form-utils";

type RenderNodes = (nodes: ReadonlyArray<RuntimeFormNodeDefinition>, className?: string) => ReactNode;

function runtimeNodesContainField(nodes: ReadonlyArray<RuntimeFormNodeDefinition>, fieldId: string | undefined): boolean {
  if (!fieldId) {
    return false;
  }

  for (const node of nodes) {
    if (isRuntimeFormFieldNode(node) && node.id === fieldId) {
      return true;
    }

    if (isRuntimeFormLayoutNode(node) && runtimeNodesContainField(getRuntimeLayoutChildNodes(node), fieldId)) {
      return true;
    }
  }

  return false;
}

function RuntimeLayoutHeader({
  description,
  title,
}: {
  description?: ReactNode;
  title?: ReactNode;
}) {
  if (!title && !description) {
    return null;
  }

  return (
    <div className="platform-runtime-form__layout-header">
      {title ? <h4 className="platform-runtime-form__layout-title">{title}</h4> : null}
      {description ? <p className="platform-runtime-form__layout-description">{description}</p> : null}
    </div>
  );
}

export function RuntimeLayoutNode({
  activeTabs,
  layout,
  onActiveTabChange,
  revealFieldId,
  revealRequestKey,
  renderNodes,
}: {
  activeTabs?: RuntimeFormActiveTabs;
  layout: RuntimeFormLayoutDefinition;
  onActiveTabChange?: (layoutId: string, tabId: string) => void;
  revealFieldId?: string;
  revealRequestKey?: number;
  renderNodes: RenderNodes;
}) {
  if (layout.layoutType === "divider") {
    return (
      <div className={cx("platform-runtime-form__divider", layout.width === "full" && "platform-runtime-form__field--full")}>
        {layout.label ? <span>{layout.label}</span> : null}
        <Separator />
      </div>
    );
  }

  if (layout.layoutType === "spacer") {
    return (
      <div
        aria-hidden="true"
        className={cx(
          "platform-runtime-form__spacer",
          `platform-runtime-form__spacer--${layout.size ?? "md"}`,
          layout.width === "full" && "platform-runtime-form__field--full",
        )}
      />
    );
  }

  if (layout.layoutType === "grid") {
    return (
      <div
        className={cx(
          "platform-runtime-form__layout-grid",
          `platform-runtime-form__layout-grid--${layout.columns ?? 2}`,
          layout.width === "full" && "platform-runtime-form__field--full",
        )}
      >
        <RuntimeLayoutHeader description={layout.description} title={layout.title} />
        {renderNodes(layout.nodes, "platform-runtime-form__layout-grid-content")}
      </div>
    );
  }

  if (layout.layoutType === "tabs") {
    return (
      <RuntimeTabsLayout
        activeTabs={activeTabs}
        layout={layout}
        onActiveTabChange={onActiveTabChange}
        renderNodes={renderNodes}
        revealFieldId={revealFieldId}
        revealRequestKey={revealRequestKey}
      />
    );
  }

  if (layout.layoutType === "accordion") {
    return (
      <div className={cx("platform-runtime-form__accordion", layout.width === "full" && "platform-runtime-form__field--full")}>
        <RuntimeLayoutHeader description={layout.description} title={layout.title} />
        <Accordion defaultValue={layout.items[0]?.id} variant="muted">
          {layout.items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>
                {renderNodes(item.nodes)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  return (
    <div className={cx("platform-runtime-form__group", layout.width === "full" && "platform-runtime-form__field--full")}>
      <RuntimeLayoutHeader description={layout.description} title={layout.title} />
      {renderNodes(layout.nodes)}
    </div>
  );
}

function RuntimeTabsLayout({
  activeTabs,
  layout,
  onActiveTabChange,
  renderNodes,
  revealFieldId,
  revealRequestKey,
}: {
  activeTabs?: RuntimeFormActiveTabs;
  layout: RuntimeFormTabsLayoutDefinition;
  onActiveTabChange?: (layoutId: string, tabId: string) => void;
  renderNodes: RenderNodes;
  revealFieldId?: string;
  revealRequestKey?: number;
}) {
  const fallbackTabId = layout.tabs[0]?.id ?? "";
  const defaultTabId = layout.defaultTabId && layout.tabs.some((tab) => tab.id === layout.defaultTabId)
    ? layout.defaultTabId
    : fallbackTabId;
  const restoredTabId = activeTabs?.[layout.id];
  const initialTabId = restoredTabId && layout.tabs.some((tab) => tab.id === restoredTabId)
    ? restoredTabId
    : defaultTabId;
  const [activeTabId, setActiveTabId] = useState(initialTabId);

  useEffect(() => {
    setActiveTabId((currentTabId) => layout.tabs.some((tab) => tab.id === currentTabId) ? currentTabId : defaultTabId);
  }, [defaultTabId, layout.tabs]);

  useEffect(() => {
    if (restoredTabId && layout.tabs.some((tab) => tab.id === restoredTabId)) {
      setActiveTabId(restoredTabId);
    }
  }, [layout.tabs, restoredTabId]);

  useEffect(() => {
    const containingTab = layout.tabs.find((tab) => runtimeNodesContainField(tab.nodes, revealFieldId));

    if (containingTab) {
      setActiveTabId(containingTab.id);
      onActiveTabChange?.(layout.id, containingTab.id);
    }
  }, [layout.id, layout.tabs, onActiveTabChange, revealFieldId, revealRequestKey]);

  function handleTabChange(tabId: string) {
    setActiveTabId(tabId);
    onActiveTabChange?.(layout.id, tabId);
  }

  return (
    <div className={cx("platform-runtime-form__tabs", layout.width === "full" && "platform-runtime-form__field--full")}>
      <RuntimeLayoutHeader description={layout.description} title={layout.title} />
      <Tabs
        defaultValue={defaultTabId}
        onValueChange={handleTabChange}
        size={layout.size ?? "sm"}
        value={activeTabId}
        variant={layout.styleVariant ?? "surface"}
      >
        <TabsList scrollable={layout.scrollable ?? true}>
          {layout.tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {layout.tabs.map((tab) => (
          <TabsPanel className="platform-runtime-form__tabs-panel" key={tab.id} value={tab.id}>
            {renderNodes(tab.nodes)}
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}
