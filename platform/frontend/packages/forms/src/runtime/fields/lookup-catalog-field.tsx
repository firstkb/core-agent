import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@platform/ui-kit";

import type {
  RuntimeFormFieldOption,
  RuntimeFormLookupDefinition,
  RuntimeFormLookupOption,
  RuntimeFormResolvedLabels,
} from "../runtime-form-types";
import {
  getStringValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

const LOOKUP_CATALOG_DEBOUNCE_MS = 300;
const LOOKUP_CATALOG_PAGE_SIZE = 10;

type CatalogOptionView = {
  description?: string;
  group?: string;
  title: string;
};

function lookupOptionFromFieldOption(option: RuntimeFormFieldOption): RuntimeFormLookupOption {
  return {
    description: option.description ? String(option.description) : undefined,
    fields: option.fields,
    label: option.label,
    value: option.value,
  };
}

function mergeLookupOptions(
  currentOptions: ReadonlyArray<RuntimeFormLookupOption>,
  incomingOptions: ReadonlyArray<RuntimeFormLookupOption>,
) {
  const byValue = new Map(currentOptions.map((option) => [option.value, option]));
  incomingOptions.forEach((option) => {
    byValue.set(option.value, option);
  });
  return Array.from(byValue.values());
}

function fieldOptionLookupOptions(options: ReadonlyArray<RuntimeFormFieldOption> | undefined) {
  return (options ?? []).map(lookupOptionFromFieldOption);
}

function optionFieldValue(option: RuntimeFormLookupOption, fieldName: string | undefined) {
  if (!fieldName) {
    return "";
  }
  return option.fields?.[fieldName]?.trim() ?? "";
}

function catalogGroupField(lookup: RuntimeFormLookupDefinition) {
  const displayFields = lookup.displayFields ?? [];
  return displayFields.length > 1 ? displayFields[0] : undefined;
}

function optionDisplayValues(
  option: RuntimeFormLookupOption,
  lookup: RuntimeFormLookupDefinition,
  groupField: string | undefined,
) {
  const displayFields = (lookup.displayFields ?? []).filter((fieldName) => fieldName !== groupField);
  return displayFields
    .map((fieldName) => optionFieldValue(option, fieldName))
    .filter(Boolean);
}

function catalogOptionView(
  option: RuntimeFormLookupOption,
  lookup: RuntimeFormLookupDefinition,
  groupField: string | undefined,
): CatalogOptionView {
  const displayValues = optionDisplayValues(option, lookup, groupField);
  const title = displayValues[0] || option.label || option.value;
  const description = displayValues.length > 1
    ? displayValues.slice(1).join(" / ")
    : option.description;
  const group = optionFieldValue(option, groupField);

  return {
    description,
    group: group || undefined,
    title,
  };
}

function catalogGroups(
  options: ReadonlyArray<RuntimeFormLookupOption>,
  lookup: RuntimeFormLookupDefinition,
  labels: RuntimeFormResolvedLabels,
) {
  const groupField = catalogGroupField(lookup);
  const hasGroupData = Boolean(groupField && options.some((option) => optionFieldValue(option, groupField)));

  if (!hasGroupData) {
    return {
      groupField: undefined,
      groups: [],
    };
  }

  const groupMap = new Map<string, RuntimeFormLookupOption[]>();
  options.forEach((option) => {
    const group = optionFieldValue(option, groupField) || labels.catalogGroupOther;
    groupMap.set(group, [...(groupMap.get(group) ?? []), option]);
  });

  return {
    groupField,
    groups: Array.from(groupMap.entries()).map(([label, groupOptions]) => ({
      id: label,
      label,
      options: groupOptions,
    })),
  };
}

function selectedCatalogOption(
  selectedValue: string,
  options: ReadonlyArray<RuntimeFormLookupOption>,
  fieldOptions: ReadonlyArray<RuntimeFormFieldOption> | undefined,
) {
  if (!selectedValue) {
    return undefined;
  }

  return options.find((option) => option.value === selectedValue)
    ?? fieldOptionLookupOptions(fieldOptions).find((option) => option.value === selectedValue)
    ?? {
      label: selectedValue,
      value: selectedValue,
    };
}

export function LookupCatalogField({
  controlId,
  disabled,
  error,
  field,
  labels,
  loadLookupOptions,
  onFieldChange,
  required,
  value,
}: RuntimeFieldControlProps) {
  const lookup = field.lookup;
  const selectedValue = getStringValue(value);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RuntimeFormLookupOption[]>(() => fieldOptionLookupOptions(field.options));
  const [searchValue, setSearchValue] = useState("");
  const [requestSearchValue, setRequestSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [hasMoreOptions, setHasMoreOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const requestKeyRef = useRef(0);
  const [requestNonce, setRequestNonce] = useState(0);
  const hydratedValuesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setOptions(fieldOptionLookupOptions(field.options));
    setSearchValue("");
    setRequestSearchValue("");
    setPage(1);
    setHasMoreOptions(false);
    setLoadError(false);
    setOpenGroups({});
    setRequestNonce(0);
    hydratedValuesRef.current = new Set();
  }, [field.id, field.lookup, field.options]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = globalThis.setTimeout(() => {
      setRequestSearchValue(searchValue);
      setPage(1);
    }, LOOKUP_CATALOG_DEBOUNCE_MS);

    return () => globalThis.clearTimeout(timer);
  }, [open, searchValue]);

  useEffect(() => {
    if (!open || !lookup || !loadLookupOptions) {
      return;
    }

    let cancelled = false;
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    setLoadError(false);

    void loadLookupOptions({
      fieldId: field.id,
      lookup,
      page,
      pageSize: LOOKUP_CATALOG_PAGE_SIZE,
      search: requestSearchValue,
    })
      .then((response) => {
        if (cancelled || requestKeyRef.current !== requestKey) {
          return;
        }
        const baseOptions = requestSearchValue.trim()
          ? []
          : fieldOptionLookupOptions(field.options);
        setOptions((currentOptions) => page === 1
          ? mergeLookupOptions(baseOptions, response.options)
          : mergeLookupOptions(currentOptions, response.options));
        setHasMoreOptions(response.hasMore);
      })
      .catch(() => {
        if (!cancelled && requestKeyRef.current === requestKey) {
          setHasMoreOptions(false);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled && requestKeyRef.current === requestKey) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [field.id, field.options, loadLookupOptions, lookup, open, page, requestNonce, requestSearchValue]);

  useEffect(() => {
    if (!open || !lookup || !loadLookupOptions || !selectedValue || requestSearchValue.trim()) {
      return;
    }

    if (options.some((option) => option.value === selectedValue)) {
      return;
    }
    if (hydratedValuesRef.current.has(selectedValue)) {
      return;
    }

    let cancelled = false;
    hydratedValuesRef.current.add(selectedValue);
    void loadLookupOptions({
      fieldId: field.id,
      ids: [selectedValue],
      lookup,
      page: 1,
      pageSize: 1,
    })
      .then((response) => {
        if (!cancelled) {
          setOptions((currentOptions) => mergeLookupOptions(currentOptions, response.options));
        }
      })
      .catch(() => {
        hydratedValuesRef.current.delete(selectedValue);
      });

    return () => {
      cancelled = true;
    };
  }, [field.id, loadLookupOptions, lookup, open, options, requestSearchValue, selectedValue]);

  const selectedOption = selectedCatalogOption(selectedValue, options, field.options);
  const groupedCatalog = useMemo(
    () => lookup ? catalogGroups(options, lookup, labels) : { groupField: undefined, groups: [] },
    [labels, lookup, options],
  );
  const hasSearch = requestSearchValue.trim().length > 0;
  const flatOptions = groupedCatalog.groupField ? [] : options;
  const isDisabled = disabled || !loadLookupOptions;

  if (!lookup) {
    return null;
  }

  function handleSelect(option: RuntimeFormLookupOption) {
    onFieldChange(field.id, option.value, field, {
      lookupLabels: {
        [option.value]: option.label,
      },
    });
    setOpen(false);
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((currentGroups) => ({
      [groupId]: !currentGroups[groupId],
    }));
  }

  function resetCatalogRequestState() {
    setSearchValue("");
    setRequestSearchValue("");
    setPage(1);
    setLoadError(false);
    setOpenGroups({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      resetCatalogRequestState();
    }
    setOpen(nextOpen);
  }

  function loadNextPage() {
    if (!loading && !loadingMore && hasMoreOptions) {
      setPage((currentPage) => currentPage + 1);
    }
  }

  function retryLoad() {
    requestKeyRef.current += 1;
    setPage(1);
    setRequestSearchValue(searchValue);
    setLoadError(false);
    setRequestNonce((currentNonce) => currentNonce + 1);
  }

  const selectedView = selectedOption
    ? catalogOptionView(selectedOption, lookup, catalogGroupField(lookup))
    : undefined;

  return (
    <div className="platform-runtime-form__lookup-catalog">
      <Button
        aria-invalid={error ? "true" : undefined}
        aria-label={`${labels.catalogOpen} ${field.label}`}
        className="platform-runtime-form__lookup-catalog-trigger"
        disabled={isDisabled}
        id={controlId}
        onClick={() => handleOpenChange(true)}
        type="button"
        variant="primary"
      >
        {field.label}
        {required ? <span aria-hidden="true" className="platform-runtime-form__lookup-catalog-required">*</span> : null}
      </Button>
      <div className="platform-runtime-form__lookup-catalog-summary">
        {selectedView ? (
          <>
            {selectedView.group ? <span className="platform-runtime-form__lookup-catalog-summary-title">{selectedView.group}</span> : null}
            <span>{selectedView.title}</span>
            {selectedView.description ? <span className="platform-runtime-form__lookup-catalog-summary-description">{selectedView.description}</span> : null}
          </>
        ) : (
          <span className="platform-runtime-form__lookup-catalog-summary-empty">{labels.catalogNoSelection}</span>
        )}
      </div>

      <Dialog onOpenChange={handleOpenChange} open={open} surfaceClassName="platform-runtime-form__lookup-catalog-dialog">
        <DialogContent className="platform-runtime-form__lookup-catalog-dialog-content">
          <DialogHeader className="platform-runtime-form__lookup-catalog-dialog-header">
            <DialogTitle>{field.label}</DialogTitle>
          </DialogHeader>
          <DialogBody className="platform-runtime-form__lookup-catalog-dialog-body">
            <Input
              autoComplete="off"
              className="platform-runtime-form__lookup-catalog-search"
              onChange={(event) => setSearchValue(event.currentTarget.value)}
              placeholder={labels.catalogSearchPlaceholder}
              value={searchValue}
            />

            {loading && page === 1 ? (
              <div className="platform-runtime-form__lookup-catalog-state">{labels.catalogLoading}</div>
            ) : null}

            {loadError ? (
              <div className="platform-runtime-form__lookup-catalog-state platform-runtime-form__lookup-catalog-state--error">
                <span>{labels.catalogLoadError}</span>
                <Button onClick={retryLoad} size="sm" type="button" variant="secondary">{labels.catalogRetry}</Button>
              </div>
            ) : null}

            {!loading && !loadError && options.length === 0 ? (
              <div className="platform-runtime-form__lookup-catalog-state">{labels.catalogEmpty}</div>
            ) : null}

            {!loading && !loadError && groupedCatalog.groupField ? (
              <div className="platform-runtime-form__lookup-catalog-groups">
                {groupedCatalog.groups.map((group) => {
                  const groupOpen = hasSearch || Boolean(openGroups[group.id]);
                  return (
                    <div className="platform-runtime-form__lookup-catalog-group" key={group.id}>
                      <button
                        aria-expanded={groupOpen}
                        className="platform-runtime-form__lookup-catalog-group-trigger"
                        onClick={() => toggleGroup(group.id)}
                        type="button"
                      >
                        <span>{group.label}</span>
                      </button>
                      {groupOpen ? (
                        <div className="platform-runtime-form__lookup-catalog-options">
                          {group.options.map((option) => (
                            <CatalogOptionRow
                              groupField={groupedCatalog.groupField}
                              key={option.value}
                              lookup={lookup}
                              onSelect={handleSelect}
                              option={option}
                              selectLabel={labels.catalogSelect}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!loading && !loadError && flatOptions.length > 0 ? (
              <div className="platform-runtime-form__lookup-catalog-options">
                {flatOptions.map((option) => (
                  <CatalogOptionRow
                    key={option.value}
                    lookup={lookup}
                    onSelect={handleSelect}
                    option={option}
                    selectLabel={labels.catalogSelect}
                  />
                ))}
              </div>
            ) : null}

            {!loading && !loadError && hasMoreOptions ? (
              <Button
                className="platform-runtime-form__lookup-catalog-load-more"
                disabled={loadingMore}
                onClick={loadNextPage}
                pending={loadingMore}
                type="button"
                variant="secondary"
              >
                {labels.loadMore}
              </Button>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatalogOptionRow({
  groupField,
  lookup,
  onSelect,
  option,
  selectLabel,
}: {
  groupField?: string;
  lookup: RuntimeFormLookupDefinition;
  onSelect: (option: RuntimeFormLookupOption) => void;
  option: RuntimeFormLookupOption;
  selectLabel: RuntimeFormResolvedLabels["catalogSelect"];
}) {
  const view = catalogOptionView(option, lookup, groupField);

  return (
    <div className="platform-runtime-form__lookup-catalog-option">
      <Button
        className="platform-runtime-form__lookup-catalog-select"
        onClick={() => onSelect(option)}
        size="sm"
        type="button"
        variant="success"
      >
        {selectLabel}
      </Button>
      <div className="platform-runtime-form__lookup-catalog-option-text">
        <span className="platform-runtime-form__lookup-catalog-option-title">{view.title}</span>
        {view.description ? (
          <span className="platform-runtime-form__lookup-catalog-option-description">{view.description}</span>
        ) : null}
      </div>
    </div>
  );
}
