import { Button, SearchEmptyState } from "@platform/ui-kit";

import { UiLabContentHeader } from "./components/content-header";
import { UiLabMobileHeader } from "./components/mobile-header";
import { UiLabPreviewOverlays } from "./components/preview-overlays";
import { UiLabSidebar } from "./components/sidebar";
import { useUiLabState } from "./hooks/use-ui-lab-state";
import { renderPanel } from "./panels";
import "./ui-lab.css";

export function AdminUiLabPage() {
  const {
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
    setSidebarDrawerOpen,
    setStepperStep,
    sheetOpen,
    sidebarDrawerOpen,
    stepperStep,
    toggleSection,
    visibleLeafIds,
  } = useUiLabState();

  return (
    <main
      className={`ui-lab-page ui-lab-page--${pageTheme}${mobileNavOpen ? " ui-lab-page--mobile-nav-open" : ""}`}
      data-theme={pageTheme}
      style={{ colorScheme: pageTheme }}
    >
      <UiLabMobileHeader
        menuOpen={mobileNavOpen}
        onMenuToggle={() => setMobileNavOpen((open) => !open)}
      />

      <button
        aria-hidden={!mobileNavOpen}
        aria-label="Close UI Lab navigation"
        className="ui-lab-page__mobile-backdrop"
        onClick={() => setMobileNavOpen(false)}
        tabIndex={mobileNavOpen ? 0 : -1}
        type="button"
      />

      <UiLabSidebar
        activeLeafId={activeLeafId}
        activeSectionId={activeSectionId}
        className={mobileNavOpen ? "ui-lab-page__sidebar--mobile-open" : ""}
        onLeafNavigate={handleLeafNavigation}
        onSearchQueryChange={setSearchQuery}
        onSectionToggle={toggleSection}
        onThemeChange={setPageTheme}
        openSectionId={openSectionId}
        pageTheme={pageTheme}
        searchQuery={searchQuery}
        sectionEntries={sectionEntries}
        sidebarId="ui-lab-navigation"
      />

      <section className="ui-lab-page__content" ref={contentRef}>
        {visibleLeafIds.length === 0 ? (
          <SearchEmptyState
            actions={
              <Button onClick={() => setSearchQuery("")} variant="outline">
                Clear search
              </Button>
            }
            description="Try a broader term or return to the full lab inventory."
            query={deferredSearch}
            suggestions={["foundations", "form controls", "data display", "states"]}
            title="No lab sections match"
          />
        ) : (
          <>
            <UiLabContentHeader
              activeItem={activeItem}
              activeLeafStatus={activeLeafStatus}
              contentHeaderRef={contentHeaderRef}
            />
            {renderPanel(
              activeItem,
              handleLeafNavigation,
              setAlertDialogOpen,
              setDialogOpen,
              setDrawerOpen,
              setSheetOpen,
              setSidebarDrawerOpen,
              activePresetId,
              setActivePresetId,
              page,
              setPage,
              stepperStep,
              setStepperStep,
              calendarDateValue,
              handleCalendarDateValueChange,
              calendarRangeStartDate,
              calendarRangeEndDate,
              handleCalendarRangeStartDateChange,
              handleCalendarRangeEndDateChange,
              calendarRangePresetId,
              handleCalendarRangePresetSelect,
            )}
          </>
        )}
      </section>

      <UiLabPreviewOverlays
        alertDialogOpen={alertDialogOpen}
        dialogOpen={dialogOpen}
        drawerOpen={drawerOpen}
        onAlertDialogOpenChange={setAlertDialogOpen}
        onDialogOpenChange={setDialogOpen}
        onDrawerOpenChange={setDrawerOpen}
        onSheetOpenChange={setSheetOpen}
        onSidebarDrawerOpenChange={setSidebarDrawerOpen}
        sheetOpen={sheetOpen}
        sidebarDrawerOpen={sidebarDrawerOpen}
      />
    </main>
  );
}
