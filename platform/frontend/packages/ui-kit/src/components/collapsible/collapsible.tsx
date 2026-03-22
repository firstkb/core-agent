import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useId,
  useMemo,
} from "react";

import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

type CollapsibleContextValue = {
  contentId: string;
  disabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const context = useContext(CollapsibleContext);

  if (!context) {
    throw new Error("Collapsible primitives must be used inside a Collapsible root.");
  }

  return context;
}

export type CollapsibleProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export function Collapsible({
  children,
  defaultOpen = false,
  disabled = false,
  onOpenChange,
  open,
}: CollapsibleProps) {
  const contentId = useId();
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: open,
  });

  const contextValue = useMemo(
    () => ({
      contentId,
      disabled,
      open: isOpen,
      setOpen: setIsOpen,
    }),
    [contentId, disabled, isOpen, setIsOpen],
  );

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div
        className={cx(
          "ui-collapsible",
          isOpen && "ui-collapsible--open",
          disabled && "ui-collapsible--disabled",
        )}
        data-disabled={disabled ? "" : undefined}
        data-state={isOpen ? "open" : "closed"}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export type CollapsibleTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function CollapsibleTrigger({
  children,
  className,
  disabled,
  onClick,
  ...props
}: CollapsibleTriggerProps) {
  const context = useCollapsibleContext();
  const isDisabled = context.disabled || Boolean(disabled);

  return (
    <button
      {...props}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      className={cx("ui-collapsible__trigger", context.open && "ui-collapsible__trigger--open", className)}
      disabled={isDisabled}
      onClick={composeEventHandlers(onClick, () => {
        if (!isDisabled) {
          context.setOpen(!context.open);
        }
      })}
      type="button"
    >
      {children}
    </button>
  );
}

export type CollapsibleContentProps = HTMLAttributes<HTMLDivElement> & {
  forceMount?: boolean;
};

export function CollapsibleContent({
  children,
  className,
  forceMount = false,
  ...props
}: CollapsibleContentProps) {
  const { contentId, open } = useCollapsibleContext();

  if (!forceMount && !open) {
    return null;
  }

  return (
    <div
      {...props}
      aria-hidden={!open}
      className={cx("ui-collapsible__content", className)}
      data-state={open ? "open" : "closed"}
      hidden={!open}
      id={contentId}
    >
      <div className="ui-collapsible__content-inner">{children}</div>
    </div>
  );
}
