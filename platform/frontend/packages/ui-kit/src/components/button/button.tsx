import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode, SVGProps } from "react";

import { cx } from "../../lib/cx";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "../menu";
import type { MenuItemTone } from "../menu";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "info" | "success" | "warning" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  pending?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export type SplitButtonItem = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  shortcut?: string;
  tone?: MenuItemTone;
  onSelect?: () => void;
};

export type SplitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  pending?: boolean;
  leadingIcon?: ReactNode;
  items: ReadonlyArray<SplitButtonItem>;
  className?: string;
  menuLabel?: ReactNode;
  dropdownAriaLabel?: string;
  disabledMenu?: boolean;
  onItemSelect?: (item: SplitButtonItem) => void;
};

function SplitButtonChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

/**
 * Product-owned button foundation extracted from Metronic design ideas,
 * but rewritten against local tokens and a stable API.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant = "primary",
    size = "md",
    block = false,
    pending = false,
    disabled,
    leadingIcon,
    trailingIcon,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cx(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        block && "ui-button--block",
        className,
      )}
    >
      {pending ? <span aria-hidden="true" className="ui-button__spinner" /> : null}
      {!pending && leadingIcon ? <span className="ui-button__icon">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="ui-button__icon">{trailingIcon}</span> : null}
    </button>
  );
});

export const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(function SplitButton(
  {
    children,
    className,
    variant = "primary",
    size = "md",
    block = false,
    pending = false,
    disabled,
    disabledMenu = false,
    leadingIcon,
    items,
    menuLabel,
    dropdownAriaLabel = "Open additional actions",
    onItemSelect,
    type = "button",
    ...props
  },
  ref,
) {
  const menuDisabled = disabled || pending || disabledMenu || items.length === 0;

  return (
    <div
      className={cx(
        "ui-split-button",
        `ui-split-button--${size}`,
        block && "ui-split-button--block",
        className,
      )}
    >
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        className={cx(
          "ui-button",
          `ui-button--${variant}`,
          `ui-button--${size}`,
          "ui-split-button__main",
          block && "ui-button--block",
        )}
      >
        {pending ? <span aria-hidden="true" className="ui-button__spinner" /> : null}
        {!pending && leadingIcon ? <span className="ui-button__icon">{leadingIcon}</span> : null}
        <span>{children}</span>
      </button>

      <Menu align="end">
        <MenuTrigger>
          <button
            aria-label={dropdownAriaLabel}
            className={cx(
              "ui-button",
              `ui-button--${variant}`,
              `ui-button--${size}`,
              "ui-split-button__trigger",
            )}
            disabled={menuDisabled}
            type="button"
          >
            <SplitButtonChevronIcon className="ui-split-button__chevron" />
          </button>
        </MenuTrigger>
        <MenuContent className="ui-split-button__menu">
          {menuLabel ? <MenuLabel>{menuLabel}</MenuLabel> : null}
          {items.map((item) => (
            <MenuItem
              disabled={item.disabled}
              key={item.id}
              onClick={() => {
                item.onSelect?.();
                onItemSelect?.(item);
              }}
              shortcut={item.shortcut}
              tone={item.tone}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </div>
  );
});
