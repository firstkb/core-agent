import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DatePicker,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
} from "@platform/ui-kit";

import {
  inputSizes,
  uiLabRangePresets,
} from "../../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";

export function renderDateFieldDocs(
  calendarDateValue: string,
  onCalendarDateValueChange: (value: string) => void,
  rangeStartDate: string,
  rangeEndDate: string,
  onRangeStartDateChange: (value: string) => void,
  onRangeEndDateChange: (value: string) => void,
  activeRangePresetId: string | null,
  onRangePresetSelect: (presetId: string) => void,
) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Single-date selection</CardTitle>
          <CardDescription>Date picker should cover simple single-date entry without forcing the product to choose between separate primitives.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {inputSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <DatePicker
                aria-label={`${size} date picker`}
                defaultValue="2026-03-21"
                id={`ui-lab-date-picker-size-${size}`}
                name={`ui-lab-date-picker-size-${size}`}
                size={size}
              />
            </ShowcaseRow>
          ))}
          <ShowcaseRow label="Calendar mode" stacked>
            <DatePicker
              aria-label="Calendar date picker"
              id="ui-lab-date-picker-calendar"
              name="ui-lab-date-picker-calendar"
              onValueChange={onCalendarDateValueChange}
              openOnFieldClick
              picker="calendar"
              value={calendarDateValue}
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Range selection</CardTitle>
          <CardDescription>Date range is the same job family, so it should stay inside the same date-picker contract rather than becoming a separate top-level component.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Range presets" stacked>
            <DatePicker
              activePresetId={activeRangePresetId}
              endDate={rangeEndDate}
              endDateFieldId="ui-lab-date-picker-range-end"
              endDateFieldName="ui-lab-date-picker-range-end"
              mode="range"
              onEndDateChange={onRangeEndDateChange}
              onPresetSelect={onRangePresetSelect}
              onStartDateChange={onRangeStartDateChange}
              openOnFieldClick
              picker="calendar"
              presets={uiLabRangePresets}
              startDateFieldId="ui-lab-date-picker-range-start"
              startDateFieldName="ui-lab-date-picker-range-start"
              startDate={rangeStartDate}
            />
          </ShowcaseRow>
          <ShowcaseRow label="Compare" stacked>
            <div className="ui-lab-page__stack">
              <DatePicker
                activePresetId={activeRangePresetId}
                endDate={rangeEndDate}
                endDateFieldId="ui-lab-date-picker-compare-range-end"
                endDateFieldName="ui-lab-date-picker-compare-range-end"
                mode="range"
                onEndDateChange={onRangeEndDateChange}
                onPresetSelect={onRangePresetSelect}
                onStartDateChange={onRangeStartDateChange}
                openOnFieldClick
                picker="calendar"
                presets={uiLabRangePresets}
                startDateFieldId="ui-lab-date-picker-compare-range-start"
                startDateFieldName="ui-lab-date-picker-compare-range-start"
                startDate={rangeStartDate}
              />
              <FormGrid columns={2}>
                <Field>
                  <FieldLabel htmlFor="ui-lab-date-picker-compare-start">Start date</FieldLabel>
                  <DatePicker
                    id="ui-lab-date-picker-compare-start"
                    max={rangeEndDate || undefined}
                    name="ui-lab-date-picker-compare-start"
                    onValueChange={onRangeStartDateChange}
                    openOnFieldClick
                    picker="calendar"
                    value={rangeStartDate}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ui-lab-date-picker-compare-end">End date</FieldLabel>
                  <DatePicker
                    id="ui-lab-date-picker-compare-end"
                    min={rangeStartDate || undefined}
                    name="ui-lab-date-picker-compare-end"
                    onValueChange={onRangeEndDateChange}
                    openOnFieldClick
                    picker="calendar"
                    value={rangeEndDate}
                  />
                </Field>
              </FormGrid>
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Form shell" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-date-default">Cutoff date</FieldLabel>
                <DatePicker defaultValue="2026-03-21" id="ui-lab-date-default" name="ui-lab-date-default" />
                <FieldHint>Date picker defaults to the lowest-risk native entry contract.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-date-invalid">Launch date</FieldLabel>
                <DatePicker id="ui-lab-date-invalid" invalid max="2026-03-21" name="ui-lab-date-invalid" value="2026-04-03" />
                <FieldError>Choose a date inside the current rollout window.</FieldError>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-date-required">Renewal review</FieldLabel>
                <DatePicker defaultValue="2026-04-15" id="ui-lab-date-required" name="ui-lab-date-required" required />
                <FieldHint>Required accent comes from the field wrapper, not from a special date variant.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-date-disabled">Locked period</FieldLabel>
                <DatePicker defaultValue="2026-05-01" disabled id="ui-lab-date-disabled" name="ui-lab-date-disabled" />
                <FieldHint>Disabled date fields should still preserve control height and spacing.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Reference for the shared date-picker contract that covers both one-date and date-range selection.", [
        { name: "mode", type: "\"single\" | \"range\"", notes: "Keeps single-date and date-range selection inside one user-facing contract." },
        { name: "picker", type: "\"native\" | \"calendar\"", notes: "Switches between the light native baseline and the richer shared calendar picker." },
        { name: "value / onValueChange", type: "string / (value) => void", notes: "Single-date mode stays string-based at the form boundary for predictable form integration." },
        { name: "startDate / endDate", type: "string", notes: "Range mode keeps explicit start and end values instead of hiding them inside a separate top-level component." },
        { name: "activePresetId / presets / onPresetSelect", type: "range helpers", notes: "Optional range affordances stay inside the same date-picker family." },
        { name: "openOnFieldClick", type: "boolean", notes: "Allows the whole field to open the calendar picker instead of limiting interaction to the trailing icon." },
      ])}

      {renderReferenceNotesCard(
        "Date picker should be the one shared user-facing contract for temporal selection.",
        [
          "Choosing one date and choosing a range are the same job family and should not force product surfaces to adopt unrelated components.",
          "The contract can still expose a light native path and a richer calendar path without splitting the mental model.",
          "Hint, error, and required semantics still belong to the surrounding field wrapper.",
        ],
        [
          "Use single mode for scalar dates and range mode for periods, windows, and filters.",
          "Keep native and calendar entry as variants of one contract instead of separate feature families.",
          "Keep linked range controls on shared state so presets, start/end fields, and calendar selection always stay in sync.",
          "Prefer explicit string values at the form boundary so URL state and filter state stay simple.",
        ],
        [
          "Accessible labeling still needs to describe whether the control chooses one date or a range.",
          "Calendar opening should be reachable from the whole field when the field visually communicates a picker contract.",
          "Do not rely on color or placement alone to explain start and end semantics in range mode.",
        ],
      )}

      {renderUsageReviewCard(
        "Date picker works when the task is temporal selection, whether that means one date or a start-end period.",
        [
          "The surface needs either a single date or a range, but the user should not learn two different top-level date components.",
          "The page benefits from switching between native and calendar entry without changing the surrounding form contract.",
        ],
        [
          "Use single mode for one date and range mode for periods and filter windows.",
          "Keep constraints explicit with hint and error copy instead of hiding them in picker behavior.",
          "Use one shared date state when the surface exposes both a combined range picker and start/end field editors.",
          "Use the same field shell and validation grammar as the rest of the form layer.",
        ],
        [
          "Do not split one temporal task into separate user-facing component families because the internal implementation differs.",
          "Do not overload the contract with time, timezone, booking, or schedule-specific logic yet.",
          "Do not assume presets are mandatory; they belong only where repeated shortcuts add real value.",
        ],
      )}
    </div>
  );
}
