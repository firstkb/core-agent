import type { HTMLAttributes } from "react";

import { ScrollArea } from "@platform/ui-kit";

type PlatformBuilderPanelScrollProps = HTMLAttributes<HTMLDivElement>;

export function PlatformBuilderPanelScroll({
  children,
  className,
  ...props
}: PlatformBuilderPanelScrollProps) {
  return (
    <ScrollArea
      {...props}
      className={`tenant-web__platform-builder-panel-scroll${className ? ` ${className}` : ""}`}
      viewportClassName="tenant-web__platform-builder-panel-scroll-viewport"
    >
      {children}
    </ScrollArea>
  );
}
