import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type UIEvent as ReactUiEvent,
} from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";
import type { InputSize } from "../input";
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

function ComboboxChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ui-combobox__trigger-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4 6.5 8 10l4-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ComboboxCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ui-combobox__option-check"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="m3.5 8.25 2.5 2.5 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export type ComboboxOption = {
  description?: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  meta?: ReactNode;
  searchText?: string;
  value: string;
};

export type ComboboxFilterMode = "local" | "none";

export type ComboboxProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> & {
  defaultSearchValue?: string;
  defaultValue?: string | null;
  disabled?: boolean;
  emptyLabel?: ReactNode;
  filterMode?: ComboboxFilterMode;
  id?: string;
  initialVisibleCount?: number;
  invalid?: boolean;
  label?: ReactNode;
  loading?: boolean;
  loadingLabel?: ReactNode;
  loadMoreStep?: number;
  name?: string;
  onSearchValueChange?: (value: string) => void;
  onValueChange?: (value: string | null) => void;
  options: readonly ComboboxOption[];
  placeholder?: ReactNode;
  searchInputAriaLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  size?: InputSize;
  triggerAriaLabel?: string;
  value?: string | null;
};

function getOptionSearchText(option: ComboboxOption) {
  const labelText = typeof option.label === "string" ? option.label : "";
  const descriptionText = typeof option.description === "string" ? option.description : "";
  const metaText = typeof option.meta === "string" ? option.meta : "";

  return [option.searchText, labelText, descriptionText, metaText, option.value]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function Combobox({
  className,
  defaultSearchValue = "",
  defaultValue = null,
  disabled = false,
  emptyLabel = "No matching options",
  filterMode = "local",
  id,
  initialVisibleCount,
  invalid = false,
  label = "Select an option",
  loading = false,
  loadingLabel = "Searching…",
  loadMoreStep,
  name,
  onSearchValueChange,
  onValueChange,
  options,
  placeholder = "Select an option",
  searchInputAriaLabel = "Search options",
  searchPlaceholder = "Search options…",
  searchValue,
  size = "md",
  triggerAriaLabel,
  value,
  ...props
}: ComboboxProps) {
  const generatedId = useId().replace(/:/g, "");
  const baseId = id ?? `ui-combobox-${generatedId}`;
  const titleId = `${baseId}-title`;
  const listId = `${baseId}-listbox`;
  const triggerId = baseId;
  const searchInputId = `${baseId}-search`;
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useControllableState<string | null>({
    defaultValue,
    onChange: onValueChange,
    value: value === undefined ? undefined : value,
  });
  const [query, setQuery] = useControllableState<string>({
    defaultValue: defaultSearchValue,
    onChange: onSearchValueChange,
    value: searchValue,
  });
  const progressiveLoadEnabled = typeof initialVisibleCount === "number" && initialVisibleCount > 0;
  const safeInitialVisibleCount = progressiveLoadEnabled ? Math.max(1, initialVisibleCount) : Number.POSITIVE_INFINITY;
  const safeLoadMoreStep = Math.max(loadMoreStep ?? safeInitialVisibleCount, 1);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(safeInitialVisibleCount);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isSearchControlled = searchValue !== undefined;

  const filteredOptions = useMemo(() => {
    if (filterMode === "none") {
      return [...options];
    }

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [...options];
    }

    return options.filter((option) => getOptionSearchText(option).includes(normalizedQuery));
  }, [filterMode, options, query]);

  const enabledOptions = useMemo(
    () => filteredOptions.filter((option) => !option.disabled),
    [filteredOptions],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [options, selectedValue],
  );
  const renderedOptions = useMemo(
    () => (progressiveLoadEnabled ? filteredOptions.slice(0, visibleCount) : filteredOptions),
    [filteredOptions, progressiveLoadEnabled, visibleCount],
  );
  const hasMoreVisibleOptions = progressiveLoadEnabled && renderedOptions.length < filteredOptions.length;

  useEffect(() => {
    if (!open) {
      return;
    }

    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (enabledOptions.length === 0) {
      setActiveValue(null);
      return;
    }

    if (activeValue && enabledOptions.some((option) => option.value === activeValue)) {
      return;
    }

    const preferredOption =
      enabledOptions.find((option) => option.value === selectedValue) ?? enabledOptions[0];

    setActiveValue(preferredOption?.value ?? null);
  }, [activeValue, enabledOptions, open, selectedValue]);

  useEffect(() => {
    if (!progressiveLoadEnabled) {
      return;
    }

    setVisibleCount(safeInitialVisibleCount);
  }, [open, options, progressiveLoadEnabled, query, safeInitialVisibleCount]);

  function resetSearchIfNeeded() {
    if (!isSearchControlled) {
      setQuery("");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetSearchIfNeeded();
    }
  }

  function focusOption(nextIndex: number) {
    const nextOption = enabledOptions[nextIndex];

    if (!nextOption) {
      return;
    }

    setActiveValue(nextOption.value);
    optionRefs.current[nextOption.value]?.focus();
  }

  function moveActiveOption(step: -1 | 1) {
    if (enabledOptions.length === 0) {
      return;
    }

    const currentIndex = activeValue
      ? enabledOptions.findIndex((option) => option.value === activeValue)
      : -1;

    const nextIndex =
      currentIndex === -1
        ? step > 0
          ? 0
          : enabledOptions.length - 1
        : (currentIndex + step + enabledOptions.length) % enabledOptions.length;

    focusOption(nextIndex);
  }

  function selectValue(nextValue: string) {
    setSelectedValue(nextValue);
    handleOpenChange(false);
  }

  function handleListScroll(event: ReactUiEvent<HTMLDivElement>) {
    if (!hasMoreVisibleOptions || loading) {
      return;
    }

    const target = event.currentTarget;

    if (target.scrollTop + target.clientHeight < target.scrollHeight - 24) {
      return;
    }

    setVisibleCount((currentVisibleCount) =>
      Math.min(currentVisibleCount + safeLoadMoreStep, filteredOptions.length),
    );
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveOption(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveOption(-1);
      return;
    }

    if (event.key === "Enter" && activeValue) {
      event.preventDefault();
      selectValue(activeValue);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleOpenChange(false);
    }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveOption(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveOption(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(enabledOptions.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      searchInputRef.current?.focus();
    }
  }

  return (
    <div
      {...props}
      className={cx(
        "ui-combobox",
        `ui-combobox--${size}`,
        invalid && "ui-combobox--invalid",
        disabled && "ui-combobox--disabled",
        className,
      )}
    >
      {name ? <input name={name} type="hidden" value={selectedValue ?? ""} /> : null}
      <Popover align="start" onOpenChange={handleOpenChange} open={open}>
        <PopoverTrigger>
          <button
            aria-label={triggerAriaLabel}
            className="ui-combobox__trigger"
            disabled={disabled}
            id={triggerId}
            role="combobox"
            type="button"
          >
            <span
              className={cx(
                "ui-combobox__trigger-value",
                !selectedOption && "ui-combobox__trigger-value--placeholder",
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ComboboxChevronIcon />
          </button>
        </PopoverTrigger>
        <PopoverContent
          aria-labelledby={titleId}
          className="ui-combobox__content"
        >
          <div className="ui-combobox__header">
            <span className="ui-combobox__title" id={titleId}>
              {label}
            </span>
          </div>
          <div className="ui-combobox__search">
            <Input
              aria-controls={listId}
              aria-label={searchInputAriaLabel}
              className="ui-combobox__search-input"
              id={searchInputId}
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              ref={searchInputRef}
              size="sm"
              value={query}
            />
          </div>
          <div
            aria-labelledby={titleId}
            className="ui-combobox__list"
            id={listId}
            onScroll={handleListScroll}
            role="listbox"
          >
            {loading ? (
              <div className="ui-combobox__empty">{loadingLabel}</div>
            ) : renderedOptions.length > 0 ? (
              renderedOptions.map((option) => {
                const selected = option.value === selectedValue;

                return (
                  <button
                    aria-selected={selected}
                    className={cx(
                      "ui-combobox__option",
                      selected && "ui-combobox__option--selected",
                      option.value === activeValue && "ui-combobox__option--active",
                    )}
                    disabled={option.disabled}
                    key={option.value}
                    onClick={() => selectValue(option.value)}
                    onFocus={() => setActiveValue(option.value)}
                    onKeyDown={handleOptionKeyDown}
                    ref={(node) => {
                      optionRefs.current[option.value] = node;
                    }}
                    role="option"
                    type="button"
                  >
                    <span className="ui-combobox__option-copy">
                      <span className="ui-combobox__option-label">{option.label}</span>
                      {option.description ? (
                        <span className="ui-combobox__option-description">{option.description}</span>
                      ) : null}
                    </span>
                    <span className="ui-combobox__option-trailing">
                      {option.meta ? <span className="ui-combobox__option-meta">{option.meta}</span> : null}
                      {selected ? <ComboboxCheckIcon /> : null}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="ui-combobox__empty">{emptyLabel}</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
