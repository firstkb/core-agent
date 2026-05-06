export const businessTreePagePath = "/app/pages/business-tree";

export function isBusinessTreePagePath(pathname: string) {
  return pathname === businessTreePagePath || pathname.startsWith(`${businessTreePagePath}/`);
}

export function getBusinessTreeHeaderTitle() {
  return "Business Tree";
}

export function getBusinessTreeHeaderMeta() {
  return null;
}
