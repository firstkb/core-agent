export const businessTreeModulePath = "/app/modules/business-tree";

export function isBusinessTreeModulePath(pathname: string) {
  return pathname === businessTreeModulePath || pathname.startsWith(`${businessTreeModulePath}/`);
}

export function getBusinessTreeHeaderTitle() {
  return "Business Tree";
}

export function getBusinessTreeHeaderMeta() {
  return null;
}
