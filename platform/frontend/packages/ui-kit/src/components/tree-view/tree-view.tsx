import {
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { DocumentListIcon, FolderIcon } from "../../icons";
import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

export type TreeViewDensity = "compact" | "comfortable";

export type TreeViewNode = {
  ariaLabel?: string;
  children?: TreeViewNode[];
  defaultExpanded?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  id: string;
  label: ReactNode;
  meta?: ReactNode;
  secondaryLabel?: ReactNode;
};

export type TreeViewProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  ariaLabel?: string;
  defaultExpandedItemIds?: string[];
  defaultSelectedItemId?: string | null;
  density?: TreeViewDensity;
  expandedItemIds?: string[];
  items: TreeViewNode[];
  onExpandedItemIdsChange?: (itemIds: string[]) => void;
  onSelectedItemChange?: (itemId: string, item: TreeViewNode) => void;
  readOnly?: boolean;
  selectedItemId?: string | null;
  showGuides?: boolean;
  showIcons?: boolean;
};

type FlatTreeViewNode = {
  item: TreeViewNode;
  level: number;
  parentId: string | null;
  posInSet: number;
  setSize: number;
};

type TreeViewItemStyle = CSSProperties & {
  "--ui-tree-level"?: number;
  "--ui-tree-offset"?: string;
};

function hasChildren(item: TreeViewNode) {
  return Boolean(item.children?.length);
}

function normalizeItemIds(itemIds: string[]) {
  return Array.from(new Set(itemIds));
}

function collectDefaultExpandedItemIds(items: TreeViewNode[]) {
  const itemIds: string[] = [];

  for (const item of items) {
    if (hasChildren(item) && item.defaultExpanded) {
      itemIds.push(item.id);
    }

    if (item.children?.length) {
      itemIds.push(...collectDefaultExpandedItemIds(item.children));
    }
  }

  return itemIds;
}

function findItemById(items: TreeViewNode[], itemId: string): TreeViewNode | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    if (item.children?.length) {
      const nestedItem = findItemById(item.children, itemId);

      if (nestedItem) {
        return nestedItem;
      }
    }
  }

  return null;
}

function flattenTreeViewItems(
  items: TreeViewNode[],
  expandedItemIds: Set<string>,
  level = 1,
  parentId: string | null = null,
): FlatTreeViewNode[] {
  return items.flatMap((item, index) => {
    const flatItem: FlatTreeViewNode = {
      item,
      level,
      parentId,
      posInSet: index + 1,
      setSize: items.length,
    };

    if (!hasChildren(item) || !expandedItemIds.has(item.id)) {
      return [flatItem];
    }

    return [
      flatItem,
      ...flattenTreeViewItems(item.children ?? [], expandedItemIds, level + 1, item.id),
    ];
  });
}

function findNextFocusableItemId(
  flatItems: FlatTreeViewNode[],
  currentItemId: string,
  direction: "next" | "previous",
  readOnly: boolean,
) {
  const focusableItems = flatItems.filter(({ item }) => isTreeItemFocusable(item, readOnly));
  const currentIndex = focusableItems.findIndex(({ item }) => item.id === currentItemId);

  if (currentIndex === -1) {
    return focusableItems[0]?.item.id ?? null;
  }

  const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  return focusableItems[nextIndex]?.item.id ?? null;
}

function isTreeItemFocusable(item: TreeViewNode, readOnly: boolean) {
  return !item.disabled && (!readOnly || hasChildren(item));
}

