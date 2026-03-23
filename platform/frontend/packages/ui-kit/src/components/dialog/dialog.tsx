import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { createPortal } from "react-dom";

import { Button, type ButtonProps } from "../button";
import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";

type OverlaySurfaceContextValue = {
  onOpenChange: (open: boolean) => void;
};

const OverlaySurfaceContext = createContext<OverlaySurfaceContextValue | null>(null);

function useOverlaySurfaceContext() {
  const context = useContext(OverlaySurfaceContext);

  if (!context) {
    throw new Error("Dialog and Sheet content must be rendered inside an open surface root.");
  }

  return context;
}

function SurfaceCloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M5.5 5.5L14.5 14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 5.5L5.5 14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SurfaceCloseButton({
  ariaLabel,
  onClick,
}: {
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="ui-surface-close"
      onClick={onClick}
      type="button"
    >
      <SurfaceCloseIcon />
    </button>
  );
}

type OverlaySurfaceProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  surfaceClassName?: string;
  positionClassName?: string;
};

function OverlaySurface({
  children,
  open,
  onOpenChange,
  closeOnEscape = true,
  closeOnOverlay = true,
  positionClassName,
  surfaceClassName,
}: OverlaySurfaceProps) {
  const contextValue = useMemo(() => ({ onOpenChange }), [onOpenChange]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEscape || typeof document === "undefined") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <OverlaySurfaceContext.Provider value={contextValue}>
      <div className="ui-overlay-root">
        <div
          aria-hidden="true"
          className="ui-overlay-backdrop"
          onClick={closeOnOverlay ? () => onOpenChange(false) : undefined}
        />
        <div className={cx("ui-overlay-positioner", positionClassName)}>
          <div className={surfaceClassName}>{children}</div>
        </div>
      </div>
    </OverlaySurfaceContext.Provider>,
    document.body,
  );
}

export type DialogProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
};

export function Dialog({ children, open, onOpenChange, ...props }: DialogProps) {
  return (
    <OverlaySurface
      {...props}
      onOpenChange={onOpenChange}
      open={open}
      positionClassName="ui-overlay-positioner--center"
      surfaceClassName="ui-dialog"
    >
      {children}
    </OverlaySurface>
  );
}

export type AlertDialogProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
};

export function AlertDialog({ children, open, onOpenChange, ...props }: AlertDialogProps) {
  return (
    <OverlaySurface
      {...props}
      onOpenChange={onOpenChange}
      open={open}
      positionClassName="ui-overlay-positioner--center"
      surfaceClassName="ui-alert-dialog"
    >
      {children}
    </OverlaySurface>
  );
}

export type DialogContentProps = HTMLAttributes<HTMLDivElement> & {
  showCloseButton?: boolean;
};

export function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { onOpenChange } = useOverlaySurfaceContext();

  return (
    <div
      {...props}
      aria-modal="true"
      className={cx("ui-dialog__content", className)}
      role="dialog"
    >
      {showCloseButton ? (
        <SurfaceCloseButton ariaLabel="Close dialog" onClick={() => onOpenChange(false)} />
      ) : null}
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-dialog__header", className)} />;
}

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-dialog__body", className)} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-dialog__footer", className)} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={cx("ui-dialog__title", className)} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-dialog__description", className)} />;
}

export type AlertDialogContentProps = HTMLAttributes<HTMLDivElement> & {
  showCloseButton?: boolean;
};

export function AlertDialogContent({
  children,
  className,
  showCloseButton = false,
  ...props
}: AlertDialogContentProps) {
  const { onOpenChange } = useOverlaySurfaceContext();

  return (
    <div
      {...props}
      aria-modal="true"
      className={cx("ui-alert-dialog__content", className)}
      role="alertdialog"
    >
      {showCloseButton ? (
        <SurfaceCloseButton ariaLabel="Close alert dialog" onClick={() => onOpenChange(false)} />
      ) : null}
      {children}
    </div>
  );
}

export function AlertDialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-alert-dialog__header", className)} />;
}

export function AlertDialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-alert-dialog__body", className)} />;
}

