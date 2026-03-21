import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "../../lib/cx";

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
        <button
          aria-label="Close dialog"
          className="ui-surface-close"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          <span aria-hidden="true">x</span>
        </button>
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
        <button
          aria-label="Close sheet"
          className="ui-surface-close"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          <span aria-hidden="true">x</span>
        </button>
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
