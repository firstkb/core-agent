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

type TooltipContextValue = {
  align: OverlayAlign;
  closeWithDelay: () => void;
  contentId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  openWithDelay: () => void;
  setOpen: (open: boolean) => void;
  side: OverlaySide;
  sideOffset: number;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);

  if (!context) {
    throw new Error("Tooltip primitives must be used inside a Tooltip root.");
  }

  return context;
}

export type TooltipProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: OverlaySide;
  align?: OverlayAlign;
  sideOffset?: number;
  delay?: number;
  closeDelay?: number;
  disabled?: boolean;
};

export function Tooltip({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  side = "top",
  align = "center",
  sideOffset = 8,
  delay = 80,
  closeDelay = 40,
  disabled = false,
}: TooltipProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const contentId = useId();
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: open,
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function openWithDelay() {
    if (disabled) {
      return;
    }

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setIsOpen(true);
      timerRef.current = null;
    }, delay);
  }

  function closeWithDelay() {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      timerRef.current = null;
    }, closeDelay);
  }

  const contextValue = useMemo(
    () => ({
      align,
      closeWithDelay,
      contentId,
      contentRef,
      open: isOpen,
      openWithDelay,
      setOpen: setIsOpen,
      side,
      sideOffset,
      triggerRef,
    }),
    [align, contentId, isOpen, side, sideOffset],
  );

  return <TooltipContext.Provider value={contextValue}>{children}</TooltipContext.Provider>;
}

type TooltipTriggerProps = {
  children: ReactElement;
};

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  const { contentId, open, openWithDelay, closeWithDelay, setOpen, triggerRef } = useTooltipContext();

  if (!isValidElement(children)) {
    throw new Error("TooltipTrigger expects a single React element child.");
  }

  const child = Children.only(children) as ReactElement<
    AriaAttributes & {
      onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
      onClick?: (event: React.MouseEvent<HTMLElement>) => void;
      onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
      onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
      onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
      onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    }
  >;

  return (
    <span className="ui-overlay-trigger-anchor" ref={triggerRef}>
      {cloneElement(child, {
        "aria-describedby": open ? contentId : undefined,
        onBlur: composeEventHandlers(child.props.onBlur, () => closeWithDelay()),
        onClick: composeEventHandlers(child.props.onClick, () => setOpen(false)),
        onFocus: composeEventHandlers(child.props.onFocus, () => openWithDelay()),
        onKeyDown: composeEventHandlers(child.props.onKeyDown, (event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }),
        onMouseEnter: composeEventHandlers(child.props.onMouseEnter, () => openWithDelay()),
        onMouseLeave: composeEventHandlers(child.props.onMouseLeave, () => closeWithDelay()),
      })}
    </span>
  );
}

export type TooltipContentProps = HTMLAttributes<HTMLDivElement>;

export function TooltipContent({ children, className, ...props }: TooltipContentProps) {
  const { align, contentId, contentRef, open, side, sideOffset, triggerRef } =
    useTooltipContext();
  const style = useAnchoredPosition({
    align,
    anchorRef: triggerRef,
    contentRef,
    open,
    side,
    sideOffset,
  });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      {...props}
      className={cx("ui-tooltip__content", className)}
      id={contentId}
      ref={contentRef}
      role="tooltip"
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}
