import { Switch } from "@platform/ui-kit";

import { uiLabLeafMeta } from "../model/leaf-meta";
import type { UiLabLeafId, UiLabSectionId, UiLabTheme } from "../model/leaf-meta";
import type { UiLabSectionEntry } from "../model/navigation";
import { getLeafStatus, getLeafStatusLabel, hasUiKitCoverage } from "../model/status";
import { ChevronIcon, SearchIcon } from "./icons";
import { renderSectionIcon } from "./docs-cards";

type UiLabSidebarProps = {
  activeLeafId: UiLabLeafId;
  activeSectionId: UiLabSectionId;
  className?: string;
  onLeafNavigate: (id: UiLabLeafId) => void;
  onSearchQueryChange: (value: string) => void;
  onSectionToggle: (id: UiLabSectionId) => void;
  onThemeChange: (theme: UiLabTheme) => void;
  openSectionId: UiLabSectionId | null;
  pageTheme: UiLabTheme;
  searchQuery: string;
  sectionEntries: UiLabSectionEntry[];
  sidebarId?: string;
};

export function UiLabSidebar({
  activeLeafId,
  activeSectionId,
  className = "",
  onLeafNavigate,
  onSearchQueryChange,
  onSectionToggle,
  onThemeChange,
  openSectionId,
  pageTheme,
  searchQuery,
  sectionEntries,
  sidebarId,
}: UiLabSidebarProps) {
  function renderLeafButton(id: UiLabLeafId) {
    const item = uiLabLeafMeta[id];
    const status = getLeafStatus(id);
    const showUiKitBadge = hasUiKitCoverage(id);

    return (
      <button
        className={`ui-lab-page__nav-leaf ui-lab-page__nav-leaf--nested${activeLeafId === id ? " ui-lab-page__nav-leaf--active" : ""}`}
        key={id}
        onClick={() => onLeafNavigate(id)}
        type="button"
      >
        <span>{item.label}</span>
        <span className="ui-lab-page__nav-leaf-badges">
          {showUiKitBadge ? (
            <span className="ui-lab-page__nav-leaf-meta ui-lab-page__nav-leaf-meta--ui-kit">
              UI Kit
            </span>
          ) : null}
          {status !== "ready" ? (
            <span className={`ui-lab-page__nav-leaf-meta ui-lab-page__nav-leaf-meta--${status}`}>
              {getLeafStatusLabel(status)}
            </span>
          ) : null}
        </span>
      </button>
    );
  }

  return (
    <aside className={`ui-lab-page__sidebar${className ? ` ${className}` : ""}`} id={sidebarId}>
      <div className="ui-lab-page__brand">UI Lab</div>

      <div className="ui-lab-page__search" role="search">
        <SearchIcon className="ui-lab-page__search-icon" />
        <input
          aria-label="Search UI Lab"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="ui-lab-page__search-field"
          id="ui-lab-search"
          name="ui-lab-search"
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search"
          spellCheck={false}
          type="text"
          value={searchQuery}
        />
      </div>

      <nav aria-label="UI Lab navigation" className="ui-lab-page__nav">
        {sectionEntries.map((section) => {
          const isOpen = searchQuery.trim() ? true : openSectionId === section.id;
          const isActive = activeSectionId === section.id;

          return (
            <div className="ui-lab-page__nav-parent-group" key={section.id}>
              <button
                className={`ui-lab-page__nav-parent${isActive ? " ui-lab-page__nav-parent--active" : ""}`}
                onClick={() => onSectionToggle(section.id)}
                type="button"
              >
                <span className="ui-lab-page__nav-parent-copy">
                  {renderSectionIcon(section.icon, { className: "ui-lab-page__nav-icon" })}
                  <span>{section.label}</span>
                </span>
                <ChevronIcon open={isOpen} />
              </button>

              {isOpen ? (
                <div className="ui-lab-page__nav-parent-body">
                  {section.visibleLeaves.map((id) => renderLeafButton(id))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <footer className="ui-lab-page__sidebar-footer">
        <div className="ui-lab-page__theme-toggle">
          <div className="ui-lab-page__theme-copy">
            <span className="ui-lab-page__theme-label">Page Theme</span>
            <span className="ui-lab-page__theme-value">{pageTheme === "dark" ? "Dark" : "Light"}</span>
          </div>
          <Switch
            aria-label="Toggle UI Lab page theme"
            checked={pageTheme === "dark"}
            onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")}
          />
        </div>
      </footer>
    </aside>
  );
}