export function AlertDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-alert-dialog__footer", className)} />;
}

export function AlertDialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={cx("ui-alert-dialog__title", className)} />;
}

export function AlertDialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-alert-dialog__description", className)} />;
}

export type AlertDialogActionProps = ButtonProps;

export function AlertDialogAction({
  children,
  onClick,
  variant = "danger",
  ...props
}: AlertDialogActionProps) {
  const { onOpenChange } = useOverlaySurfaceContext();

  return (
    <Button
      {...props}
      onClick={composeEventHandlers(onClick as ((event: ReactMouseEvent<HTMLButtonElement>) => void) | undefined, () =>
        onOpenChange(false),
      )}
      variant={variant}
    >
      {children}
    </Button>
  );
}

export type AlertDialogCancelProps = ButtonProps;

export function AlertDialogCancel({
  children,
  onClick,
  variant = "outline",
  ...props
}: AlertDialogCancelProps) {
  const { onOpenChange } = useOverlaySurfaceContext();

  return (
    <Button
      {...props}
      onClick={composeEventHandlers(onClick as ((event: ReactMouseEvent<HTMLButtonElement>) => void) | undefined, () =>
        onOpenChange(false),
      )}
      variant={variant}
    >
      {children}
    </Button>
  );
}

export type SheetSide = "left" | "right";

export type SheetProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: SheetSide;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
};

export function Sheet({
  children,
  open,
  onOpenChange,
  side = "right",
  ...props
}: SheetProps) {
  return (
    <OverlaySurface
      {...props}
      onOpenChange={onOpenChange}
      open={open}
      positionClassName={cx("ui-overlay-positioner--edge", `ui-overlay-positioner--${side}`)}
      surfaceClassName={cx("ui-sheet", `ui-sheet--${side}`)}
    >
      {children}
    </OverlaySurface>
  );
}

export type SheetContentProps = HTMLAttributes<HTMLDivElement> & {
  showCloseButton?: boolean;
};

export function SheetContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  const { onOpenChange } = useOverlaySurfaceContext();

  return (
    <div
      {...props}
      aria-modal="true"
      className={cx("ui-sheet__content", className)}
      role="dialog"
    >
      {showCloseButton ? (
        <SurfaceCloseButton ariaLabel="Close sheet" onClick={() => onOpenChange(false)} />
      ) : null}
      {children}
    </div>
  );
}

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-sheet__header", className)} />;
}

export function SheetBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-sheet__body", className)} />;
}

export function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-sheet__footer", className)} />;
}

export function SheetTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={cx("ui-sheet__title", className)} />;
}

export function SheetDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-sheet__description", className)} />;
}

export type DrawerProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
};

export function Drawer({ children, open, onOpenChange, ...props }: DrawerProps) {
  return (
    <OverlaySurface
      {...props}
      onOpenChange={onOpenChange}
      open={open}
      positionClassName="ui-overlay-positioner--bottom"
      surfaceClassName="ui-drawer"
    >
      {children}
    </OverlaySurface>
  );
}

export type DrawerContentProps = HTMLAttributes<HTMLDivElement> & {
  showCloseButton?: boolean;
  showHandle?: boolean;
};

export function DrawerContent({
  children,
  className,
  showCloseButton = true,
  showHandle = false,
  ...props
}: DrawerContentProps) {
  const { onOpenChange } = useOverlaySurfaceContext();

  return (
    <div
      {...props}
      aria-modal="true"
      className={cx("ui-drawer__content", className)}
      role="dialog"
    >
      {showHandle ? <div aria-hidden="true" className="ui-drawer__handle" /> : null}
      {showCloseButton ? (
        <SurfaceCloseButton ariaLabel="Close drawer" onClick={() => onOpenChange(false)} />
      ) : null}
      {children}
    </div>
  );
}

export function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-drawer__header", className)} />;
}

export function DrawerBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-drawer__body", className)} />;
}

export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-drawer__footer", className)} />;
}

export function DrawerTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={cx("ui-drawer__title", className)} />;
}

export function DrawerDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-drawer__description", className)} />;
}
