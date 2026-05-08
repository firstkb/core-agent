import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type {
  TenantFavoriteShortcut,
  TenantRuntimeCreateAction,
  TenantRuntimeNavigationItem,
} from "@platform/api-client";
import { useTranslation } from "@platform/i18n";
import {
  ArrowRightIcon,
  DashboardGridIcon,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DocumentListIcon,
  FormIcon,
  HelpCircleIcon,
  LayersIcon,
  PlusIcon,
  RoutePathIcon,
  SearchIcon,
  StarIcon,
} from "@platform/ui-kit";

import type { TenantRailUtilityPanel } from "../tenant-rail-utility-sheet/tenant-rail-utility-sheet";
import {
  buildSearchResults,
  normalizeSearchText,
  searchGroups,
  type SearchResult,
  type TenantWorkspaceSearchUtility,
} from "./tenant-workspace-search-results";
import "./tenant-workspace-search-dialog.css";

type TenantWorkspaceSearchDialogProps = {
  createActions: TenantRuntimeCreateAction[];
  favorites: TenantFavoriteShortcut[];
  navigationItems: TenantRuntimeNavigationItem[];
  onNavigate: (path: string) => void;
  onOpenChange: (open: boolean) => void;
  onOpenExternal: (url: string) => void;
  onOpenUtilityPanel: (panel: TenantRailUtilityPanel) => void;
  open: boolean;
  utilities: TenantWorkspaceSearchUtility[];
};

function getResultIcon(result: SearchResult) {
  if (result.group === "create") {
    return <PlusIcon />;
  }
  if (result.group === "favorites") {
    return <StarIcon />;
  }
  if (result.group === "navigation") {
    return result.badge === "View" ? <FormIcon /> : <RoutePathIcon />;
  }

  switch (result.utilityIcon) {
    case "dashboard":
      return <DashboardGridIcon />;
    case "favorites":
      return <StarIcon />;
    case "help":
      return <HelpCircleIcon />;
    case "platform-studio":
      return <LayersIcon />;
    case "tasks":
      return <DocumentListIcon />;
    default:
      return <RoutePathIcon />;
  }
}

export function TenantWorkspaceSearchDialog({
  createActions,
  favorites,
  navigationItems,
  onNavigate,
  onOpenChange,
  onOpenExternal,
  onOpenUtilityPanel,
  open,
  utilities,
}: TenantWorkspaceSearchDialogProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(
    () => buildSearchResults({ createActions, favorites, navigationItems, utilities }),
    [createActions, favorites, navigationItems, utilities],
  );
  const normalizedQuery = normalizeSearchText(query);
  const groupedResults = useMemo(() => {
    const matches = normalizedQuery
      ? results.filter((result) => result.searchText.includes(normalizedQuery))
      : results;
    const perGroupLimit = normalizedQuery ? 12 : 7;

    return searchGroups
      .map((group) => ({
        ...group,
        results: matches.filter((result) => result.group === group.key).slice(0, perGroupLimit),
      }))
      .filter((group) => group.results.length > 0);
  }, [normalizedQuery, results]);
  const flatResults = groupedResults.flatMap((group) => group.results);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setActiveIndex(0);
    const frameID = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameID);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    setActiveIndex((value) => Math.min(value, Math.max(flatResults.length - 1, 0)));
  }, [flatResults.length]);

  function selectResult(result: SearchResult) {
    onOpenChange(false);
    if (result.path) {
      onNavigate(result.path);
      return;
    }
    if (result.externalUrl) {
      onOpenExternal(result.externalUrl);
      return;
    }
    if (result.utilityPanel) {
      onOpenUtilityPanel(result.utilityPanel);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!flatResults.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, flatResults.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectResult(flatResults[activeIndex] ?? flatResults[0]);
    }
  }

  const emptyTitle = normalizedQuery
    ? t("tenant.shell.workspaceSearch.noResultsTitle")
    : t("tenant.shell.workspaceSearch.emptyTitle");
  const emptyDescription = normalizedQuery
    ? t("tenant.shell.workspaceSearch.noResultsDescription")
    : t("tenant.shell.workspaceSearch.emptyDescription");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="tenant-web__workspace-search-dialog">
        <DialogHeader className="tenant-web__workspace-search-header">
          <DialogTitle className="tenant-web__workspace-search-title">
            {t("tenant.shell.workspaceSearch.title")}
          </DialogTitle>
          <div className="tenant-web__workspace-search-input-wrap">
            <SearchIcon />
            <input
              aria-label={t("tenant.shell.workspaceSearch.inputAriaLabel")}
              className="tenant-web__workspace-search-input"
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t("tenant.shell.workspaceSearch.placeholder")}
              ref={inputRef}
              type="search"
              value={query}
            />
          </div>
        </DialogHeader>

        <DialogBody className="tenant-web__workspace-search-body">
          {groupedResults.length ? (
            groupedResults.map((group) => {
              let groupOffset = 0;
              for (const previousGroup of groupedResults) {
                if (previousGroup.key === group.key) {
                  break;
                }
                groupOffset += previousGroup.results.length;
              }

              return (
                <section className="tenant-web__workspace-search-group" key={group.key}>
                  <h3>{t(`tenant.shell.workspaceSearch.groups.${group.key}`)}</h3>
                  <div className="tenant-web__workspace-search-result-list">
                    {group.results.map((result, index) => {
                      const resultIndex = groupOffset + index;
                      const isActive = resultIndex === activeIndex;
                      return (
                        <button
                          className={`tenant-web__workspace-search-result${isActive ? " tenant-web__workspace-search-result--active" : ""}`}
                          key={result.id}
                          onClick={() => selectResult(result)}
                          onMouseEnter={() => setActiveIndex(resultIndex)}
                          type="button"
                        >
                          <span className="tenant-web__workspace-search-result-icon" aria-hidden="true">
                            {getResultIcon(result)}
                          </span>
                          <span className="tenant-web__workspace-search-result-copy">
                            <span className="tenant-web__workspace-search-result-title">{result.title}</span>
                            <span className="tenant-web__workspace-search-result-subtitle">{result.subtitle}</span>
                          </span>
                          <span className="tenant-web__workspace-search-result-meta">
                            <span>{result.badge}</span>
                            <ArrowRightIcon />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="tenant-web__workspace-search-empty">
              <span className="tenant-web__workspace-search-empty-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <h3>{emptyTitle}</h3>
              <p>{emptyDescription}</p>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type { TenantWorkspaceSearchUtility };
