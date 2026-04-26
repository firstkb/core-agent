import { type ReactNode } from "react";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";

type DefaultFilterEditorDialogProps = {
  canEdit: boolean;
  canSave: boolean;
  cancelLabel: string;
  children: ReactNode;
  description: string;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  saveLabel: string;
  title: string;
};

export function DefaultFilterEditorDialog({
  canEdit,
  canSave,
  cancelLabel,
  children,
  description,
  onCancel,
  onOpenChange,
  onSave,
  open,
  saveLabel,
  title,
}: DefaultFilterEditorDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="tenant-web__platform-studio-filter-dialog">
        <DialogHeader>
          <div>
            <DialogTitle>
              {title}
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
          {children}

          <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
            <Button onClick={onCancel} size="sm" variant="ghost">
              {cancelLabel}
            </Button>
            <Button
              disabled={!canEdit || !canSave}
              onClick={onSave}
              size="sm"
              variant="primary"
            >
              {saveLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
