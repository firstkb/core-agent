import {
  type AriaAttributes,
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "../../lib/cx";
import { useAnchoredPosition, type OverlayAlign, type OverlaySide } from "../../lib/use-anchored-position";
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

type PopoverContextValue = {
  align: OverlayAlign;
  contentId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  side: OverlaySide;
  sideOffset: number;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("Popover primitives must be used inside a Popover root.");
  }

  return context;
}

export type PopoverProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: OverlaySide;
  align?: OverlayAlign;
  sideOffset?: number;
};

export function Popover({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "center",
  sideOffset = 8,
}: PopoverProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentId = useId();
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: open,
  });

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const contextValue = useMemo(
    () => ({
      align,
      contentId,
      contentRef,
      open: isOpen,
      setOpen: setIsOpen,
      side,
      sideOffset,
      triggerRef,
    }),
    [align, contentId, isOpen, setIsOpen, side, sideOffset],
  );

  return <PopoverContext.Provider value={contextValue}>{children}</PopoverContext.Provider>;
}

type PopoverTriggerProps = {
  children: ReactElement;
};

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { contentId, open, setOpen, triggerRef } = usePopoverContext();

  if (!isValidElement(children)) {
    throw new Error("PopoverTrigger expects a single React element child.");
  }

  const child = Children.only(children) as ReactElement<
    AriaAttributes & {
      onClick?: (event: React.MouseEvent<HTMLElement>) => void;
      onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
    }
  >;

  return (
    <span className="ui-overlay-trigger-anchor" ref={triggerRef}>
      {cloneElement(child, {
        "aria-controls": open ? contentId : undefined,
        "aria-expanded": open,
        "aria-haspopup": "dialog",
        onClick: composeEventHandlers(child.props.onClick, () => setOpen(!open)),
        onKeyDown: composeEventHandlers(child.props.onKeyDown, (event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }),
      })}
    </span>
  );
}

export type PopoverContentProps = HTMLAttributes<HTMLDivElement>;

export function PopoverContent({ children, className, ...props }: PopoverContentProps) {
  const { align, contentId, contentRef, open, side, sideOffset, triggerRef } =
    usePopoverContext();
  const [positionReady, setPositionReady] = useState(false);
  const style = useAnchoredPosition({
    align,
    anchorRef: triggerRef,
    contentRef,
    open,
    side,
    sideOffset,
  });

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      setPositionReady(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setPositionReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      {...props}
      className={cx("ui-popover__content", className)}
      id={contentId}
      ref={contentRef}
      role="dialog"
      style={{
        ...style,
        pointerEvents: positionReady ? "auto" : "none",
        visibility: positionReady ? "visible" : "hidden",
      }}
      tabIndex={-1}
    >
      {children}
    </div>,
    document.body,
  );
}
