import type {
  BuilderNavigationNodeId,
  BuilderViewId,
} from "../contracts/common";

export type PublishedManifestRuntimeErrorCode =
  | "duplicate-route-key"
  | "route-key-not-found"
  | "view-not-found";

export type PublishedManifestRuntimeErrorDetails = {
  navigationNodeId?: BuilderNavigationNodeId;
  routeKey?: string;
  viewId?: BuilderViewId;
};

export class PublishedManifestRuntimeError extends Error {
  readonly code: PublishedManifestRuntimeErrorCode;
  readonly navigationNodeId?: BuilderNavigationNodeId;
  readonly routeKey?: string;
  readonly viewId?: BuilderViewId;

  constructor(
    code: PublishedManifestRuntimeErrorCode,
    message: string,
    details: PublishedManifestRuntimeErrorDetails = {},
  ) {
    super(message);

    this.code = code;
    this.name = "PublishedManifestRuntimeError";
    this.navigationNodeId = details.navigationNodeId;
    this.routeKey = details.routeKey;
    this.viewId = details.viewId;
  }
}
