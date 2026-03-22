import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  HTMLAttributes,
  ImgHTMLAttributes,
} from "react";

import { cx } from "../../lib/cx";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarFallbackTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type AvatarStatusTone = "online" | "offline" | "busy" | "away";

type AvatarImageState = "idle" | "loaded" | "error";

type AvatarContextValue = {
  imageState: AvatarImageState;
  setImageState: (nextState: AvatarImageState) => void;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  size?: AvatarSize;
};

export type AvatarImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "children">;

export type AvatarFallbackProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: AvatarFallbackTone;
};

export type AvatarIndicatorProps = HTMLAttributes<HTMLSpanElement>;

export type AvatarStatusProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: AvatarStatusTone;
};

export type AvatarGroupItem = {
  alt?: string;
  fallback?: string;
  id: string;
  src?: string;
  status?: AvatarStatusTone;
  tone?: AvatarFallbackTone;
};

export type AvatarGroupProps = HTMLAttributes<HTMLDivElement> & {
  items: readonly AvatarGroupItem[];
  max?: number;
  size?: AvatarSize;
};

function getInitials(value?: string) {
  if (!value) {
    return "?";
  }

  const initials = value
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return initials.toUpperCase() || "?";
}

function useAvatarContext() {
  return useContext(AvatarContext);
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { children, className, size = "md", ...props },
  ref,
) {
  const [imageState, setImageState] = useState<AvatarImageState>("idle");

  const contextValue = useMemo(
    () => ({ imageState, setImageState }),
    [imageState],
  );

  return (
    <AvatarContext.Provider value={contextValue}>
      <span
        {...props}
        className={cx("ui-avatar", `ui-avatar--${size}`, className)}
        ref={ref}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  );
});

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(function AvatarImage(
  { className, onError, onLoad, src, ...props },
  ref,
) {
  const context = useAvatarContext();
  const setImageState = context?.setImageState;

  useEffect(() => {
    setImageState?.(src ? "idle" : "error");
  }, [setImageState, src]);

  return (
    <img
      {...props}
      alt={props.alt ?? ""}
      className={cx(
        "ui-avatar__image",
        context?.imageState === "loaded" && "ui-avatar__image--loaded",
        className,
      )}
      onError={(event) => {
        setImageState?.("error");
        onError?.(event);
      }}
      onLoad={(event) => {
        setImageState?.("loaded");
        onLoad?.(event);
      }}
      ref={ref}
      src={src}
    />
  );
});

export const AvatarFallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(function AvatarFallback(
  { children, className, tone = "neutral", ...props },
  ref,
) {
  const context = useAvatarContext();
  const hidden = context?.imageState === "loaded";

  return (
    <span
      {...props}
      aria-hidden={hidden || undefined}
      className={cx(
        "ui-avatar__fallback",
        `ui-avatar__fallback--${tone}`,
        hidden && "ui-avatar__fallback--hidden",
        className,
      )}
      ref={ref}
    >
      {children}
    </span>
  );
});

export const AvatarIndicator = forwardRef<HTMLSpanElement, AvatarIndicatorProps>(function AvatarIndicator(
  { className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      className={cx("ui-avatar__indicator", className)}
      ref={ref}
    />
  );
});

export const AvatarStatus = forwardRef<HTMLSpanElement, AvatarStatusProps>(function AvatarStatus(
  { className, tone = "online", ...props },
  ref,
) {
  return (
    <span
      {...props}
      className={cx("ui-avatar__status", `ui-avatar__status--${tone}`, className)}
      ref={ref}
    />
  );
});

export function AvatarGroup({
  className,
  items,
  max = 4,
  size = "md",
  ...props
}: AvatarGroupProps) {
  const visibleItems = items.slice(0, max);
  const overflowCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <div
      {...props}
      className={cx("ui-avatar-group", `ui-avatar-group--${size}`, className)}
    >
      {visibleItems.map((item, index) => (
        <Avatar
          aria-label={item.alt ?? item.id}
          className={cx("ui-avatar-group__item", index === 0 && "ui-avatar-group__item--first")}
          key={item.id}
          size={size}
          title={item.alt ?? item.id}
        >
          {item.src ? <AvatarImage alt={item.alt ?? item.id} src={item.src} /> : null}
          <AvatarFallback tone={item.tone}>{item.fallback ?? getInitials(item.alt ?? item.id)}</AvatarFallback>
          {item.status ? (
            <AvatarIndicator>
              <AvatarStatus tone={item.status} />
            </AvatarIndicator>
          ) : null}
        </Avatar>
      ))}
      {overflowCount > 0 ? (
        <span
          aria-label={`${overflowCount} more`}
          className={cx("ui-avatar-group__overflow", `ui-avatar-group__overflow--${size}`)}
          title={`${overflowCount} more`}
        >
          +{overflowCount}
        </span>
      ) : null}
    </div>
  );
}
