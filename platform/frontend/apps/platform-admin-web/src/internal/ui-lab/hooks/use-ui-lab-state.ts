import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { UiLabLeafId, UiLabSectionId, UiLabTheme } from "../model/leaf-meta";
import {
  getDefaultSectionId,
  getVisibleLeafIds,
  buildSectionEntries,
} from "../model/navigation";
import {
  getUiLabPresetRange,
  parseUiLabDateValue,
  uiLabLeafMeta,
} from "../model/leaf-meta";
import { getLeafStatus } from "../model/status";

export function useUiLabState() {
  const contentRef = useRef<HTMLElement | null>(null);
  const contentHeaderRef = useRef<HTMLElement | null>(null);
  const previousRootThemeRef = useRef<string | null>(null);
  const previousRootColorSchemeRef = useRef("");
  const [activeLeafId, setActiveLeafId] = useState<UiLabLeafId>("dashboards-light-sidebar");
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [calendarDateValue, setCalendarDateValue] = useState("2026-03-21");
  const [calendarRangeStartDate, setCalendarRangeStartDate] = useState("2026-03-10");
  const [calendarRangeEndDate, setCalendarRangeEndDate] = useState("2026-03-21");
  const [calendarRangePresetId, setCalendarRangePresetId] = useState<string | null>("30d");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarCandidateDrawerOpen, setSidebarCandidateDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<UiLabSectionId | null>("foundations");
  const [page, setPage] = useState(2);
  const [pageTheme, setPageTheme] = useState<UiLabTheme>("light");
  const [activePresetId, setActivePresetId] = useState("health");
  const [stepperStep, setStepperStep] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem("platform-ui-lab-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setPageTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("platform-ui-lab-theme", pageTheme);
  }, [pageTheme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    previousRootThemeRef.current = root.getAttribute("data-theme");
    previousRootColorSchemeRef.current = root.style.colorScheme;

    return () => {
      if (previousRootThemeRef.current === null) {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", previousRootThemeRef.current);
      }

      root.style.colorScheme = previousRootColorSchemeRef.current;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", pageTheme);
    root.style.colorScheme = pageTheme;
  }, [pageTheme]);

  function handleCalendarDateValueChange(nextValue: string) {
    setCalendarDateValue(nextValue);
  }

  function handleCalendarRangeStartDateChange(nextValue: string) {
    setCalendarRangeStartDate(nextValue);
    setCalendarRangePresetId(null);

    if (nextValue && calendarRangeEndDate) {
      const nextStartDate = parseUiLabDateValue(nextValue);
      const nextEndDate = parseUiLabDateValue(calendarRangeEndDate);

      if (nextStartDate && nextEndDate && nextEndDate.getTime() < nextStartDate.getTime()) {
        setCalendarRangeEndDate("");
      }
    }
  }

  function handleCalendarRangeEndDateChange(nextValue: string) {
    setCalendarRangeEndDate(nextValue);
    setCalendarRangePresetId(null);

    if (calendarRangeStartDate && nextValue) {
      const nextStartDate = parseUiLabDateValue(calendarRangeStartDate);
      const nextEndDate = parseUiLabDateValue(nextValue);

      if (nextStartDate && nextEndDate && nextEndDate.getTime() < nextStartDate.getTime()) {
        setCalendarRangeStartDate("");
      }
    }
  }

  function handleCalendarRangePresetSelect(presetId: string) {
    const presetRange = getUiLabPresetRange(presetId);
    setCalendarRangePresetId(presetId);
    setCalendarRangeStartDate(presetRange.startDate);
    setCalendarRangeEndDate(presetRange.endDate);
  }

  function handleLeafNavigation(nextLeafId: UiLabLeafId) {
    setActiveLeafId(nextLeafId);
    setOpenSectionId(getDefaultSectionId(nextLeafId));
    setMobileNavOpen(false);
  }

  const sectionEntries = useMemo(() => buildSectionEntries(normalizedQuery), [normalizedQuery]);

  const visibleLeafIds = useMemo(() => {
    return getVisibleLeafIds(sectionEntries);
  }, [sectionEntries]);

  useEffect(() => {
    if (visibleLeafIds.length === 0) {
      return;
    }

    if (!visibleLeafIds.includes(activeLeafId)) {
      const nextLeafId = visibleLeafIds[0];
      setActiveLeafId(nextLeafId);
      setOpenSectionId(getDefaultSectionId(nextLeafId));
    }
  }, [activeLeafId, visibleLeafIds]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
      contentHeaderRef.current?.scrollIntoView({ block: "start" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeLeafId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 721px)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileNavOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  const activeItem = uiLabLeafMeta[activeLeafId];
  const activeSectionId = getDefaultSectionId(activeLeafId);
  const activeLeafStatus = getLeafStatus(activeLeafId);

  function toggleSection(id: UiLabSectionId) {
    setOpenSectionId((currentId) => (currentId === id ? null : id));
  }

  return {
    activeItem,
    activeLeafId,
    activeLeafStatus,
    activeSectionId,
    activePresetId,
    alertDialogOpen,
    calendarDateValue,
    calendarRangeEndDate,
    calendarRangePresetId,
    calendarRangeStartDate,
    contentHeaderRef,
    contentRef,
    deferredSearch,
    dialogOpen,
    drawerOpen,
    handleCalendarDateValueChange,
    handleCalendarRangeEndDateChange,
    handleCalendarRangePresetSelect,
    handleCalendarRangeStartDateChange,
    handleLeafNavigation,
    mobileNavOpen,
    openSectionId,
    page,
    pageTheme,
    searchQuery,
    sectionEntries,
    setActivePresetId,
    setAlertDialogOpen,
    setDialogOpen,
    setDrawerOpen,
    setMobileNavOpen,
    setPage,
    setPageTheme,
    setSearchQuery,
    setSheetOpen,
    setSidebarCandidateDrawerOpen,
    setStepperStep,
    sheetOpen,
    sidebarCandidateDrawerOpen,
    stepperStep,
    toggleSection,
    visibleLeafIds,
  };
}
