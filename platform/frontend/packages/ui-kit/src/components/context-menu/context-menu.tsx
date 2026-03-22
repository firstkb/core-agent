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
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

type ContextMenuPoint = {
  x: number;
  y: number;
};

type ContextMenuContextValue = {
  contentId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  point: ContextMenuPoint | null;
  setOpenAtPoint: (nextPoint: ContextMenuPoint) => void;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext() {
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error("ContextMenu primitives must be used inside a ContextMenu root.");
  }

  return context;
}

function getMenuItems(content: HTMLDivElement | null) {
  if (!content) {
    return [];
  }

  return Array.from(
    content.querySelectorAll<HTMLButtonElement>("button[data-ui-context-menu-item]:not(:disabled)"),
  );
}

export type ContextMenuProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ContextMenu({
  children,
  defaultOpen = false,
  onOpenChange,
  open,
}: ContextMenuProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentId = useId();
  const [point, setPoint] = useState<ContextMenuPoint | null>(null);
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

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setPoint(null);
  }, [isOpen]);

  const contextValue = useMemo(
    () => ({
      contentId,
      contentRef,
      open: isOpen,
      point,
      setOpen: setIsOpen,
      setOpenAtPoint: (nextPoint: ContextMenuPoint) => {
        setPoint(nextPoint);
        setIsOpen(true);
      },
      triggerRef,
    }),
    [contentId, isOpen, point, setIsOpen],
  );

  return <ContextMenuContext.Provider value={contextValue}>{children}</ContextMenuContext.Provider>;
}

type ContextMenuTriggerProps = {
  children: ReactElement;
};

export function ContextMenuTrigger({ children }: ContextMenuTriggerProps) {
  const { contentId, open, setOpenAtPoint, triggerRef } = useContextMenuContext();

  if (!isValidElement(children)) {
    throw new Error("ContextMenuTrigger expects a single React element child.");
  }

  const child = Children.only(children) as ReactElement<
    AriaAttributes & {
      onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
      onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
    }
  >;

  return (
    <span className="ui-overlay-trigger-anchor">
      {cloneElement(child, {
        "aria-controls": open ? contentId : undefined,
        "aria-expanded": open,
        "aria-haspopup": "menu",
        onContextMenu: composeEventHandlers(child.props.onContextMenu, (event) => {
          event.preventDefault();
          triggerRef.current = event.currentTarget;
          setOpenAtPoint({ x: event.clientX, y: event.clientY });
        }),
        onKeyDown: composeEventHandlers(child.props.onKeyDown, (event) => {
          if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
            return;
          }

          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          triggerRef.current = event.currentTarget;
          setOpenAtPoint({
            x: rect.left,
            y: rect.bottom,
          });
        }),
      })}
    </span>
  );
}

export type ContextMenuContentProps = HTMLAttributes<HTMLDivElement>;

export function ContextMenuContent({ children, className, onKeyDown, ...props }: ContextMenuContentProps) {
  const { contentId, contentRef, open, point, setOpen, triggerRef } = useContextMenuContext();
  const [position, setPosition] = useState<ContextMenuPoint | null>(null);

  useEffect(() => {
    if (!open || !point || typeof window === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const content = contentRef.current;
      const viewportPadding = 8;

      if (!content) {
        setPosition(point);
        return;
      }

      const rect = content.getBoundingClientRect();
      const x = Math.min(point.x, window.innerWidth - rect.width - viewportPadding);
      const y = Math.min(point.y, window.innerHeight - rect.height - viewportPadding);

      setPosition({
        x: Math.max(viewportPadding, x),
        y: Math.max(viewportPadding, y),
      });

      const firstItem = getMenuItems(content)[0];
      if (firstItem) {
        firstItem.focus();
      } else {
        content.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [contentRef, open, point]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      {...props}
      className={cx("ui-context-menu__content", className)}
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
        left: position?.x ?? point?.x ?? 0,
        position: "fixed",
        top: position?.y ?? point?.y ?? 0,
      }}
      tabIndex={-1}
    >
      {children}
    </div>,
    document.body,
  );
}

export type ContextMenuItemTone = "default" | "danger";

export type ContextMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  shortcut?: string;
  tone?: ContextMenuItemTone;
};

export function ContextMenuItem({
  children,
  className,
  onClick,
  shortcut,
  tone = "default",
  type = "button",
  ...props
}: ContextMenuItemProps) {
  const { setOpen, triggerRef } = useContextMenuContext();

  return (
    <button
      {...props}
      className={cx("ui-context-menu__item", tone === "danger" && "ui-context-menu__item--danger", className)}
      data-ui-context-menu-item="true"
      onClick={composeEventHandlers(onClick, () => {
        setOpen(false);
        triggerRef.current?.focus();
      })}
      role="menuitem"
      type={type}
    >
      <span className="ui-context-menu__item-label">{children}</span>
      {shortcut ? <span className="ui-context-menu__shortcut">{shortcut}</span> : null}
    </button>
  );
}

export function ContextMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-context-menu__label", className)} />;
}

export function ContextMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={cx("ui-context-menu__separator", className)} />;
}
