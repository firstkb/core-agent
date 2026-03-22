import {
  createContext,
  useEffect,
  useContext,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

export type TabsVariant = "surface" | "line";
export type TabsSize = "sm" | "md" | "lg";

type TabsContextValue = {
  baseId: string;
  size: TabsSize;
  value: string;
  variant: TabsVariant;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs primitives must be used inside a Tabs root.");
  }

  return context;
}

export type TabsProps = {
  children: ReactNode;
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
};

export function Tabs({
  children,
  value,
  defaultValue,
  onValueChange,
  variant = "surface",
  size = "md",
}: TabsProps) {
  const baseId = useId();
  const [currentValue, setCurrentValue] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value,
  });

  const contextValue = useMemo(
    () => ({
      baseId,
      setValue: setCurrentValue,
      size,
      value: currentValue,
      variant,
    }),
    [baseId, currentValue, setCurrentValue, size, variant],
  );

  return <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>;
}

export type TabsListProps = HTMLAttributes<HTMLDivElement> & {
  scrollable?: boolean;
};

export function TabsList({
  className,
  onKeyDown,
  scrollable = false,
  ...props
}: TabsListProps) {
  const { size, value, variant } = useTabsContext();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollable || typeof window === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const list = listRef.current;

      if (!list) {
        return;
      }

      const activeTrigger = list.querySelector<HTMLButtonElement>(
        'button[data-ui-tab-trigger="true"][aria-selected="true"]',
      );

      if (!activeTrigger) {
        return;
      }

      const listRect = list.getBoundingClientRect();
      const activeRect = activeTrigger.getBoundingClientRect();
      const nextLeft =
        list.scrollLeft + (activeRect.left - listRect.left) - (list.clientWidth - activeRect.width) / 2;
      const maxLeft = Math.max(0, list.scrollWidth - list.clientWidth);
      const clampedLeft = Math.min(Math.max(0, nextLeft), maxLeft);

      list.scrollTo({
        behavior: "auto",
        left: clampedLeft,
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [scrollable, value]);

  return (
    <div
      {...props}
      className={cx(
        "ui-tabs__list",
        `ui-tabs__list--${variant}`,
        `ui-tabs__list--${size}`,
        scrollable && "ui-tabs__list--scrollable",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        const triggers = Array.from(
          listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-ui-tab-trigger]:not(:disabled)") ??
            [],
        );

        if (triggers.length === 0) {
          return;
        }

        const currentIndex = triggers.findIndex((trigger) => trigger === document.activeElement);

        function focusAt(index: number) {
          triggers[(index + triggers.length) % triggers.length]?.focus();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          focusAt(currentIndex + 1);
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          focusAt(currentIndex - 1);
        }

        if (event.key === "Home") {
          event.preventDefault();
          triggers[0]?.focus();
        }

        if (event.key === "End") {
          event.preventDefault();
          triggers[triggers.length - 1]?.focus();
        }
      }}
      ref={listRef}
      role="tablist"
    />
  );
}

export type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  badge?: string;
};

export function TabsTrigger({
  badge,
  children,
  className,
  onClick,
  type = "button",
  value,
  ...props
}: TabsTriggerProps) {
  const { baseId, setValue, size, value: currentValue, variant } = useTabsContext();
  const active = value === currentValue;

  return (
    <button
      {...props}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={active}
      className={cx(
        "ui-tabs__trigger",
        `ui-tabs__trigger--${variant}`,
        `ui-tabs__trigger--${size}`,
        active && "ui-tabs__trigger--active",
        className,
      )}
      data-ui-tab-trigger="true"
      id={`${baseId}-tab-${value}`}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          setValue(value);
        }
      }}
      role="tab"
      tabIndex={active ? 0 : -1}
      type={type}
    >
      <span>{children}</span>
      {badge ? <span className="ui-tabs__badge">{badge}</span> : null}
    </button>
  );
}

export type TabsPanelProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  keepMounted?: boolean;
};

export function TabsPanel({
  children,
  className,
  keepMounted = false,
  value,
  ...props
}: TabsPanelProps) {
  const { baseId, value: currentValue } = useTabsContext();
  const active = value === currentValue;

  if (!active && !keepMounted) {
    return null;
  }

  return (
    <div
      {...props}
      aria-labelledby={`${baseId}-tab-${value}`}
      className={cx("ui-tabs__panel", className)}
      hidden={!active}
      id={`${baseId}-panel-${value}`}
      role="tabpanel"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
