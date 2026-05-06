import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CarFrontIcon,
  ChartBarIcon,
  DashboardGridIcon,
  DocumentListIcon,
  EyeOffIcon,
  FolderIcon,
  FormIcon,
  HelpCircleIcon,
  LayersIcon,
  LockIcon,
  MapPinIcon,
  PulseLineIcon,
  RoutePathIcon,
  SettingsIcon,
  ShieldKeyIcon,
  StarIcon,
  UsersIcon,
  WarningTriangleIcon,
  type IconProps,
} from "@platform/ui-kit";

import type {
  NavigationBuilderNodeKind,
  NavigationBuilderNodeStatus,
} from "../navigation-builder-state";

export function NavigationBuilderNodeIcon({
  iconKey,
  kind,
}: {
  iconKey?: string;
  kind: NavigationBuilderNodeKind;
}) {
  if (kind === "entry" || kind === "section") {
    return null;
  }

  const resolvedIconKey = iconKey ?? kind;
  return <NavigationBuilderIconGlyph iconKey={resolvedIconKey} />;
}

export function NavigationBuilderIconGlyph({
  iconKey,
}: {
  iconKey?: string;
}) {
  switch (iconKey) {
    case "dashboard":
    case "locked-dashboard":
      return <DashboardGridIcon />;
    case "layers":
      return <LayersIcon />;
    case "briefcase":
    case "app-module":
      return <BriefcaseIcon />;
    case "folder":
    case "menu-group":
      return <FolderIcon />;
    case "building":
      return <BuildingOfficeIcon />;
    case "users":
      return <UsersIcon />;
    case "chart":
      return <ChartBarIcon />;
    case "pulse":
      return <PulseLineIcon />;
    case "car":
      return <CarFrontIcon />;
    case "settings":
      return <SettingsIcon />;
    case "star":
      return <StarIcon />;
    case "help":
      return <HelpCircleIcon />;
    case "form":
      return <FormIcon />;
    case "route":
    case "tree":
      return <RoutePathIcon />;
    case "link":
      return <MapPinIcon />;
    case "document":
      return <DocumentListIcon />;
    case "shield":
      return <ShieldKeyIcon />;
    default:
      return <DocumentListIcon />;
  }
}

export function NavigationBuilderStatusIcon({
  status,
  ...props
}: IconProps & {
  status: NavigationBuilderNodeStatus;
}) {
  switch (status) {
    case "hidden":
      return <EyeOffIcon {...props} />;
    case "restricted":
      return <LockIcon {...props} />;
    case "broken":
      return <WarningTriangleIcon {...props} />;
    case "visible":
      return null;
  }
}
