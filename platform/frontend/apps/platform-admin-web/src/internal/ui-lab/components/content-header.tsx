import type { RefObject } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@platform/ui-kit";

import type { UiLabLeafMeta, UiLabLeafStatus } from "../model/leaf-meta";
import { getContentSummary } from "./docs-cards";

type UiLabContentHeaderProps = {
  activeItem: UiLabLeafMeta;
  activeLeafStatus: UiLabLeafStatus;
  contentHeaderRef: RefObject<HTMLElement | null>;
  routePath?: string;
};

export function UiLabContentHeader({
  activeItem,
  activeLeafStatus,
  contentHeaderRef,
  routePath = "/root/ui-lab",
}: UiLabContentHeaderProps) {
  return (
    <header className="ui-lab-page__content-header" ref={contentHeaderRef}>
      <div className="ui-lab-page__content-heading">
        <div className="ui-lab-page__content-title-row">
          <h1 className="ui-lab-page__content-title">{activeItem.title}</h1>
          {activeLeafStatus !== "ready" ? (
            <span className={`ui-lab-page__content-status ui-lab-page__content-status--${activeLeafStatus}`}>
              {activeLeafStatus === "review" ? "Review" : "Coming"}
            </span>
          ) : null}
        </div>
        <p className="ui-lab-page__content-summary">{getContentSummary(activeItem)}</p>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          {activeItem.breadcrumb.map((crumb, index) => {
            const isLast = index === activeItem.breadcrumb.length - 1;

            return (
              <div className="ui-lab-page__breadcrumb-part" key={`${crumb}-${index}`}>
                <BreadcrumbItem>
                  {isLast ? <BreadcrumbPage>{crumb}</BreadcrumbPage> : <BreadcrumbLink href={routePath}>{crumb}</BreadcrumbLink>}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
