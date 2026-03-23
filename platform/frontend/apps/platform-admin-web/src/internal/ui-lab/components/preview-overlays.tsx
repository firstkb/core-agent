import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertTitle,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldHint,
  FieldLabel,
  Input,
  Select,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@platform/ui-kit";

import { SidebarPreviewNav } from "./docs-cards";

type UiLabPreviewOverlaysProps = {
  alertDialogOpen: boolean;
  dialogOpen: boolean;
  drawerOpen: boolean;
  onAlertDialogOpenChange: (open: boolean) => void;
  onDialogOpenChange: (open: boolean) => void;
  onDrawerOpenChange: (open: boolean) => void;
  onSheetOpenChange: (open: boolean) => void;
  onSidebarDrawerOpenChange: (open: boolean) => void;
  sheetOpen: boolean;
  sidebarDrawerOpen: boolean;
};

export function UiLabPreviewOverlays({
  alertDialogOpen,
  dialogOpen,
  drawerOpen,
  onAlertDialogOpenChange,
  onDialogOpenChange,
  onDrawerOpenChange,
  onSheetOpenChange,
  onSidebarDrawerOpenChange,
  sheetOpen,
  sidebarDrawerOpen,
}: UiLabPreviewOverlaysProps) {
  return (
    <>
      <Drawer onOpenChange={onDrawerOpenChange} open={drawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer preview</DrawerTitle>
            <DrawerDescription>
              Bottom overlay contract for mobile review, compact action lists, and temporary settings.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className="ui-lab-page__stack">
              <Field>
                <FieldLabel htmlFor="ui-lab-drawer-preview">Review scope</FieldLabel>
                <Select defaultValue="operators" id="ui-lab-drawer-preview">
                  <option value="operators">Operators</option>
                  <option value="tenant-admins">Tenant admins</option>
                  <option value="workspace-owners">Workspace owners</option>
                </Select>
                <FieldHint>Drawer works well when mobile users need a short temporary action surface.</FieldHint>
              </Field>
              <Alert tone="info">
                <AlertBody>
                  <AlertTitle>Temporary surface</AlertTitle>
                  <AlertDescription>
                    Keep this shell generic. Navigation trees and route-specific orchestration stay app-owned.
                  </AlertDescription>
                </AlertBody>
              </Alert>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button onClick={() => onDrawerOpenChange(false)} variant="ghost">
              Close
            </Button>
            <Button onClick={() => onDrawerOpenChange(false)}>Apply review</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <DialogLikePreview onDialogOpenChange={onDialogOpenChange} open={dialogOpen} />

      <AlertDialog onOpenChange={onAlertDialogOpenChange} open={alertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive tenant workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will remove the workspace from active rollout review and hide it from default operator queues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Alert tone="warning">
              <AlertBody>
                <AlertTitle>Manual restore required</AlertTitle>
                <AlertDescription>
                  Use alert dialog only for focused risky confirmation. Move longer edits and explanatory workflows into a normal dialog, sheet, or page surface.
                </AlertDescription>
              </AlertBody>
            </Alert>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Archive workspace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet onOpenChange={onSheetOpenChange} open={sheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet preview</SheetTitle>
            <SheetDescription>
              Side-surface overlays stay useful for longer review, editing, and configuration flows.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div className="ui-lab-page__stack">
              <p className="ui-lab-page__muted">
                This preview keeps sheet visible as a reusable overlay contract rather than tying it to one product scenario.
              </p>
              <Field>
                <FieldLabel htmlFor="ui-lab-sheet-preview">Workspace slug</FieldLabel>
                <Input defaultValue="aurora-platform" id="ui-lab-sheet-preview" />
                <FieldHint>Sheet works well when the user needs more room than a dialog allows.</FieldHint>
              </Field>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button onClick={() => onSheetOpenChange(false)} variant="ghost">
              Close
            </Button>
            <Button onClick={() => onSheetOpenChange(false)}>Save draft</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={onSidebarDrawerOpenChange} open={sidebarDrawerOpen} side="left">
        <SheetContent className="ui-lab-page__sidebar-preview-mobile-sheet">
          <SheetHeader>
            <SheetTitle>Sidebar mobile preview</SheetTitle>
            <SheetDescription>
              The same shared nav tree should remain usable inside a compact left mobile shell.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <SidebarPreviewNav compact />
          </SheetBody>
          <SheetFooter>
            <Button onClick={() => onSidebarDrawerOpenChange(false)} variant="ghost">
              Close
            </Button>
            <Button onClick={() => onSidebarDrawerOpenChange(false)}>Mark reviewed</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DialogLikePreview({
  onDialogOpenChange,
  open,
}: {
  onDialogOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onDialogOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog preview</DialogTitle>
          <DialogDescription>
            Confirmation and action dialogs stay generic here, not tied to one domain flow.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="ui-lab-page__muted">
            This standalone route exists to inspect components before they become part of a real
            product screen.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onDialogOpenChange(false)} variant="ghost">
            Close
          </Button>
          <Button onClick={() => onDialogOpenChange(false)}>Mark reviewed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
