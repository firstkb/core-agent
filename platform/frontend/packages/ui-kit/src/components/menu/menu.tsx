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
  type ButtonHTMLAttributes,
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

type MenuContextValue = {
  align: OverlayAlign;
  contentId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  side: OverlaySide;
  sideOffset: number;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("Menu primitives must be used inside a Menu root.");
  }

  return context;
}

function getMenuItems(content: HTMLDivElement | null) {
  if (!content) return [];

  return Array.from(
    content.querySelectorAll<HTMLButtonElement>("button[data-ui-menu-item]:not(:disabled)"),
  );
}

export type MenuProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: OverlaySide;
  align?: OverlayAlign;
  sideOffset?: number;
};

export function Menu({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "start",
  sideOffset = 8,
}: MenuProps) {
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

  return <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>;
}

type MenuTriggerProps = {
  children: ReactElement;
};

export function MenuTrigger({ children }: MenuTriggerProps) {
  const { contentId, open, setOpen, triggerRef } = useMenuContext();

  if (!isValidElement(children)) {
    throw new Error("MenuTrigger expects a single React element child.");
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
        "aria-haspopup": "menu",
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

export type MenuContentProps = HTMLAttributes<HTMLDivElement>;

export function MenuContent({ children, className, onKeyDown, ...props }: MenuContentProps) {
  const { align, contentId, contentRef, open, setOpen, side, sideOffset, triggerRef } =
    useMenuContext();
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const firstItem = getMenuItems(contentRef.current)[0];

      if (firstItem) {
        firstItem.focus();
      } else {
        contentRef.current?.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [contentRef, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      {...props}
      className={cx("ui-menu__content", className)}
      id={contentId}
      onKeyDown={composeEventHandlers(onKeyDown, (event) => {
        const items = getMenuItems(contentRef.current);

        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          return;
        }

        if (items.length === 0) {
          return;
        }

        const currentIndex = items.findIndex((item) => item === document.activeElement);

        if (event.key === "ArrowDown") {
          event.preventDefault();
          items[(currentIndex + 1 + items.length) % items.length]?.focus();
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          items[(currentIndex - 1 + items.length) % items.length]?.focus();
        }

        if (event.key === "Home") {
          event.preventDefault();
          items[0]?.focus();
        }

        if (event.key === "End") {
          event.preventDefault();
          items[items.length - 1]?.focus();
        }
      })}
      ref={contentRef}
      role="menu"
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

export type MenuItemTone = "default" | "danger";

export type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: MenuItemTone;
  shortcut?: string;
};

export function MenuItem({
  children,
  className,
  onClick,
  shortcut,
  tone = "default",
  type = "button",
  ...props
}: MenuItemProps) {
  const { setOpen, triggerRef } = useMenuContext();

  return (
    <button
      {...props}
      className={cx("ui-menu__item", tone === "danger" && "ui-menu__item--danger", className)}
      data-ui-menu-item="true"
      onClick={composeEventHandlers(onClick, () => {
        setOpen(false);
        triggerRef.current?.focus();
      })}
      role="menuitem"
      type={type}
    >
      <span className="ui-menu__item-label">{children}</span>
      {shortcut ? <span className="ui-menu__shortcut">{shortcut}</span> : null}
    </button>
  );
}

export function MenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-menu__label", className)} />;
}

export function MenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={cx("ui-menu__separator", className)} />;
}
