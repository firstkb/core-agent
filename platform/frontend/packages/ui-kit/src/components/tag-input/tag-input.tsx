import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "../../lib/cx";
import { useAnchoredPosition } from "../../lib/use-anchored-position";
import { useControllableState } from "../../lib/use-controllable-state";
import type { InputSize } from "../input";

function TagInputRemoveIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ui-tag-input__tag-remove-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="m5 5 6 6m0-6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export type TagInputMode = "freeform" | "preset" | "hybrid";

export type TagInputProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> & {
  addOnBlur?: boolean;
  allowCustomValues?: boolean;
  allowDuplicates?: boolean;
  defaultValue?: readonly string[];
  disabled?: boolean;
  emptySuggestionLabel?: ReactNode;
  id?: string;
  inputAriaLabel?: string;
  invalid?: boolean;
  maxTags?: number;
  mode?: TagInputMode;
  name?: string;
  onValueChange?: (tags: string[]) => void;
  placeholder?: string;
  separators?: readonly string[];
  size?: InputSize;
  suggestions?: readonly string[];
  value?: readonly string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function TagInput({
  addOnBlur = true,
  allowCustomValues = true,
  allowDuplicates = false,
  className,
  defaultValue = [],
  disabled = false,
  emptySuggestionLabel = "No matching tags",
  id,
  inputAriaLabel = "Add tag",
  invalid = false,
  maxTags,
  mode,
  name,
  onValueChange,
  placeholder = "Add tags",
  separators = [","],
  size = "md",
  suggestions = [],
  value,
  ...props
}: TagInputProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `ui-tag-input-${generatedId}`;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestionsReady, setSuggestionsReady] = useState(false);
  const [suggestionsWidth, setSuggestionsWidth] = useState(0);
  const [tags, setTags] = useControllableState<string[]>({
    defaultValue: [...defaultValue],
    onChange: onValueChange,
    value: value === undefined ? undefined : [...value],
  });

  const separatorPattern = useMemo(() => {
    if (separators.length === 0) {
      return null;
    }

    const escapedSeparators = separators.map((separator) => escapeRegExp(separator));
    return new RegExp(`(?:${escapedSeparators.join("|")})+$`);
  }, [separators]);

  const resolvedMode: TagInputMode =
    mode ?? (suggestions.length === 0 ? "freeform" : allowCustomValues ? "hybrid" : "preset");
  const customValuesAllowed = resolvedMode !== "preset";

  function getComparableValue(rawValue: string) {
    return normalizeTag(rawValue).toLowerCase();
  }

  function normalizeTag(rawTag: string) {
    const trimmed = rawTag.trim();

    if (!trimmed || !separatorPattern) {
      return trimmed;
    }

    return trimmed.replace(separatorPattern, "").trim();
  }

  const filteredSuggestions = useMemo(() => {
    const selectedValues = new Set(tags.map((tag) => getComparableValue(tag)));
    const normalizedQuery = normalizeTag(draftValue).toLowerCase();

    return suggestions.filter((suggestion) => {
      const comparableSuggestion = getComparableValue(suggestion);

      if (selectedValues.has(comparableSuggestion)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return comparableSuggestion.includes(normalizedQuery);
    });
  }, [draftValue, suggestions, tags]);

  const showSuggestions = !disabled && resolvedMode !== "freeform" && suggestions.length > 0 && inputFocused;
  const suggestionsStyle = useAnchoredPosition({
    align: "start",
    anchorRef: shellRef,
    contentRef: suggestionsRef,
    open: showSuggestions,
    side: "bottom",
    sideOffset: 8,
  });

  useEffect(() => {
    if (!showSuggestions || typeof window === "undefined") {
      setSuggestionsReady(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setSuggestionsReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [showSuggestions]);

  useEffect(() => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      setActiveSuggestionIndex(-1);
      return;
    }

    setActiveSuggestionIndex((currentIndex) => {
      if (currentIndex >= 0 && currentIndex < filteredSuggestions.length) {
        return currentIndex;
      }

      return 0;
    });
  }, [filteredSuggestions.length, showSuggestions]);

  useEffect(() => {
    if (!showSuggestions || typeof window === "undefined") {
      return;
    }

    function updateSuggestionsWidth() {
      setSuggestionsWidth(shellRef.current?.getBoundingClientRect().width ?? 0);
    }

    updateSuggestionsWidth();

    window.addEventListener("resize", updateSuggestionsWidth);
    window.addEventListener("scroll", updateSuggestionsWidth, true);

    return () => {
      window.removeEventListener("resize", updateSuggestionsWidth);
      window.removeEventListener("scroll", updateSuggestionsWidth, true);
    };
  }, [showSuggestions]);

  function hasTag(tagValue: string) {
    const comparableValue = getComparableValue(tagValue);
    return tags.some((tag) => getComparableValue(tag) === comparableValue);
  }

  function getExactSuggestionMatch(rawTag: string) {
    const comparableValue = getComparableValue(rawTag);

    if (!comparableValue) {
      return null;
    }

    return suggestions.find((suggestion) => getComparableValue(suggestion) === comparableValue) ?? null;
  }

  function commitTag(rawTag: string) {
    const matchedSuggestion = getExactSuggestionMatch(rawTag);
    const nextTag = matchedSuggestion ?? normalizeTag(rawTag);

    if (!nextTag) {
      setDraftValue("");
      return;
    }

    if (!customValuesAllowed && !matchedSuggestion) {
      setDraftValue("");
      return;
    }

    if (!allowDuplicates && hasTag(nextTag)) {
      setDraftValue("");
      return;
    }

    if (typeof maxTags === "number" && tags.length >= maxTags) {
      setDraftValue("");
      return;
    }

    setTags([...tags, nextTag]);
    setDraftValue("");
  }

  function removeTag(tagIndex: number) {
    setTags(tags.filter((_, index) => index !== tagIndex));
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && filteredSuggestions.length > 0 && event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex < filteredSuggestions.length - 1 ? currentIndex + 1 : 0,
      );
      return;
    }

    if (showSuggestions && filteredSuggestions.length > 0 && event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : filteredSuggestions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" || separators.includes(event.key)) {
      event.preventDefault();
      const activeSuggestion =
        activeSuggestionIndex >= 0 ? filteredSuggestions[activeSuggestionIndex] : null;

      commitTag(activeSuggestion ?? draftValue);
      return;
    }

    if (event.key === "Escape") {
      setInputFocused(false);
      inputRef.current?.blur();
      return;
    }

    if (event.key === "Backspace" && !draftValue && tags.length > 0) {
      event.preventDefault();
      removeTag(tags.length - 1);
    }
  }

  function handleInputBlur() {
    setInputFocused(false);

    if (addOnBlur) {
      commitTag(draftValue);
    }
  }

  function handleRootClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    const target = event.target;

    if (target instanceof Element && target.closest("button")) {
      return;
    }

    inputRef.current?.focus();
  }

  return (
    <div className="ui-tag-input-shell" ref={shellRef}>
      <div
        {...props}
        className={cx(
          "ui-tag-input",
          `ui-tag-input--${size}`,
          invalid && "ui-tag-input--invalid",
          disabled && "ui-tag-input--disabled",
          className,
        )}
        onClick={handleRootClick}
      >
        {tags.map((tag, index) => (
          <span className="ui-tag-input__tag" key={`${tag}-${index}`}>
            <span className="ui-tag-input__tag-label">{tag}</span>
            <button
              aria-label={`Remove ${tag}`}
              className="ui-tag-input__tag-remove"
              disabled={disabled}
              onClick={() => removeTag(index)}
              type="button"
            >
              <TagInputRemoveIcon />
            </button>
            {name ? <input name={name} type="hidden" value={tag} /> : null}
          </span>
        ))}
        <input
          aria-label={inputAriaLabel}
          className="ui-tag-input__input"
          disabled={disabled}
          id={inputId}
          onBlur={handleInputBlur}
          onChange={(event) => setDraftValue(event.currentTarget.value)}
          onFocus={() => setInputFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
          value={draftValue}
        />
      </div>
      {showSuggestions ? (
        typeof document !== "undefined"
          ? createPortal(
              <div
                className="ui-tag-input__suggestions"
                ref={suggestionsRef}
                role="listbox"
                style={{
                  ...suggestionsStyle,
                  pointerEvents: suggestionsReady ? "auto" : "none",
                  visibility: suggestionsReady ? "visible" : "hidden",
                  width: suggestionsWidth > 0 ? suggestionsWidth : undefined,
                }}
              >
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((suggestion, index) => (
                    <button
                      aria-selected={index === activeSuggestionIndex}
                      className={cx(
                        "ui-tag-input__suggestion",
                        index === activeSuggestionIndex && "ui-tag-input__suggestion--active",
                      )}
                      key={suggestion}
                      onClick={() => commitTag(suggestion)}
                      onMouseDown={(event) => event.preventDefault()}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))
                ) : (
                  <div className="ui-tag-input__suggestions-empty">{emptySuggestionLabel}</div>
                )}
              </div>,
              document.body,
            )
          : null
      ) : null}
    </div>
  );
}
