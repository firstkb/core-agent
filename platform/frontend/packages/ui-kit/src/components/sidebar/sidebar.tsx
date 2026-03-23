import { type HTMLAttributes, type ReactNode, type SVGProps, useMemo } from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

function SidebarChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M5.5 7.5L10 12.25L14.5 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export type SidebarNavItem = {
  collapsedLabel?: string;
  children?: SidebarNavItem[];
  defaultOpen?: boolean;
  disabled?: boolean;
  expandedLabel?: string;
  icon?: ReactNode;
  id: string;
  label: string;
  maxVisibleChildren?: number;
  meta?: ReactNode;
};

export type SidebarNavProps = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  activeItemId?: string;
  ariaLabel?: string;
  compact?: boolean;
  defaultActiveItemId?: string;
  defaultOpenItemIds?: string[];
  items: SidebarNavItem[];
  onActiveItemChange?: (itemId: string, item: SidebarNavItem) => void;
  onOpenItemIdsChange?: (itemIds: string[]) => void;
  openItemIds?: string[];
  disclosureMode?: "multiple" | "single";
};

function collectDefaultOpenItemIds(items: SidebarNavItem[]) {
  const itemIds: string[] = [];

  for (const item of items) {
    if (item.children?.length && item.defaultOpen) {
      itemIds.push(item.id);
    }

    if (item.children?.length) {
      itemIds.push(...collectDefaultOpenItemIds(item.children));
    }
  }

  return itemIds;
}

function findFirstLeafId(items: SidebarNavItem[]): string {
  for (const item of items) {
    if (item.children?.length) {
      const childLeafId = findFirstLeafId(item.children);

      if (childLeafId) {
        return childLeafId;
      }

      continue;
    }

    return item.id;
  }

  return "";
}

function findItemById(items: SidebarNavItem[], itemId: string): SidebarNavItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    if (item.children?.length) {
      const nestedMatch = findItemById(item.children, itemId);

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
}

function itemContainsId(item: SidebarNavItem, itemId: string): boolean {
  if (item.id === itemId) {
    return true;
  }

  return item.children?.some((childItem) => itemContainsId(childItem, itemId)) ?? false;
}

function normalizeItemIds(itemIds: string[]) {
  return Array.from(new Set(itemIds));
}

function collectBranchIdsByParent(
  items: SidebarNavItem[],
  parentId: string | null = null,
  branchIdsByParent = new Map<string | null, string[]>(),
) {
  for (const item of items) {
    if (!item.children?.length) {
      continue;
    }

    const siblingBranchIds = branchIdsByParent.get(parentId) ?? [];
    siblingBranchIds.push(item.id);
    branchIdsByParent.set(parentId, siblingBranchIds);

    collectBranchIdsByParent(item.children, item.id, branchIdsByParent);
  }

  return branchIdsByParent;
}

