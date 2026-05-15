import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  Combobox,
  type ComboboxOption,
} from "@platform/ui-kit";

import {
  getArrayValue,
  getStringValue,
} from "../runtime-form-utils";
import type {
  RuntimeFormFieldOption,
  RuntimeFormLookupOption,
} from "../runtime-form-types";
import type { RuntimeFieldControlProps } from "./field-types";
import { LookupCatalogField } from "./lookup-catalog-field";

const LOOKUP_DEBOUNCE_MS = 300;
const LOOKUP_PAGE_SIZE = 10;

function runtimeOptionFromLookupOption(option: RuntimeFormLookupOption): RuntimeFormFieldOption {
  return {
    description: option.description,
    fields: option.fields,
    label: option.label,
    value: option.value,
  };
}

function mergeOptions(
  currentOptions: ReadonlyArray<RuntimeFormFieldOption>,
  incomingOptions: ReadonlyArray<RuntimeFormLookupOption>,
) {
  const byValue = new Map(currentOptions.map((option) => [option.value, option]));
  incomingOptions.forEach((option) => {
    byValue.set(option.value, runtimeOptionFromLookupOption(option));
  });
  return Array.from(byValue.values());
}

function comboboxOptionsFromRuntimeOptions(options: ReadonlyArray<RuntimeFormFieldOption>): ComboboxOption[] {
  return options.map((option) => ({
    description: option.description,
    label: option.label,
    searchText: `${option.label} ${option.description ?? ""} ${option.value}`,
    value: option.value,
  }));
}

function selectedValuesFromRuntimeValue(value: RuntimeFieldControlProps["value"], multiple: boolean) {
  if (multiple) {
    return getArrayValue(value);
  }
  const selectedValue = getStringValue(value);
  return selectedValue ? [selectedValue] : [];
}

function lookupLabelMap(
  selectedValues: ReadonlyArray<string>,
  options: ReadonlyArray<RuntimeFormFieldOption>,
) {
  const optionByValue = new Map(options.map((option) => [option.value, option.label]));
  return Object.fromEntries(
    selectedValues.flatMap((selectedValue) => {
      const label = optionByValue.get(selectedValue);
      return label ? [[selectedValue, label]] : [];
    }),
  );
}

function lookupOptionFieldsMap(
  selectedValues: ReadonlyArray<string>,
  options: ReadonlyArray<RuntimeFormFieldOption>,
) {
  const fieldsByValue = new Map(options.map((option) => [option.value, option.fields]));
  return Object.fromEntries(
    selectedValues.flatMap((selectedValue) => {
      const fields = fieldsByValue.get(selectedValue);
      return fields && Object.keys(fields).length > 0 ? [[selectedValue, fields]] : [];
    }),
  );
}

