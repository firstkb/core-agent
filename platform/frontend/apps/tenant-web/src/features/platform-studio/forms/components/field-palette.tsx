import {
  Card,
  CardContent,
  Input,
  SearchIcon,
} from "@platform/ui-kit";

import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import { FormBuilderElementIcon } from "../forms-builder-icons";

export type FieldPaletteDisplayItem = {
  description: string;
  disabled: boolean;
  disabledReason: string | null;
  iconKey: string;
  key: string;
  label: string;
  onClick: () => void;
};

export type FieldPaletteDisplaySection = {
  items: ReadonlyArray<FieldPaletteDisplayItem>;
  key: string;
  label: string;
};

type FieldPaletteProps = {
  emptyText: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  query: string;
  searchInputId: string;
  sections: ReadonlyArray<FieldPaletteDisplaySection>;
};

type PaletteItemProps = Omit<FieldPaletteDisplayItem, "key">;

export function FieldPalette({
  emptyText,
  onQueryChange,
  placeholder,
  query,
  searchInputId,
  sections,
}: FieldPaletteProps) {
  return (
    <Card className="tenant-web__platform-studio-panel">
      <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
        <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
          <div className="tenant-web__platform-studio-search">
            <div className="tenant-web__platform-studio-search-field">
              <span className="tenant-web__platform-studio-search-icon">
                <SearchIcon />
              </span>
              <Input
                className="tenant-web__platform-studio-search-input"
                id={searchInputId}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={placeholder}
                value={query}
              />
            </div>
          </div>
        </div>

        <PlatformStudioPanelScroll>
          <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--compact-x tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll tenant-web__platform-studio-builder-panel-body--palette-scroll">
            <div className="tenant-web__platform-studio-palette">
              {sections.map((section) => (
                <section className="tenant-web__platform-studio-palette-section" key={section.key}>
                  <h3 className="tenant-web__platform-studio-palette-heading">
                    {section.label}
                  </h3>
                  <div className="tenant-web__platform-studio-palette-list">
                    {section.items.map((item) => (
                      <PaletteItem
                        description={item.description}
                        disabled={item.disabled}
                        disabledReason={item.disabledReason}
                        iconKey={item.iconKey}
                        key={item.key}
                        label={item.label}
                        onClick={item.onClick}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {sections.length === 0 ? (
                <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                  <p>{emptyText}</p>
                </div>
              ) : null}
            </div>
          </div>
        </PlatformStudioPanelScroll>
      </CardContent>
    </Card>
  );
}

function PaletteItem({
  description,
  disabled,
  disabledReason,
  iconKey,
  label,
  onClick,
}: PaletteItemProps) {
  return (
    <button
      className={`tenant-web__platform-studio-palette-item${disabled ? " tenant-web__platform-studio-palette-item--disabled" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={disabledReason ?? undefined}
      type="button"
    >
      <span className="tenant-web__platform-studio-item-icon">
        <FormBuilderElementIcon iconKey={iconKey} />
      </span>
      <span className="tenant-web__platform-studio-palette-copy">
        <span className="tenant-web__platform-studio-palette-title">{label}</span>
        <span className="tenant-web__platform-studio-palette-description">{description}</span>
      </span>
    </button>
  );
}
