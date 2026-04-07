import type { HTMLAttributes } from "react";

import { ScrollArea } from "@platform/ui-kit";

type PlatformStudioPanelScrollProps = HTMLAttributes<HTMLDivElement>;

export function PlatformStudioPanelScroll({
  children,
  className,
  ...props
}: PlatformStudioPanelScrollProps) {
  return (
    <ScrollArea
      {...props}
      className={`tenant-web__platform-studio-panel-scroll${className ? ` ${className}` : ""}`}
      viewportClassName="tenant-web__platform-studio-panel-scroll-viewport"
    >
      {children}
    </ScrollArea>
  );
}
