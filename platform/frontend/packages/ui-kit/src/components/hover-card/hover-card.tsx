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
  type FocusEvent as ReactFocusEvent,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";
import {
  useAnchoredPosition,
  type OverlayAlign,
  type OverlaySide,
} from "../../lib/use-anchored-position";
import { useControllableState } from "../../lib/use-controllable-state";

type HoverCardContextValue = {
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

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext() {
  const context = useContext(HoverCardContext);

  if (!context) {
    throw new Error("HoverCard primitives must be used inside a HoverCard root.");
  }

  return context;
}

export type HoverCardProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: OverlaySide;
  align?: OverlayAlign;
  sideOffset?: number;
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
};

export function HoverCard({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  side = "top",
  align = "center",
  sideOffset = 10,
  openDelay = 100,
  closeDelay = 80,
  disabled = false,
}: HoverCardProps) {
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
    }, openDelay);
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

  return <HoverCardContext.Provider value={contextValue}>{children}</HoverCardContext.Provider>;
}

type HoverCardTriggerProps = {
  children: ReactElement;
};

export function HoverCardTrigger({ children }: HoverCardTriggerProps) {
  const { contentId, open, openWithDelay, closeWithDelay, triggerRef } = useHoverCardContext();

  if (!isValidElement(children)) {
    throw new Error("HoverCardTrigger expects a single React element child.");
  }

  const child = Children.only(children) as ReactElement<
    AriaAttributes & {
      onBlur?: (event: ReactFocusEvent<HTMLElement>) => void;
      onFocus?: (event: ReactFocusEvent<HTMLElement>) => void;
      onMouseEnter?: (event: ReactMouseEvent<HTMLElement>) => void;
      onMouseLeave?: (event: ReactMouseEvent<HTMLElement>) => void;
    }
  >;

  return (
    <span className="ui-overlay-trigger-anchor" ref={triggerRef}>
      {cloneElement(child, {
        "aria-describedby": open ? contentId : undefined,
        onBlur: composeEventHandlers(child.props.onBlur, () => closeWithDelay()),
        onFocus: composeEventHandlers(child.props.onFocus, () => openWithDelay()),
        onMouseEnter: composeEventHandlers(child.props.onMouseEnter, () => openWithDelay()),
        onMouseLeave: composeEventHandlers(child.props.onMouseLeave, () => closeWithDelay()),
      })}
    </span>
  );
}

export type HoverCardContentProps = HTMLAttributes<HTMLDivElement>;

export function HoverCardContent({
  children,
  className,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  ...props
}: HoverCardContentProps) {
  const { align, closeWithDelay, contentId, contentRef, open, openWithDelay, side, sideOffset, triggerRef } =
    useHoverCardContext();
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
      className={cx("ui-hover-card__content", className)}
      id={contentId}
      onBlur={composeEventHandlers(onBlur, () => closeWithDelay())}
      onFocus={composeEventHandlers(onFocus, () => openWithDelay())}
      onMouseEnter={composeEventHandlers(onMouseEnter, () => openWithDelay())}
      onMouseLeave={composeEventHandlers(onMouseLeave, () => closeWithDelay())}
      ref={contentRef}
      role="dialog"
      style={style}
      tabIndex={-1}
    >
      {children}
    </div>,
    document.body,
  );
}
