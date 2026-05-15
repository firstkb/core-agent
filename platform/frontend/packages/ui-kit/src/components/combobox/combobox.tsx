import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type CSSProperties,
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

function ComboboxTagRemoveIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ui-combobox__trigger-tag-remove-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="m5 5 6 6M11 5l-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ComboboxClearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ui-combobox__trigger-clear-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="m5 5 6 6M11 5l-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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
export type ComboboxSelectionMode = "multiple" | "single";

type ComboboxBaseProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> & {
  clearSelectionLabel?: string;
  clearable?: boolean;
  defaultSearchValue?: string;
  disabled?: boolean;
  emptyLabel?: ReactNode;
  filterMode?: ComboboxFilterMode;
  id?: string;
  initialVisibleCount?: number;
  invalid?: boolean;
  label?: ReactNode;
  hasMoreOptions?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
  loadingMore?: boolean;
  loadMoreLabel?: ReactNode;
  loadMoreStep?: number;
  name?: string;
  onLoadMore?: () => void;
  options: readonly ComboboxOption[];
  placeholder?: ReactNode;
  searchInputAriaLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  selectionMode?: ComboboxSelectionMode;
  size?: InputSize;
  triggerAriaLabel?: string;
};

type ComboboxSingleProps = ComboboxBaseProps & {
  defaultValue?: string | null;
  onSearchValueChange?: (value: string) => void;
  onValueChange?: (value: string | null) => void;
  selectionMode?: "single";
  value?: string | null;
};

