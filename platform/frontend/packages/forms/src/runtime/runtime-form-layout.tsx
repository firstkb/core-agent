import type { ReactNode } from "react";

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
  RuntimeFormLayoutDefinition,
  RuntimeFormNodeDefinition,
} from "./runtime-form-types";
import {
  cx,
} from "./runtime-form-utils";

type RenderNodes = (nodes: ReadonlyArray<RuntimeFormNodeDefinition>, className?: string) => ReactNode;

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
  layout,
  renderNodes,
}: {
  layout: RuntimeFormLayoutDefinition;
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
    const fallbackTabId = layout.tabs[0]?.id ?? "";
    const defaultTabId = layout.defaultTabId && layout.tabs.some((tab) => tab.id === layout.defaultTabId)
      ? layout.defaultTabId
      : fallbackTabId;

    return (
      <div className={cx("platform-runtime-form__tabs", layout.width === "full" && "platform-runtime-form__field--full")}>
        <RuntimeLayoutHeader description={layout.description} title={layout.title} />
        <Tabs defaultValue={defaultTabId} size={layout.size ?? "sm"} variant={layout.styleVariant ?? "surface"}>
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