export function LookupField({
  controlId,
  disabled,
  error,
  field,
  groupName,
  labels,
  loadLookupOptions,
  onFieldChange,
  required,
  value,
}: RuntimeFieldControlProps) {
  const lookup = field.lookup;
  const multiple = lookup?.selectionMode === "multiple";
  const selectedValues = selectedValuesFromRuntimeValue(value, multiple);
  const [options, setOptions] = useState<RuntimeFormFieldOption[]>(() => [...(field.options ?? [])]);
  const [searchValue, setSearchValue] = useState("");
  const [requestSearchValue, setRequestSearchValue] = useState("");
  const [activated, setActivated] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreOptions, setHasMoreOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestKeyRef = useRef(0);

  useEffect(() => {
    setOptions([...(field.options ?? [])]);
    setSearchValue("");
    setRequestSearchValue("");
    setActivated(false);
    setPage(1);
    setHasMoreOptions(false);
  }, [field.id, field.lookup, field.options]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setRequestSearchValue(searchValue);
      setPage(1);
    }, LOOKUP_DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if (!activated || !lookup || lookup.displayMode !== "search_select" || !loadLookupOptions) {
      return;
    }

    let cancelled = false;
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;
    setLoading(page === 1);
    setLoadingMore(page > 1);

    void loadLookupOptions({
      fieldId: field.id,
      lookup,
      page,
      pageSize: LOOKUP_PAGE_SIZE,
      search: requestSearchValue,
    })
      .then((response) => {
        if (cancelled || requestKeyRef.current !== requestKey) {
          return;
        }
        setOptions((currentOptions) => page === 1
          ? mergeOptions(field.options ?? [], response.options)
          : mergeOptions(currentOptions, response.options));
        setHasMoreOptions(response.hasMore);
      })
      .catch(() => {
        if (!cancelled && requestKeyRef.current === requestKey) {
          setHasMoreOptions(false);
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
  }, [activated, field.id, field.options, loadLookupOptions, lookup, page, requestSearchValue]);

  useEffect(() => {
    if (!activated || !lookup || !loadLookupOptions || selectedValues.length === 0) {
      return;
    }

    const missingValues = selectedValues.filter((selectedValue) =>
      !options.some((option) => option.value === selectedValue),
    );
    if (missingValues.length === 0) {
      return;
    }

    let cancelled = false;
    void loadLookupOptions({
      fieldId: field.id,
      ids: missingValues,
      lookup,
      page: 1,
      pageSize: Math.max(missingValues.length, 1),
    })
      .then((response) => {
        if (!cancelled) {
          setOptions((currentOptions) => mergeOptions(currentOptions, response.options));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activated, field.id, loadLookupOptions, lookup, options, selectedValues]);

  const comboboxOptions = useMemo(() => comboboxOptionsFromRuntimeOptions(options), [options]);
  const activateLookup = () => setActivated(true);
  const handleLookupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      activateLookup();
    }
  };

  if (!lookup) {
    return null;
  }

  if (lookup.displayMode === "catalog_modal") {
    return (
      <LookupCatalogField
        controlId={controlId}
        disabled={disabled}
        error={error}
        field={field}
        groupName={groupName}
        labels={labels}
        loadLookupOptions={loadLookupOptions}
        onFieldChange={onFieldChange}
        required={required}
        value={value}
      />
    );
  }

  if (multiple) {
    return (
      <Combobox
        aria-invalid={error ? "true" : undefined}
        disabled={disabled || !loadLookupOptions}
        emptyLabel={labels.noOptions}
        filterMode="none"
        hasMoreOptions={hasMoreOptions}
        id={controlId}
        invalid={Boolean(error)}
        label={field.label}
        loading={loading}
        loadingMore={loadingMore}
        onLoadMore={() => {
          if (!loading && !loadingMore && hasMoreOptions) {
            setPage((currentPage) => currentPage + 1);
          }
        }}
        onClick={activateLookup}
        onKeyDown={handleLookupKeyDown}
        onSearchValueChange={setSearchValue}
        onValueChange={(nextValues) => {
          onFieldChange(field.id, nextValues, field, {
            lookupLabels: lookupLabelMap(nextValues, options),
            lookupOptionFields: lookupOptionFieldsMap(nextValues, options),
          });
        }}
        options={comboboxOptions}
        placeholder={field.placeholder ?? labels.selectValuesPlaceholder}
        searchInputAriaLabel={`${labels.search} ${field.label}`}
        searchPlaceholder={`${labels.search} ${field.label}`}
        searchValue={searchValue}
        selectionMode="multiple"
        triggerAriaLabel={field.label}
        value={selectedValues}
      />
    );
  }

  const selectedValue = selectedValues[0] ?? "";
  return (
    <Combobox
      aria-invalid={error ? "true" : undefined}
      disabled={disabled || !loadLookupOptions}
      emptyLabel={labels.noOptions}
      filterMode="none"
      hasMoreOptions={hasMoreOptions}
      id={controlId}
      invalid={Boolean(error)}
      label={field.label}
      loading={loading}
      loadingMore={loadingMore}
      clearable
      clearSelectionLabel={labels.clearSelection}
      onLoadMore={() => {
        if (!loading && !loadingMore && hasMoreOptions) {
          setPage((currentPage) => currentPage + 1);
        }
      }}
      onClick={activateLookup}
      onKeyDown={handleLookupKeyDown}
      onSearchValueChange={setSearchValue}
      onValueChange={(nextValue) => {
        const nextSelectedValues = nextValue ? [nextValue] : [];
        onFieldChange(field.id, nextValue ?? "", field, {
          lookupLabels: lookupLabelMap(nextSelectedValues, options),
          lookupOptionFields: lookupOptionFieldsMap(nextSelectedValues, options),
        });
      }}
      options={comboboxOptions}
      placeholder={field.placeholder ?? labels.selectPlaceholder}
      searchInputAriaLabel={`${labels.search} ${field.label}`}
      searchPlaceholder={`${labels.search} ${field.label}`}
      searchValue={searchValue}
      selectionMode="single"
      triggerAriaLabel={field.label}
      value={selectedValue || null}
    />
  );
}
