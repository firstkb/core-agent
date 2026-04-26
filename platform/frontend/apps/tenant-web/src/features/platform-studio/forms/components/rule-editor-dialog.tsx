import { type ReactNode } from "react";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
} from "@platform/ui-kit";

export type RuleEditorEffectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type RuleEditorDialogProps<TValue extends string> = {
  canDelete: boolean;
  canEdit: boolean;
  canSave: boolean;
  cancelLabel: string;
  children: ReactNode;
  deleteLabel: string;
  description: string;
  effectLabel: string;
  effectOptions: ReadonlyArray<RuleEditorEffectOption<TValue>>;
  effectSelectId: string;
  effectValue: TValue;
  onCancel: () => void;
  onDelete: () => void;
  onEffectChange: (value: TValue) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  saveLabel: string;
  title: string;
};

export function RuleEditorDialog<TValue extends string>({
  canDelete,
  canEdit,
  canSave,
  cancelLabel,
  children,
  deleteLabel,
  description,
  effectLabel,
  effectOptions,
  effectSelectId,
  effectValue,
  onCancel,
  onDelete,
  onEffectChange,
  onOpenChange,
  onSave,
  open,
  saveLabel,
  title,
}: RuleEditorDialogProps<TValue>) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="tenant-web__platform-studio-filter-dialog">
        <DialogHeader>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
          <div className="tenant-web__platform-studio-builder-stack">
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={effectSelectId}>
                {effectLabel}
              </Label>
              <Select
                disabled={!canEdit}
                id={effectSelectId}
                onChange={(event) => onEffectChange(event.target.value as TValue)}
                value={effectValue}
              >
                {effectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {children}

            <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
              <Button onClick={onCancel} size="sm" variant="ghost">
                {cancelLabel}
              </Button>
              {canDelete ? (
                <Button onClick={onDelete} size="sm" variant="ghost">
                  {deleteLabel}
                </Button>
              ) : null}
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
