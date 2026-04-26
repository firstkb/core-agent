import { type ReactNode } from "react";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@platform/ui-kit";

type QuickFilterEditorDialogProps = {
  addConditionLabel: string;
  canAddCondition: boolean;
  canEdit: boolean;
  canSave: boolean;
  cancelLabel: string;
  children: ReactNode;
  color: string;
  colorLabel: string;
  colorPlaceholder: string;
  description: string;
  label: string;
  labelInputLabel: string;
  onAddCondition: () => void;
  onCancel: () => void;
  onColorChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  saveLabel: string;
  title: string;
};

export function QuickFilterEditorDialog({
  addConditionLabel,
  canAddCondition,
  canEdit,
  canSave,
  cancelLabel,
  children,
  color,
  colorLabel,
  colorPlaceholder,
  description,
  label,
  labelInputLabel,
  onAddCondition,
  onCancel,
  onColorChange,
  onLabelChange,
  onOpenChange,
  onSave,
  open,
  saveLabel,
  title,
}: QuickFilterEditorDialogProps) {
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
          {open ? (
            <div className="tenant-web__platform-studio-builder-stack">
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor="tenant-platform-studio-quick-filter-editor-label">
                  {labelInputLabel}
                </Label>
                <Input
                  disabled={!canEdit}
                  id="tenant-platform-studio-quick-filter-editor-label"
                  onChange={(event) => onLabelChange(event.target.value)}
                  value={label}
                />
              </div>

              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor="tenant-platform-studio-quick-filter-editor-color">
                  {colorLabel}
                </Label>
                <Input
                  disabled={!canEdit}
                  id="tenant-platform-studio-quick-filter-editor-color"
                  onChange={(event) => onColorChange(event.target.value)}
                  placeholder={colorPlaceholder}
                  value={color}
                />
              </div>

              <div className="tenant-web__platform-studio-builder-stack">
                {children}
              </div>

              <div className="tenant-web__platform-studio-button-row">
                <Button
                  disabled={!canAddCondition}
                  onClick={onAddCondition}
                  size="sm"
                  variant="secondary"
                >
                  {addConditionLabel}
                </Button>
              </div>

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
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