type ComboboxMultipleProps = ComboboxBaseProps & {
  defaultValue?: readonly string[];
  onSearchValueChange?: (value: string) => void;
  onValueChange?: (value: string[]) => void;
  selectionMode: "multiple";
  value?: readonly string[];
};

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;
type ComboboxStateValue = readonly string[] | string | null;

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
  ...props
}: ComboboxProps) {
  const {
    className,
    clearSelectionLabel = "Clear selection",
    clearable = false,
    defaultSearchValue = "",
    defaultValue: _defaultValue,
    disabled = false,
    emptyLabel = "No matching options",
    filterMode = "local",
    hasMoreOptions = false,
    id,
    initialVisibleCount,
    invalid = false,
    label = "Select an option",
    loading = false,
    loadingLabel = "Searching…",
    loadingMore = false,
    loadMoreLabel = loadingLabel,
    loadMoreStep,
    name,
    onLoadMore,
    onSearchValueChange: _onSearchValueChange,
    onValueChange: _onValueChange,
    options,
    placeholder = "Select an option",
    searchInputAriaLabel = "Search options",
    searchPlaceholder = "Search options…",
    searchValue,
    selectionMode: _selectionMode,
    size = "md",
    triggerAriaLabel,
    value: _value,
    ...domProps
  } = props;
  void _defaultValue;
  void _onSearchValueChange;
  void _onValueChange;
  void _selectionMode;
  void _value;

  const generatedId = useId().replace(/:/g, "");
  const baseId = id ?? `ui-combobox-${generatedId}`;
  const listId = `${baseId}-listbox`;
  const triggerId = baseId;
  const searchInputId = `${baseId}-search`;
  const selectionMode = props.selectionMode ?? "single";
  const multiple = selectionMode === "multiple";
  const [open, setOpen] = useState(false);
  const [selectedState, setSelectedState] = useControllableState<ComboboxStateValue>({
    defaultValue: multiple ? (props.defaultValue ?? []) : (props.defaultValue ?? null),
    onChange: props.onValueChange as ((value: ComboboxStateValue) => void) | undefined,
    value: props.value === undefined ? undefined : props.value,
  });
  const [query, setQuery] = useControllableState<string>({
    defaultValue: defaultSearchValue,
    onChange: props.onSearchValueChange,
    value: searchValue,
  });
  const progressiveLoadEnabled = typeof initialVisibleCount === "number" && initialVisibleCount > 0;
  const safeInitialVisibleCount = progressiveLoadEnabled ? Math.max(1, initialVisibleCount) : Number.POSITIVE_INFINITY;
  const safeLoadMoreStep = Math.max(loadMoreStep ?? safeInitialVisibleCount, 1);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(safeInitialVisibleCount);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [contentWidth, setContentWidth] = useState<number | null>(null);
  const isSearchControlled = searchValue !== undefined;

  const focusSearchInput = useCallback(() => {
    const node = searchInputRef.current;

    if (!node || disabled) {
      return;
    }

    node.focus();
    node.select();
  }, [disabled]);

  const handleSearchInputRef = useCallback((node: HTMLInputElement | null) => {
    searchInputRef.current = node;

    if (!node || !open || disabled) {
      return;
    }

    if (typeof window === "undefined") {
      node.focus();
      node.select();
      return;
    }

    window.requestAnimationFrame(() => {
      if (searchInputRef.current !== node) {
        return;
      }

      node.focus();
      node.select();
    });
  }, [disabled, open]);

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
  const selectedValues = useMemo(
    () => multiple && Array.isArray(selectedState) ? selectedState : [],
    [multiple, selectedState],
  );
  const selectedValue = multiple
    ? null
    : typeof selectedState === "string"
      ? selectedState
      : null;
  const selectedValueSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [options, selectedValue],
  );
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValueSet.has(option.value)),
    [options, selectedValueSet],
  );
  const renderedOptions = useMemo(
    () => (progressiveLoadEnabled ? filteredOptions.slice(0, visibleCount) : filteredOptions),
    [filteredOptions, progressiveLoadEnabled, visibleCount],
  );
  const hasMoreVisibleOptions = progressiveLoadEnabled && renderedOptions.length < filteredOptions.length;
  const hasRemoteMoreOptions = Boolean(onLoadMore && hasMoreOptions);
  const canClearSingleValue = !multiple && clearable && !disabled && Boolean(selectedValue);
  const triggerValue = useMemo<ReactNode>(() => {
    if (!multiple) {
      return selectedOption ? selectedOption.label : placeholder;
    }

    if (selectedOptions.length === 0) {
      return placeholder;
    }

    return (
      <span className="ui-combobox__trigger-tag-list">
        {selectedOptions.map((option) => (
          <span className="ui-combobox__trigger-tag" key={option.value}>
            <span className="ui-combobox__trigger-tag-label">{option.label}</span>
            {!disabled ? (
              <span
                aria-hidden="true"
                className="ui-combobox__trigger-tag-remove"
                onClick={(event) => handleTagRemoveClick(event, option.value)}
                onMouseDown={(event) => handleTagRemoveClick(event, option.value)}
              >
                <ComboboxTagRemoveIcon />
              </span>
            ) : null}
          </span>
        ))}
      </span>
    );
  }, [disabled, multiple, placeholder, selectedOption, selectedOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (typeof window === "undefined") {
      focusSearchInput();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      focusSearchInput();
    }, 0);
    const frameId = window.requestAnimationFrame(() => {
      focusSearchInput();
    });

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [focusSearchInput, open]);

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
      enabledOptions.find((option) => (multiple ? selectedValueSet.has(option.value) : option.value === selectedValue)) ?? enabledOptions[0];

    setActiveValue(preferredOption?.value ?? null);
  }, [activeValue, enabledOptions, multiple, open, selectedValue, selectedValueSet]);

  useEffect(() => {
    if (!progressiveLoadEnabled) {
      return;
    }

    setVisibleCount(safeInitialVisibleCount);
  }, [open, options, progressiveLoadEnabled, query, safeInitialVisibleCount]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    function updateContentWidth() {
      const nextWidth = triggerButtonRef.current?.getBoundingClientRect().width ?? null;
      setContentWidth(nextWidth && Number.isFinite(nextWidth) ? nextWidth : null);
    }

    updateContentWidth();
    const frameId = window.requestAnimationFrame(updateContentWidth);
    window.addEventListener("resize", updateContentWidth);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateContentWidth);
    };
  }, [open]);

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
    if (multiple) {
      setSelectedState((currentValue) => {
        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        return currentValues.includes(nextValue)
          ? currentValues.filter((value) => value !== nextValue)
          : [...currentValues, nextValue];
      });
      return;
    }

    setSelectedState(nextValue);
    handleOpenChange(false);
  }

  function clearSelectedValue() {
    if (multiple) {
      return;
    }

    setSelectedState(null);
    resetSearchIfNeeded();
    handleOpenChange(false);
    triggerButtonRef.current?.focus();
  }

  function removeSelectedValue(nextValue: string) {
    if (!multiple) {
      return;
    }

    setSelectedState((currentValue) => {
      const currentValues = Array.isArray(currentValue) ? currentValue : [];
      return currentValues.filter((value) => value !== nextValue);
    });
  }

  function handleClearClick(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    clearSelectedValue();
  }

  function handleClearMouseDown(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleTagRemoveClick(event: ReactMouseEvent<HTMLElement>, nextValue: string) {
    event.preventDefault();
    event.stopPropagation();
    removeSelectedValue(nextValue);
  }

  function handleListScroll(event: ReactUiEvent<HTMLDivElement>) {
    if (loading) {
      return;
    }

    const target = event.currentTarget;

    if (target.scrollTop + target.clientHeight < target.scrollHeight - 24) {
      return;
    }

    if (hasRemoteMoreOptions) {
      if (!loadingMore) {
        onLoadMore?.();
      }
      return;
    }

    if (!hasMoreVisibleOptions) {
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
      {...(domProps as HTMLAttributes<HTMLDivElement>)}
      className={cx(
        "ui-combobox",
        `ui-combobox--${size}`,
        multiple && "ui-combobox--multiple",
        invalid && "ui-combobox--invalid",
        disabled && "ui-combobox--disabled",
        className,
      )}
    >
      {name
        ? multiple
          ? selectedValues.map((entry) => <input key={`${name}-${entry}`} name={name} type="hidden" value={entry} />)
          : <input name={name} type="hidden" value={selectedValue ?? ""} />
        : null}
      <Popover align="start" onOpenChange={handleOpenChange} open={open}>
        <PopoverTrigger>
          <button
            aria-label={triggerAriaLabel}
            aria-controls={listId}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="ui-combobox__trigger"
            disabled={disabled}
            id={triggerId}
            ref={triggerButtonRef}
            role="combobox"
            type="button"
          >
            <span
              className={cx(
                "ui-combobox__trigger-value",
                multiple && selectedOptions.length > 0 && "ui-combobox__trigger-value--multiple",
                (!multiple ? !selectedOption : selectedOptions.length === 0) && "ui-combobox__trigger-value--placeholder",
              )}
            >
              {triggerValue}
            </span>
            {canClearSingleValue ? (
              <span
                aria-label={clearSelectionLabel}
                className="ui-combobox__trigger-clear"
                onClick={handleClearClick}
                onMouseDown={handleClearMouseDown}
                role="button"
                tabIndex={-1}
                title={clearSelectionLabel}
              >
                <ComboboxClearIcon />
              </span>
            ) : null}
            <ComboboxChevronIcon />
          </button>
        </PopoverTrigger>
        <PopoverContent
          aria-label={typeof label === "string" ? label : "Options"}
          className="ui-combobox__content"
          style={contentWidth ? ({
            "--ui-combobox-content-width": `${contentWidth}px`,
          } as CSSProperties) : undefined}
        >
          <div className="ui-combobox__search">
            <Input
              autoFocus={open}
              autoComplete="off"
              aria-controls={listId}
              aria-label={searchInputAriaLabel}
              className="ui-combobox__search-input"
              id={searchInputId}
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              ref={handleSearchInputRef}
              size="sm"
              value={query}
            />
          </div>
          <div
            aria-label={typeof label === "string" ? label : "Options"}
            aria-multiselectable={multiple || undefined}
            className="ui-combobox__list"
            id={listId}
            onScroll={handleListScroll}
            role="listbox"
          >
            {loading && renderedOptions.length === 0 ? (
              <div className="ui-combobox__empty">{loadingLabel}</div>
            ) : renderedOptions.length > 0 ? (
              <>
                {renderedOptions.map((option) => {
                  const selected = multiple
                    ? selectedValueSet.has(option.value)
                    : option.value === selectedValue;

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
                })}
                {loadingMore ? (
                  <div className="ui-combobox__empty ui-combobox__empty--loading-more">{loadMoreLabel}</div>
                ) : null}
              </>
            ) : (
              <div className="ui-combobox__empty">{emptyLabel}</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
