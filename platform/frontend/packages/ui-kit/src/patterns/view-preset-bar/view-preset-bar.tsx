import type { HTMLAttributes } from "react";

import { Badge, type BadgeVariant } from "../../components/badge";
import { cx } from "../../lib/cx";

export type ViewPresetItem = {
  id: string;
  label: string;
  meta?: string;
  count?: string;
  tone?: BadgeVariant;
};

export type ViewPresetBarProps = HTMLAttributes<HTMLDivElement> & {
  presets: ReadonlyArray<ViewPresetItem>;
  activePresetId: string;
  onPresetSelect: (presetId: string) => void;
};

export function ViewPresetBar({
  activePresetId,
  className,
  onPresetSelect,
  presets,
  ...props
}: ViewPresetBarProps) {
  return (
    <div {...props} className={cx("ui-view-preset-bar", className)}>
      {presets.map((preset) => {
        const active = preset.id === activePresetId;

        return (
          <button
            aria-pressed={active}
            className={cx("ui-view-preset-bar__item", active && "ui-view-preset-bar__item--active")}
            key={preset.id}
            onClick={() => onPresetSelect(preset.id)}
            type="button"
          >
            <div className="ui-view-preset-bar__item-header">
              <span className="ui-view-preset-bar__label">{preset.label}</span>
              {preset.count ? <span className="ui-view-preset-bar__count">{preset.count}</span> : null}
            </div>
            {preset.meta ? <span className="ui-view-preset-bar__meta">{preset.meta}</span> : null}
            {preset.tone ? (
              <Badge appearance="soft" size="sm" variant={preset.tone}>
                {preset.tone}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
