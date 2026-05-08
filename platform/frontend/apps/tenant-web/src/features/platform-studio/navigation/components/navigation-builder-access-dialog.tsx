import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  TenantNavigationAccessOption,
  TenantNavigationAccessOptionPageRequest,
  TenantNavigationAccessOptionPageResponse,
  TenantNavigationAccessOptionsResponse,
} from "@platform/api-client";
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePaginationBar,
  TableRow,
  WarningTriangleIcon,
} from "@platform/ui-kit";

import {
  type NavigationBuilderAccessPolicy,
  type NavigationBuilderAccessRecipientKind,
  type NavigationBuilderNode,
  type NavigationBuilderRailItem,
} from "../navigation-builder-state";

type NavigationBuilderAccessSubject =
  | NavigationBuilderNode
  | NavigationBuilderRailItem
  | null;

type NavigationBuilderAccessDialogProps = {
  category: NavigationBuilderAccessRecipientKind | null;
  loadOptions: (request: TenantNavigationAccessOptionPageRequest) => Promise<TenantNavigationAccessOptionPageResponse>;
  node: NavigationBuilderAccessSubject;
  onApply: (category: NavigationBuilderAccessRecipientKind, ids: string[]) => void;
  onOpenChange: (open: boolean) => void;
  onOptionsLoaded: (
    category: NavigationBuilderAccessRecipientKind,
    items: ReadonlyArray<TenantNavigationAccessOption>,
  ) => void;
  open: boolean;
  options: TenantNavigationAccessOptionsResponse;
};

type CategoryConfig = {
  emptyCopy: string;
  entryLabelSingular: string;
  label: string;
  searchPlaceholder: string;
  title: string;
};

type AccessOptionColumn = {
  key: string;
  label: string;
  render: (option: TenantNavigationAccessOption) => ReactNode;
};

const defaultPageSize = 25;
const pageSizeOptions = [25, 50, 100] as const;

function getSelectedIds(
  access: NavigationBuilderAccessPolicy | undefined,
  category: NavigationBuilderAccessRecipientKind | null,
) {
  if (!access || !category) {
    return [];
  }

  return access[category];
}

function toggleAccessId(ids: ReadonlyArray<string>, id: string, checked: boolean) {
  const current = new Set(ids);
  if (checked) {
    current.add(id);
  } else {
    current.delete(id);
  }
  return [...current].sort();
}

function getCategoryConfig(category: NavigationBuilderAccessRecipientKind | null): CategoryConfig {
  switch (category) {
    case "companies":
      return {
        emptyCopy: "No companies found.",
        entryLabelSingular: "company",
        label: "Companies",
        searchPlaceholder: "Search by company, type, email, phone, or contact",
        title: "Choose companies",
      };
    case "companyTypes":
      return {
        emptyCopy: "No company types found.",
        entryLabelSingular: "company type",
        label: "Company types",
        searchPlaceholder: "Search by company type",
        title: "Choose company types",
      };
    case "jobtypes":
      return {
        emptyCopy: "No job types found.",
        entryLabelSingular: "job type",
        label: "Job types",
        searchPlaceholder: "Search by job type",
        title: "Choose job types",
      };
    case "users":
    default:
      return {
        emptyCopy: "No users found.",
        entryLabelSingular: "user",
        label: "Users",
        searchPlaceholder: "Search by name, email, company, or job type",
        title: "Choose users",
      };
  }
}

function getField(option: TenantNavigationAccessOption, key: string) {
  return option.fields?.[key] ?? "";
}

function renderMutedValue(value: string) {
  return value ? value : <span className="tenant-web__navigation-builder-access-table-empty">-</span>;
}

function getCategoryColumns(category: NavigationBuilderAccessRecipientKind | null): AccessOptionColumn[] {
  switch (category) {
    case "companies":
      return [
        { key: "company", label: "Company", render: (option) => option.label },
        { key: "type", label: "Type", render: (option) => renderMutedValue(getField(option, "type") || option.subtitle || "") },
        { key: "email", label: "Email", render: (option) => renderMutedValue(getField(option, "email")) },
        { key: "phone", label: "Phone", render: (option) => renderMutedValue(getField(option, "phone")) },
      ];
    case "companyTypes":
      return [
        { key: "type", label: "Company type", render: (option) => option.label },
        { key: "risk", label: "Risk", render: (option) => renderMutedValue(getField(option, "risk") || option.subtitle || "") },
      ];
    case "jobtypes":
      return [
        { key: "jobType", label: "Job type", render: (option) => option.label },
      ];
    case "users":
    default:
      return [
        { key: "user", label: "Name", render: (option) => option.label },
        { key: "email", label: "Email", render: (option) => renderMutedValue(getField(option, "email")) },
        { key: "company", label: "Company", render: (option) => renderMutedValue(getField(option, "company")) },
        { key: "jobType", label: "Job type", render: (option) => renderMutedValue(getField(option, "jobType")) },
      ];
  }
}

function getCachedSelectedOptions(
  ids: ReadonlyArray<string>,
  category: NavigationBuilderAccessRecipientKind | null,
  options: TenantNavigationAccessOptionsResponse,
) {
  if (!category) {
    return [];
  }
  const cache = new Map(options[category].map((option) => [option.id, option]));
  return ids.map((id) => cache.get(id)).filter((option): option is TenantNavigationAccessOption => Boolean(option));
}

