import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
  useContext,
  useId,
  useMemo,
} from "react";

import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

export type AccordionType = "single" | "multiple";
export type AccordionVariant = "default" | "outline" | "muted";
export type AccordionIndicator = "chevron" | "plus" | "none";

type AccordionValue = string | string[] | null | undefined;

type AccordionContextValue = {
  indicator: AccordionIndicator;
  isItemOpen: (value: string) => boolean;
  toggleItem: (value: string) => void;
  variant: AccordionVariant;
};

type AccordionItemContextValue = {
  contentId: string;
  disabled: boolean;
  open: boolean;
  value: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function normalizeValue(type: AccordionType, value: AccordionValue) {
  if (type === "multiple") {
    return Array.isArray(value) ? value : [];
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  if (Array.isArray(value) && value.length > 0) {
    return [value[0]];
  }

  return [];
}

function serializeValue(type: AccordionType, value: string[]) {
  return type === "multiple" ? value : (value[0] ?? null);
}

function useAccordionContext() {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error("Accordion primitives must be used inside an Accordion root.");
  }

  return context;
}

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);

  if (!context) {
    throw new Error("Accordion item primitives must be used inside an Accordion item.");
  }

  return context;
}

function AccordionChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M5.5 7.5L10 12L14.5 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type AccordionProps = {
  children: ReactNode;
  defaultValue?: AccordionValue;
  indicator?: AccordionIndicator;
  onValueChange?: (value: string | string[] | null) => void;
  type?: AccordionType;
  value?: AccordionValue;
  variant?: AccordionVariant;
};

export function Accordion({
  children,
  defaultValue,
  indicator = "chevron",
  onValueChange,
  type = "single",
  value,
  variant = "default",
}: AccordionProps) {
  const [openValues, setOpenValues] = useControllableState<string[]>({
    defaultValue: normalizeValue(type, defaultValue),
    onChange: (nextValue) => onValueChange?.(serializeValue(type, nextValue)),
    value: value === undefined ? undefined : normalizeValue(type, value),
  });

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      indicator,
      isItemOpen: (itemValue) => openValues.includes(itemValue),
      toggleItem: (itemValue) => {
        setOpenValues((currentValue) => {
          const normalizedCurrent = currentValue ?? [];

          if (type === "multiple") {
            return normalizedCurrent.includes(itemValue)
              ? normalizedCurrent.filter((valueItem) => valueItem !== itemValue)
              : [...normalizedCurrent, itemValue];
          }

          return normalizedCurrent.includes(itemValue) ? [] : [itemValue];
        });
      },
      variant,
    }),
    [indicator, openValues, setOpenValues, type, variant],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cx("ui-accordion", `ui-accordion--${variant}`)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean;
  value: string;
};

export function AccordionItem({
  children,
  className,
  disabled = false,
  value,
  ...props
}: AccordionItemProps) {
  const { isItemOpen, variant } = useAccordionContext();
  const contentId = useId();
  const open = isItemOpen(value);

  const contextValue = useMemo<AccordionItemContextValue>(
    () => ({
      contentId,
      disabled,
      open,
      value,
    }),
    [contentId, disabled, open, value],
  );

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div
        {...props}
        className={cx(
          "ui-accordion__item",
          `ui-accordion__item--${variant}`,
          open && "ui-accordion__item--open",
          disabled && "ui-accordion__item--disabled",
          className,
        )}
        data-state={open ? "open" : "closed"}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export type AccordionTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function AccordionTrigger({
  children,
  className,
  disabled,
  onClick,
  ...props
}: AccordionTriggerProps) {
  const { indicator, toggleItem, variant } = useAccordionContext();
  const itemContext = useAccordionItemContext();
  const isDisabled = itemContext.disabled || Boolean(disabled);

  return (
    <button
      {...props}
      aria-controls={itemContext.contentId}
      aria-expanded={itemContext.open}
      className={cx(
        "ui-accordion__trigger",
        `ui-accordion__trigger--${variant}`,
        itemContext.open && "ui-accordion__trigger--open",
        className,
      )}
      disabled={isDisabled}
      onClick={composeEventHandlers(onClick, () => {
        if (!isDisabled) {
          toggleItem(itemContext.value);
        }
      })}
      type="button"
    >
      <span className="ui-accordion__trigger-label">{children}</span>
      {indicator === "chevron" ? (
        <AccordionChevronIcon
          className={cx(
            "ui-accordion__trigger-indicator",
            "ui-accordion__trigger-indicator--chevron",
          )}
        />
      ) : null}
      {indicator === "plus" ? (
        <span
          aria-hidden="true"
          className={cx(
            "ui-accordion__trigger-indicator",
            indicator === "plus" && "ui-accordion__trigger-indicator--plus",
          )}
        />
      ) : null}
    </button>
  );
}

export type AccordionContentProps = HTMLAttributes<HTMLDivElement> & {
  forceMount?: boolean;
};

export function AccordionContent({
  children,
  className,
  forceMount = false,
  ...props
}: AccordionContentProps) {
  const { variant } = useAccordionContext();
  const itemContext = useAccordionItemContext();

  if (!forceMount && !itemContext.open) {
    return null;
  }

  return (
    <div
      {...props}
      aria-hidden={!itemContext.open}
      className={cx(
        "ui-accordion__content",
        `ui-accordion__content--${variant}`,
        className,
      )}
      data-state={itemContext.open ? "open" : "closed"}
      hidden={!itemContext.open}
      id={itemContext.contentId}
    >
      <div className="ui-accordion__content-inner">{children}</div>
    </div>
  );
}
