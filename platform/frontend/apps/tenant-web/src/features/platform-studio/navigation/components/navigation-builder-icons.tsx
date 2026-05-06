import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CameraIcon,
  CarFrontIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  DashboardGridIcon,
  DocumentListIcon,
  EyeOffIcon,
  FlameIcon,
  FolderIcon,
  FormIcon,
  HardHatIcon,
  HelpCircleIcon,
  LayersIcon,
  LockIcon,
  MapPinIcon,
  PulseLineIcon,
  RoutePathIcon,
  SlidersIcon,
  ShieldKeyIcon,
  StarIcon,
  ToolboxIcon,
  UsersIcon,
  WarningTriangleIcon,
  WrenchIcon,
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
  if (kind === "section") {
    return null;
  }

  if (kind === "locked-dashboard") {
    return <DashboardGridIcon />;
  }

  return iconKey ? <NavigationBuilderIconGlyph iconKey={iconKey} /> : null;
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
    case "clipboard-check":
      return <ClipboardCheckIcon />;
    case "warning":
      return <WarningTriangleIcon />;
    case "camera":
      return <CameraIcon />;
    case "toolbox":
      return <ToolboxIcon />;
    case "hard-hat":
      return <HardHatIcon />;
    case "fire":
      return <FlameIcon />;
    case "wrench":
      return <WrenchIcon />;
    case "chart":
      return <ChartBarIcon />;
    case "pulse":
      return <PulseLineIcon />;
    case "car":
      return <CarFrontIcon />;
    case "settings":
      return <SlidersIcon />;
    case "check-circle":
      return <CheckCircleIcon />;
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
    case "map-pin":
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