export function NavigationBuilderAccessDialog({
  category,
  loadOptions,
  node,
  onApply,
  onOpenChange,
  onOptionsLoaded,
  open,
  options,
}: NavigationBuilderAccessDialogProps) {
  const [draftIds, setDraftIds] = useState<string[]>(() => getSelectedIds(node?.access, category));
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [result, setResult] = useState<TenantNavigationAccessOptionPageResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const config = getCategoryConfig(category);
  const columns = useMemo(() => getCategoryColumns(category), [category]);
  const selectedIdSet = useMemo(() => new Set(draftIds), [draftIds]);
  const selectedOptions = useMemo(
    () => getCachedSelectedOptions(draftIds, category, options),
    [category, draftIds, options],
  );
  const totalItems = result?.total ?? 0;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;

  useEffect(() => {
    if (open) {
      setDraftIds(getSelectedIds(node?.access, category));
      setQuery("");
      setDebouncedQuery("");
      setPage(1);
      setPageSize(defaultPageSize);
      setResult(null);
      setLoadError(null);
      setReloadKey(0);
    }
  }, [category, node, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  useEffect(() => {
    if (!open || !category) {
      return undefined;
    }

    let cancelled = false;
    setIsLoadingPage(true);
    setLoadError(null);

    void loadOptions({
      category,
      page,
      pageSize,
      search: debouncedQuery,
    }).then((response) => {
      if (cancelled) {
        return;
      }
      setResult(response);
      onOptionsLoaded(category, response.items);
    }).catch((error) => {
      if (cancelled) {
        return;
      }
      setResult(null);
      setLoadError(error instanceof Error ? error.message : "Unable to load recipients.");
    }).finally(() => {
      if (!cancelled) {
        setIsLoadingPage(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category, debouncedQuery, loadOptions, onOptionsLoaded, open, page, pageSize, reloadKey]);

  useEffect(() => {
    if (!open || !category || draftIds.length === 0) {
      return undefined;
    }

    let cancelled = false;

    void loadOptions({
      category,
      ids: draftIds,
      page: 1,
      pageSize: 100,
    }).then((response) => {
      if (!cancelled) {
        onOptionsLoaded(category, response.items);
      }
    }).catch(() => {
      // The paged table still owns visible load errors; selected-id hydration is best-effort.
    });

    return () => {
      cancelled = true;
    };
  }, [category, draftIds, loadOptions, onOptionsLoaded, open]);

  const visibleOptions = result?.items ?? [];
  const emptyCopy = debouncedQuery
    ? `No ${config.label.toLowerCase()} match this search.`
    : config.emptyCopy;

  return (
    <Dialog
      onOpenChange={onOpenChange}
      open={open}
      surfaceClassName="tenant-web__navigation-builder-access-dialog-surface"
    >
      <DialogContent className="tenant-web__navigation-builder-access-dialog">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="tenant-web__navigation-builder-access-dialog-stack">
            {loadError ? (
              <div className="tenant-web__navigation-builder-access-state-banner tenant-web__navigation-builder-access-state-banner--error">
                <span>
                  <WarningTriangleIcon />
                  <span>{loadError}</span>
                </span>
                <Button
                  onClick={() => setReloadKey((current) => current + 1)}
                  size="sm"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : null}

            <div className="tenant-web__navigation-builder-access-picker-header">
              <label className="tenant-web__navigation-builder-field">
                <span>Search {config.label.toLowerCase()}</span>
                <Input
                  aria-label={`Search ${config.label}`}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={config.searchPlaceholder}
                  value={query}
                />
              </label>
              <div className="tenant-web__navigation-builder-access-picker-count">
                <strong>{draftIds.length}</strong>
                <span>selected</span>
              </div>
            </div>

            <div aria-live="polite" className="tenant-web__navigation-builder-access-selected-summary">
              {selectedOptions.length === 0 ? (
                <span>No selected {config.label.toLowerCase()}.</span>
              ) : selectedOptions.slice(0, 5).map((option) => (
                <span key={option.id}>{option.label}</span>
              ))}
              {draftIds.length > selectedOptions.length ? (
                <span>{draftIds.length - selectedOptions.length} selected by id</span>
              ) : null}
            </div>

            <div aria-busy={isLoadingPage} className="tenant-web__navigation-builder-access-table-wrap">
              <Table density="compact">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="tenant-web__navigation-builder-access-table-check">
                      Select
                    </TableHeaderCell>
                    {columns.map((column) => (
                      <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingPage ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1}>
                        <p className="tenant-web__navigation-builder-access-empty">Loading recipients...</p>
                      </TableCell>
                    </TableRow>
                  ) : loadError ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1}>
                        <p className="tenant-web__navigation-builder-access-empty">Unable to load {config.label.toLowerCase()}. Use Retry above.</p>
                      </TableCell>
                    </TableRow>
                  ) : visibleOptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1}>
                        <p className="tenant-web__navigation-builder-access-empty">{emptyCopy}</p>
                      </TableCell>
                    </TableRow>
                  ) : visibleOptions.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell className="tenant-web__navigation-builder-access-table-check">
                        <Checkbox
                          aria-label={`Select ${option.label}`}
                          checked={selectedIdSet.has(option.id)}
                          onChange={(event) => {
                            const checked = event.currentTarget.checked;
                            setDraftIds((currentIds) =>
                              toggleAccessId(currentIds, option.id, checked));
                          }}
                        />
                      </TableCell>
                      {columns.map((column, index) => (
                        <TableCell
                          className={index === 0 ? "tenant-web__navigation-builder-access-table-primary" : undefined}
                          key={column.key}
                        >
                          {column.render(option)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePaginationBar
              currentPage={page}
              entryLabelPlural={config.label.toLowerCase()}
              entryLabelSingular={config.entryLabelSingular}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              totalItems={totalItems}
              totalPages={totalPages}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={!category}
            onClick={() => {
              if (!category) {
                return;
              }
              onApply(category, draftIds);
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