export function SidebarNav({
  activeItemId,
  ariaLabel = "Sidebar navigation",
  className,
  compact = false,
  defaultActiveItemId,
  defaultOpenItemIds,
  items,
  onActiveItemChange,
  onOpenItemIdsChange,
  openItemIds,
  disclosureMode = "single",
  ...props
}: SidebarNavProps) {
  const branchIdsByParent = useMemo(
    () => collectBranchIdsByParent(items),
    [items],
  );
  const resolvedDefaultOpenItemIds = useMemo(
    () => normalizeItemIds(defaultOpenItemIds ?? collectDefaultOpenItemIds(items)),
    [defaultOpenItemIds, items],
  );
  const [currentOpenItemIds, setCurrentOpenItemIds] = useControllableState<string[]>({
    defaultValue: resolvedDefaultOpenItemIds,
    onChange: onOpenItemIdsChange,
    value: openItemIds,
  });
  const [currentActiveItemId, setCurrentActiveItemId] = useControllableState<string>({
    defaultValue: defaultActiveItemId ?? findFirstLeafId(items),
    onChange: (itemId) => {
      const item = findItemById(items, itemId);

      if (item) {
        onActiveItemChange?.(itemId, item);
      }
    },
    value: activeItemId,
  });
  const [expandedOverflowItemIds, setExpandedOverflowItemIds] = useControllableState<string[]>({
    defaultValue: [],
  });

  function toggleItem(itemId: string, parentItemId: string | null) {
    setCurrentOpenItemIds((previousItemIds) => {
      const isOpen = previousItemIds.includes(itemId);

      if (isOpen) {
        return previousItemIds.filter((openItemId) => openItemId !== itemId);
      }

      if (disclosureMode === "single") {
        const siblingBranchIds = branchIdsByParent.get(parentItemId) ?? [];
        const nextItemIds = previousItemIds.filter((openItemId) => !siblingBranchIds.includes(openItemId));
        return [...nextItemIds, itemId];
      }

      return [...previousItemIds, itemId];
    });
  }

  function toggleOverflow(itemId: string) {
    setExpandedOverflowItemIds((previousItemIds) =>
      previousItemIds.includes(itemId)
        ? previousItemIds.filter((expandedItemId) => expandedItemId !== itemId)
        : [...previousItemIds, itemId],
    );
  }

  function renderItems(sidebarItems: SidebarNavItem[], level: number, parentItemId?: string): ReactNode {
    return sidebarItems.map((item) => {
      const hasChildren = Boolean(item.children?.length);
      const isOpen = hasChildren && currentOpenItemIds.includes(item.id);
      const isActive = !hasChildren && currentActiveItemId === item.id;
      const isBranchActive =
        hasChildren &&
        level === 0 &&
        Boolean(currentActiveItemId) &&
        itemContainsId(item, currentActiveItemId);
      const isOverflowExpanded = expandedOverflowItemIds.includes(item.id);
      const maxVisibleChildren = item.maxVisibleChildren;
      const hasOverflow =
        hasChildren &&
        typeof maxVisibleChildren === "number" &&
        maxVisibleChildren > 0 &&
        (item.children?.length ?? 0) > maxVisibleChildren;
      const visibleChildren =
        hasOverflow && !isOverflowExpanded
          ? item.children?.slice(0, maxVisibleChildren) ?? []
          : item.children ?? [];
      const hiddenChildrenCount = hasOverflow ? (item.children?.length ?? 0) - maxVisibleChildren : 0;

      const visibleLabel =
        hasChildren
          ? isOpen
            ? item.expandedLabel ?? item.label
            : item.collapsedLabel ?? item.label
          : item.label;

      return (
        <div className="ui-sidebar-nav__item" data-parent={parentItemId} key={item.id}>
          <button
            aria-controls={hasChildren ? `ui-sidebar-nav-branch-${item.id}` : undefined}
            aria-current={isActive ? "page" : undefined}
            aria-expanded={hasChildren ? isOpen : undefined}
            className={cx(
              "ui-sidebar-nav__row",
              `ui-sidebar-nav__row--level-${Math.min(level, 2)}`,
              isBranchActive && "ui-sidebar-nav__row--branch-active",
              hasChildren && isOpen && "ui-sidebar-nav__row--open",
              isActive && "ui-sidebar-nav__row--active",
            )}
            disabled={item.disabled}
            onClick={() => {
              if (hasChildren) {
                toggleItem(item.id, parentItemId ?? null);
                return;
              }

              setCurrentActiveItemId(item.id);
            }}
            type="button"
          >
            <span className="ui-sidebar-nav__row-copy">
              {item.icon ? <span className="ui-sidebar-nav__icon-slot">{item.icon}</span> : null}
              <span className="ui-sidebar-nav__label">{visibleLabel}</span>
            </span>
            <span className="ui-sidebar-nav__row-end">
              {item.meta ? (
                <span
                  className={cx(
                    "ui-sidebar-nav__meta",
                    (typeof item.meta === "string" || typeof item.meta === "number") && "ui-sidebar-nav__meta--pill",
                  )}
                >
                  {item.meta}
                </span>
              ) : null}
              {hasChildren ? <SidebarChevronIcon className="ui-sidebar-nav__caret" /> : null}
            </span>
          </button>

          {hasChildren && isOpen ? (
            <div
              className="ui-sidebar-nav__branch"
              id={`ui-sidebar-nav-branch-${item.id}`}
            >
              {renderItems(visibleChildren, level + 1, item.id)}
              {hasOverflow ? (
                <button
                  aria-expanded={isOverflowExpanded}
                  className={cx(
                    "ui-sidebar-nav__overflow-toggle",
                    `ui-sidebar-nav__overflow-toggle--level-${Math.min(level + 1, 2)}`,
                  )}
                  onClick={() => toggleOverflow(item.id)}
                  type="button"
                >
                  {isOverflowExpanded ? "Less" : `More (${hiddenChildrenCount})`}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    });
  }

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={cx("ui-sidebar-nav", compact && "ui-sidebar-nav--compact", className)}
    >
      {renderItems(items, 0)}
    </nav>
  );
}