function TreeViewGuides({ indentRem, level }: { indentRem: number; level: number }) {
  if (level <= 1) {
    return null;
  }

  return (
    <span aria-hidden="true" className="ui-tree-view__guides">
      {Array.from({ length: level - 1 }).map((_, index) => (
        <span
          className="ui-tree-view__guide"
          key={index}
          style={{ "--ui-tree-guide-offset": `${(index * indentRem) + 0.45}rem` } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function TreeView({
  ariaLabel = "Tree",
  className,
  defaultExpandedItemIds,
  defaultSelectedItemId = null,
  density = "comfortable",
  expandedItemIds,
  items,
  onExpandedItemIdsChange,
  onSelectedItemChange,
  readOnly = false,
  selectedItemId,
  showGuides = true,
  showIcons = true,
  ...props
}: TreeViewProps) {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const resolvedDefaultExpandedItemIds = useMemo(
    () => normalizeItemIds(defaultExpandedItemIds ?? collectDefaultExpandedItemIds(items)),
    [defaultExpandedItemIds, items],
  );
  const [currentExpandedItemIds, setCurrentExpandedItemIds] = useControllableState<string[]>({
    defaultValue: resolvedDefaultExpandedItemIds,
    onChange: onExpandedItemIdsChange,
    value: expandedItemIds,
  });
  const [currentSelectedItemId, setCurrentSelectedItemId] = useControllableState<string | null>({
    defaultValue: defaultSelectedItemId,
    onChange: (itemId) => {
      if (!itemId) {
        return;
      }

      const item = findItemById(items, itemId);

      if (item) {
        onSelectedItemChange?.(itemId, item);
      }
    },
    value: selectedItemId,
  });
  const expandedItemIdSet = useMemo(
    () => new Set(currentExpandedItemIds),
    [currentExpandedItemIds],
  );
  const flatItems = useMemo(
    () => flattenTreeViewItems(items, expandedItemIdSet),
    [expandedItemIdSet, items],
  );
  const visibleItemIds = useMemo(
    () => new Set(flatItems.map(({ item }) => item.id)),
    [flatItems],
  );
  const firstFocusableItemId = flatItems.find(({ item }) => isTreeItemFocusable(item, readOnly))?.item.id ?? null;
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const indentRem = density === "compact" ? 1.28 : 1.45;
  const activeFocusableItemId =
    focusedItemId && visibleItemIds.has(focusedItemId)
      ? focusedItemId
      : !readOnly && currentSelectedItemId && visibleItemIds.has(currentSelectedItemId)
        ? currentSelectedItemId
        : firstFocusableItemId;

  const focusItem = useCallback((itemId: string | null) => {
    if (!itemId) {
      return;
    }

    setFocusedItemId(itemId);
    itemRefs.current.get(itemId)?.focus();
  }, []);

  const setItemRef = useCallback((itemId: string, node: HTMLButtonElement | null) => {
    if (node) {
      itemRefs.current.set(itemId, node);
      return;
    }

    itemRefs.current.delete(itemId);
  }, []);

  const toggleExpandedItem = useCallback(
    (itemId: string, forceOpen?: boolean) => {
      setCurrentExpandedItemIds((previousItemIds) => {
        const normalizedItemIds = previousItemIds ?? [];
        const isExpanded = normalizedItemIds.includes(itemId);

        if (forceOpen === true && isExpanded) {
          return normalizedItemIds;
        }

        if (forceOpen === false && !isExpanded) {
          return normalizedItemIds;
        }

        if (forceOpen === true || !isExpanded) {
          return [...normalizedItemIds, itemId];
        }

        return normalizedItemIds.filter((expandedItemId) => expandedItemId !== itemId);
      });
    },
    [setCurrentExpandedItemIds],
  );

  const selectItem = useCallback(
    (item: TreeViewNode) => {
      if (!item.disabled) {
        setCurrentSelectedItemId(item.id);
      }
    },
    [setCurrentSelectedItemId],
  );

  const handleItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, flatItem: FlatTreeViewNode) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const { item } = flatItem;
      const branch = hasChildren(item);
      const isExpanded = expandedItemIdSet.has(item.id);

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusItem(findNextFocusableItemId(flatItems, item.id, "next", readOnly));
          break;
        case "ArrowUp":
          event.preventDefault();
          focusItem(findNextFocusableItemId(flatItems, item.id, "previous", readOnly));
          break;
        case "ArrowRight": {
          if (!branch) {
            return;
          }

          event.preventDefault();

          if (!isExpanded) {
            toggleExpandedItem(item.id, true);
            return;
          }

          const childItemId = flatItems.find((candidate) => candidate.parentId === item.id && isTreeItemFocusable(candidate.item, readOnly))?.item.id;
          focusItem(childItemId ?? null);
          break;
        }
        case "ArrowLeft":
          event.preventDefault();

          if (branch && isExpanded) {
            toggleExpandedItem(item.id, false);
            return;
          }

          focusItem(flatItem.parentId);
          break;
        case "Home":
          event.preventDefault();
          focusItem(firstFocusableItemId);
          break;
        case "End":
          event.preventDefault();
          focusItem([...flatItems].reverse().find(({ item: candidate }) => isTreeItemFocusable(candidate, readOnly))?.item.id ?? null);
          break;
        case "Enter":
        case " ":
          event.preventDefault();

          if (!readOnly) {
            selectItem(item);
          }

          if (branch) {
            toggleExpandedItem(item.id);
          }

          break;
      }
    },
    [
      expandedItemIdSet,
      firstFocusableItemId,
      flatItems,
      focusItem,
      readOnly,
      selectItem,
      toggleExpandedItem,
    ],
  );

  return (
    <div
      {...props}
      aria-label={ariaLabel}
      className={cx(
        "ui-tree-view",
        `ui-tree-view--${density}`,
        showGuides && "ui-tree-view--guides",
        readOnly && "ui-tree-view--read-only",
        className,
      )}
      role="tree"
    >
      {flatItems.map((flatItem) => {
        const { item, level, posInSet, setSize } = flatItem;
        const branch = hasChildren(item);
        const activatesOnClick = !readOnly || branch;
        const isExpanded = branch && expandedItemIdSet.has(item.id);
        const isSelected = !readOnly && currentSelectedItemId === item.id;
        const itemStyle: TreeViewItemStyle = {
          "--ui-tree-level": level - 1,
          "--ui-tree-offset": `${(level - 1) * indentRem}rem`,
        };
        const itemContent = (
          <>
            <span
              aria-hidden="true"
              className={cx(
                "ui-tree-view__toggle",
                branch && "ui-tree-view__toggle--branch",
                isExpanded && "ui-tree-view__toggle--expanded",
              )}
            >
              {branch ? <span className="ui-tree-view__toggle-mark" /> : null}
            </span>
            {showIcons ? (
              <span className="ui-tree-view__icon">
                {item.icon ?? (branch ? <FolderIcon /> : <DocumentListIcon />)}
              </span>
            ) : null}
            <span className="ui-tree-view__content">
              <span className="ui-tree-view__label">{item.label}</span>
              {item.secondaryLabel ? (
                <span className="ui-tree-view__secondary">{item.secondaryLabel}</span>
              ) : null}
            </span>
            {item.meta ? <span className="ui-tree-view__meta">{item.meta}</span> : null}
          </>
        );
        const treeItemProps = {
          "aria-disabled": item.disabled ? true : undefined,
          "aria-expanded": branch ? isExpanded : undefined,
          "aria-label": item.ariaLabel,
          "aria-level": level,
          "aria-posinset": posInSet,
          "aria-selected": readOnly ? undefined : isSelected,
          "aria-setsize": setSize,
          className: cx(
            "ui-tree-view__item",
            branch && "ui-tree-view__item--branch",
            isExpanded && "ui-tree-view__item--expanded",
            isSelected && "ui-tree-view__item--selected",
          ),
          role: "treeitem",
        } as const;

        return (
          <div
            className="ui-tree-view__item-shell"
            data-nested={level > 1 ? "" : undefined}
            key={item.id}
            role="none"
            style={itemStyle}
          >
            {showGuides ? <TreeViewGuides indentRem={indentRem} level={level} /> : null}
            {!activatesOnClick ? (
              <div {...treeItemProps}>{itemContent}</div>
            ) : (
              <button
                {...treeItemProps}
                disabled={item.disabled}
                onClick={() => {
                  if (!readOnly) {
                    selectItem(item);
                  }

                  if (branch) {
                    toggleExpandedItem(item.id);
                  }
                }}
                onFocus={() => setFocusedItemId(item.id)}
                onKeyDown={(event) => handleItemKeyDown(event, flatItem)}
                ref={(node) => setItemRef(item.id, node)}
                tabIndex={activeFocusableItemId === item.id ? 0 : -1}
                type="button"
              >
                {itemContent}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
