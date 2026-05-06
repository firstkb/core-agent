import {
  Badge,
  Button,
  Checkbox,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  WarningTriangleIcon,
} from "@platform/ui-kit";

import type {
  NavigationBuilderNode,
  NavigationBuilderRailItem,
} from "../navigation-builder-state";

type NavigationBuilderAccessSubject =
  | NavigationBuilderNode
  | NavigationBuilderRailItem
  | null;

type NavigationBuilderAccessSheetProps = {
  node: NavigationBuilderAccessSubject;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function NavigationBuilderAccessSheet({
  node,
  onOpenChange,
  open,
}: NavigationBuilderAccessSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="tenant-web__navigation-builder-access-sheet">
        <SheetHeader>
          <SheetTitle>Access preview</SheetTitle>
          <SheetDescription>
            Preview the future access workflow for {node?.label ?? "this item"}.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="tenant-web__navigation-builder-access-stack">
            <div className="tenant-web__platform-studio-inline-help">
              <WarningTriangleIcon />
              <span>
                This is a UI mock. Saving V1 navigation does not enforce backend route or API permissions.
              </span>
            </div>

            <div className="tenant-web__navigation-builder-access-card">
              <div>
                <strong>Mode</strong>
                <span>Use inherited access from parent module by default.</span>
              </div>
              <Badge appearance="soft" size="sm" variant="info">
                Preview only
              </Badge>
            </div>

            <label className="tenant-web__navigation-builder-access-option">
              <Checkbox checked readOnly />
              <span>
                <strong>Inherit from parent</strong>
                <small>{node?.accessSummary ?? "Visible to all authenticated tenant users"}</small>
              </span>
            </label>

            <label className="tenant-web__navigation-builder-access-option tenant-web__navigation-builder-access-option--disabled">
              <Checkbox disabled />
              <span>
                <strong>Custom companies</strong>
                <small>Future picker for company-level visibility.</small>
              </span>
            </label>

            <label className="tenant-web__navigation-builder-access-option tenant-web__navigation-builder-access-option--disabled">
              <Checkbox disabled />
              <span>
                <strong>Custom users and job types</strong>
                <small>Future picker for user/job type overrides.</small>
              </span>
            </label>

            <div className="tenant-web__navigation-builder-access-card">
              <div>
                <strong>Summary preview</strong>
                <span>Visible to 2 companies, 4 job types, and 12 users.</span>
              </div>
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
