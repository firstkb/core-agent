import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  CameraIcon,
  PlusIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
} from "@platform/ui-kit";

import type {
  RuntimeFormChecklistDetailDefinition,
  RuntimeFormChecklistData,
  RuntimeFormChecklistItem,
  RuntimeFormChecklistItemChange,
  RuntimeFormChecklistOption,
  RuntimeFormContentDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormChecklistRevealRequest,
  RuntimeFormResolvedLabels,
  RuntimeFormSubformDefinition,
  RuntimeFormSubformRow,
  RuntimeFormValue,
  RuntimeFormValues,
} from "./runtime-form-types";
import { RuntimeContentNode } from "./runtime-form-content";
import { RuntimeField } from "./fields/runtime-field";
import { cx } from "./runtime-form-utils";

const subformDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function getSubformCellText(row: RuntimeFormSubformRow, fieldId: string) {
  const cell = row.cells[fieldId];
  if (!cell) {
    return "";
  }
  if (typeof cell.displayValue === "string") {
    return cell.displayValue;
  }
  if (typeof cell.label === "string") {
    return cell.label;
  }
  return String(cell.value ?? "");
}

function formatUsDateParts(year: string, month: string, day: string) {
  return `${month}/${day}/${year}`;
}

function formatSubformCellValue(
  value: string,
  type: RuntimeFormSubformDefinition["columns"][number]["type"],
  labels: RuntimeFormResolvedLabels,
) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return labels.emptyValue;
  }

  if (type === "boolean") {
    return normalizedValue === "true" || normalizedValue === "1" ? labels.booleanYes : labels.booleanNo;
  }

  if (type === "date") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedValue);
    return match ? formatUsDateParts(match[1], match[2], match[3]) : normalizedValue;
  }

  if (type === "date_time") {
    const date = new Date(normalizedValue);
    if (!Number.isNaN(date.getTime())) {
      return subformDateTimeFormatter.format(date);
    }
  }

  return normalizedValue;
}

function sortSubformRows(
  subform: RuntimeFormSubformDefinition,
  rows: ReadonlyArray<RuntimeFormSubformRow>,
) {
  const sort = subform.defaultSort;
  if (!sort?.columnId) {
    return rows;
  }

  const column = subform.columns.find((candidate) => candidate.id === sort.columnId || candidate.fieldId === sort.columnId);
  if (!column) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const leftText = getSubformCellText(left, column.fieldId);
    const rightText = getSubformCellText(right, column.fieldId);
    const result = leftText.localeCompare(rightText, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return sort.direction === "desc" ? -result : result;
  });
}

export function RuntimeSubformNode({
  checklist,
  checklistRevealRequest,
  labels,
  onChecklistItemChange,
  onAdd,
  onDelete,
  onEdit,
  rows = [],
  subform,
}: {
  checklist?: RuntimeFormChecklistData;
  checklistRevealRequest?: RuntimeFormChecklistRevealRequest;
  labels: RuntimeFormResolvedLabels;
  onChecklistItemChange?: (
    subform: RuntimeFormSubformDefinition,
    item: RuntimeFormChecklistItem,
    change: RuntimeFormChecklistItemChange,
  ) => void;
  onAdd?: (subform: RuntimeFormSubformDefinition) => void;
  onDelete?: (subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) => void;
  onEdit?: (subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) => void;
  rows?: ReadonlyArray<RuntimeFormSubformRow>;
  subform: RuntimeFormSubformDefinition;
}) {
  if (subform.subformType === "CHECKLIST") {
    return (
      <RuntimeChecklistSubformNode
        checklist={checklist}
        labels={labels}
        onChecklistItemChange={onChecklistItemChange}
        revealRequest={checklistRevealRequest}
        subform={subform}
      />
    );
  }

  const sortedRows = sortSubformRows(subform, rows);
  const canAdd = subform.actions.canAdd && Boolean(onAdd);
  const canEdit = subform.actions.canEdit && Boolean(onEdit);
  const canDelete = subform.actions.canDelete && Boolean(onDelete);
  const actionColumnCount = canEdit || canDelete ? 1 : 0;
  const colSpan = Math.max(subform.columns.length + actionColumnCount, 1);
  const shouldConstrainTable = sortedRows.length > 5;

  return (
    <section className={cx("platform-runtime-form__subform", subform.width === "full" && "platform-runtime-form__field--full")}>
      <div className="platform-runtime-form__subform-header">
        <h4 className="platform-runtime-form__subform-title">{subform.title}</h4>
        {canAdd ? (
          <Button
            leadingIcon={<PlusIcon className="platform-runtime-form__subform-add-icon" />}
            onClick={() => onAdd?.(subform)}
            size="sm"
            type="button"
            variant="secondary"
          >
            {labels.subformAdd}
          </Button>
        ) : null}
      </div>

      <div
        className={cx(
          "platform-runtime-form__subform-table-scroll",
          shouldConstrainTable && "platform-runtime-form__subform-table-scroll--constrained",
        )}
      >
        <Table className="platform-runtime-form__subform-table" density="compact">
          <TableHead>
            <TableRow>
              {subform.columns.map((column) => (
                <TableHeaderCell key={column.id} scope="col">
                  {column.label}
                </TableHeaderCell>
              ))}
              {actionColumnCount ? (
                <TableHeaderCell className="platform-runtime-form__subform-actions-header" scope="col" />
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.length > 0 ? sortedRows.map((row) => (
              <TableRow key={row.id}>
                {subform.columns.map((column) => {
                  const cell = row.cells[column.fieldId];
                  const text = formatSubformCellValue(getSubformCellText(row, column.fieldId), column.type, labels);
                  return (
                    <TableCell key={column.id}>
                      {column.type === "html" && cell?.html ? (
                        <span
                          className="platform-runtime-form__subform-cell-value"
                          dangerouslySetInnerHTML={{ __html: cell.html }}
                        />
                      ) : (
                        <span className="platform-runtime-form__subform-cell-value">{text}</span>
                      )}
                    </TableCell>
                  );
                })}
                {actionColumnCount ? (
                  <TableCell className="platform-runtime-form__subform-actions-cell">
                    {canEdit ? (
                      <Button
                        onClick={() => onEdit?.(subform, row)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        {labels.subformEdit}
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        onClick={() => onDelete?.(subform, row)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        {labels.subformDelete}
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell className="platform-runtime-form__subform-empty" colSpan={colSpan}>
                  {labels.subformEmpty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function checklistIsFlat(checklist: RuntimeFormChecklistData | undefined) {
  return (checklist?.groups.length ?? 0) <= 1 && !checklist?.groups[0]?.title;
}

function getChecklistOptionStyleClassName(option: RuntimeFormChecklistOption | undefined) {
  return option?.styleVariant && option.styleVariant !== "default"
    ? `platform-runtime-form__choice-button--${option.styleVariant}`
    : undefined;
}

function isChecklistDetailField(detail: RuntimeFormChecklistDetailDefinition): detail is RuntimeFormFieldDefinition {
  return detail.nodeType === "field";
}

function isChecklistDetailContent(detail: RuntimeFormChecklistDetailDefinition): detail is RuntimeFormContentDefinition {
  return detail.nodeType === "content";
}

function checklistValueToString(value: RuntimeFormValue | undefined) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return "";
}

function getChecklistDetailNodes(
  subform: RuntimeFormSubformDefinition,
  labels: RuntimeFormResolvedLabels,
): ReadonlyArray<RuntimeFormChecklistDetailDefinition> {
  const details = subform.checklistDetails ?? [];
  if (!subform.checklistNotesFieldId || details.some((detail) => isChecklistDetailField(detail) && detail.id === subform.checklistNotesFieldId)) {
    return details;
  }
  return [
    ...details,
    {
      id: subform.checklistNotesFieldId,
      label: String(labels.checklistNotes),
      labelLayout: "stacked",
      nodeType: "field",
      rows: 5,
      type: "long_text",
      width: "full",
    },
  ];
}

function getChecklistItemValues(item: RuntimeFormChecklistItem, subform: RuntimeFormSubformDefinition): RuntimeFormValues {
  const values = { ...(item.values ?? {}) };
  if (subform.checklistNotesFieldId) {
    values[subform.checklistNotesFieldId] = item.notes ?? values[subform.checklistNotesFieldId];
  }
  return values;
}

function RuntimeChecklistSubformNode({
  checklist,
  labels,
  onChecklistItemChange,
  revealRequest,
  subform,
}: {
  checklist?: RuntimeFormChecklistData;
  labels: RuntimeFormResolvedLabels;
  onChecklistItemChange?: (
    subform: RuntimeFormSubformDefinition,
    item: RuntimeFormChecklistItem,
    change: RuntimeFormChecklistItemChange,
  ) => void;
  revealRequest?: RuntimeFormChecklistRevealRequest;
  subform: RuntimeFormSubformDefinition;
}) {
  const groups = checklist?.groups ?? [];
  const isFlat = checklistIsFlat(checklist);
  const firstGroupId = groups[0]?.id ?? "";
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (isFlat) {
      setActiveGroupId(firstGroupId || null);
      return;
    }
    setActiveGroupId((currentGroupId) => groups.some((group) => group.id === currentGroupId) ? currentGroupId : null);
  }, [firstGroupId, groups, isFlat]);

  useEffect(() => {
    if (!revealRequest || revealRequest.subformId !== subform.schemaScopeId) {
      return;
    }
    const groupId = revealRequest.groupId || groups.find((group) =>
      group.items.some((item) => item.sourceValue === revealRequest.sourceValue),
    )?.id;
    if (groupId) {
      setActiveGroupId(groupId);
    }
    if (revealRequest.sourceValue && typeof document !== "undefined") {
      globalThis.setTimeout(() => {
        const target = Array.from(document.querySelectorAll<HTMLElement>("[data-runtime-checklist-subform][data-runtime-checklist-source]"))
          .find((candidate) =>
            candidate.dataset.runtimeChecklistSubform === subform.schemaScopeId
            && candidate.dataset.runtimeChecklistSource === revealRequest.sourceValue,
          );
        target?.scrollIntoView({ block: "center", behavior: "smooth" });
        target?.focus({ preventScroll: true });
      }, 40);
    }
  }, [groups, revealRequest, subform.schemaScopeId]);

  const renderedGroups = useMemo(() => groups, [groups]);

  if (renderedGroups.length === 0) {
    return (
      <section className={cx("platform-runtime-form__subform", "platform-runtime-form__accordion", "platform-runtime-form__checklist", subform.width === "full" && "platform-runtime-form__field--full")}>
        <div className="platform-runtime-form__subform-header">
          <h4 className="platform-runtime-form__subform-title">{subform.title}</h4>
        </div>
        <p className="platform-runtime-form__checklist-empty">{labels.subformEmpty}</p>
      </section>
    );
  }

  if (isFlat) {
    return (
      <section className={cx("platform-runtime-form__subform", "platform-runtime-form__checklist", subform.width === "full" && "platform-runtime-form__field--full")}>
        <div className="platform-runtime-form__subform-header">
          <h4 className="platform-runtime-form__subform-title">{subform.title}</h4>
        </div>
        <div className="platform-runtime-form__checklist-items">
          {renderedGroups.flatMap((group) => group.items).map((item) => (
            <RuntimeChecklistItemRow
              item={item}
              key={item.sourceValue}
              labels={labels}
              onChecklistItemChange={onChecklistItemChange}
              subform={subform}
            />
          ))}
        </div>
      </section>
    );
  }

  function handleGroupChange(nextValue: string | string[] | null) {
    setActiveGroupId(typeof nextValue === "string" ? nextValue : null);
  }

  return (
    <section className={cx("platform-runtime-form__subform", "platform-runtime-form__accordion", "platform-runtime-form__checklist", subform.width === "full" && "platform-runtime-form__field--full")}>
      <div className="platform-runtime-form__subform-header">
        <h4 className="platform-runtime-form__subform-title">{subform.title}</h4>
      </div>
      <Accordion onValueChange={handleGroupChange} value={activeGroupId} variant="outline">
        {renderedGroups.map((group) => (
          <AccordionItem className="platform-runtime-form__checklist-category" key={group.id} value={group.id}>
            <AccordionTrigger className="platform-runtime-form__checklist-category-trigger">
              {group.title || group.id}
            </AccordionTrigger>
            <AccordionContent className="platform-runtime-form__checklist-category-content">
              {activeGroupId === group.id ? (
                <div className="platform-runtime-form__checklist-items">
                  {group.items.map((item) => (
                    <RuntimeChecklistItemRow
                      item={item}
                      key={item.sourceValue}
                      labels={labels}
                      onChecklistItemChange={onChecklistItemChange}
                      subform={subform}
                    />
                  ))}
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function RuntimeChecklistItemRow({
  item,
  labels,
  onChecklistItemChange,
  subform,
}: {
  item: RuntimeFormChecklistItem;
  labels: RuntimeFormResolvedLabels;
  onChecklistItemChange?: (
    subform: RuntimeFormSubformDefinition,
    item: RuntimeFormChecklistItem,
    change: RuntimeFormChecklistItemChange,
  ) => void;
  subform: RuntimeFormSubformDefinition;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const options = item.answerOptions ?? [];
  const notesText = item.notes?.trim() ?? "";
  const detailNodes = getChecklistDetailNodes(subform, labels);
  const detailValues = getChecklistItemValues(item, subform);

  function handleDetailFieldChange(fieldId: string, value: RuntimeFormValue | undefined) {
    const nextValues = {
      ...(item.values ?? {}),
      [fieldId]: value,
    };
    onChecklistItemChange?.(subform, item, {
      notes: fieldId === subform.checklistNotesFieldId ? checklistValueToString(value) : undefined,
      values: nextValues,
    });
  }

  return (
    <article
      className={cx(
        "platform-runtime-form__checklist-item",
        item.required && !item.value && "platform-runtime-form__checklist-item--required-empty",
      )}
      data-runtime-checklist-source={item.sourceValue}
      data-runtime-checklist-subform={subform.schemaScopeId}
      tabIndex={-1}
    >
      <div className="platform-runtime-form__checklist-question">
        <div className="platform-runtime-form__checklist-question-text">
          <span className="platform-runtime-form__checklist-question-label">
            {item.label}
            {item.required ? <span aria-hidden="true" className="platform-runtime-form__checklist-required">*</span> : null}
          </span>
          {item.description ? (
            <span className="platform-runtime-form__checklist-question-description">{item.description}</span>
          ) : null}
          {item.inactiveSaved ? (
            <span className="platform-runtime-form__checklist-inactive">{labels.checklistInactiveSaved}</span>
          ) : null}
        </div>
        <div className="platform-runtime-form__checklist-actions">
          <ToggleGroup
            aria-label={item.label}
            className="platform-runtime-form__choice-button-group platform-runtime-form__choice-button-group--segmented-horizontal platform-runtime-form__checklist-answer-group"
            onValueChange={(nextValue) => {
              if (Array.isArray(nextValue) || !nextValue) {
                return;
              }
              onChecklistItemChange?.(subform, item, { value: nextValue });
            }}
            orientation="horizontal"
            type="single"
            value={item.value ?? ""}
            variant="outline"
          >
            {options.map((option) => (
              <ToggleGroupItem
                className={getChecklistOptionStyleClassName(option)}
                key={option.value}
                value={option.value}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            aria-label={String(labels.checklistNotes)}
            className={cx(
              "platform-runtime-form__checklist-notes-button",
              notesOpen && "platform-runtime-form__checklist-notes-button--active",
            )}
            onClick={() => setNotesOpen((open) => !open)}
            size="sm"
            title={String(labels.checklistNotes)}
            type="button"
            variant="secondary"
          >
            <span>A +</span>
            <CameraIcon className="platform-runtime-form__checklist-notes-icon" />
          </Button>
        </div>
      </div>
      {notesOpen ? (
        <div className="platform-runtime-form__checklist-details">
          {detailNodes.map((detail) => {
            if (isChecklistDetailContent(detail)) {
              return (
                <RuntimeContentNode
                  content={detail}
                  key={detail.id}
                  labels={labels}
                />
              );
            }
            return (
              <RuntimeField
                definitionId={`checklist-${subform.schemaScopeId}-${item.sourceValue}`}
                errors={{}}
                field={detail}
                key={detail.id}
                labels={labels}
                onFieldChange={handleDetailFieldChange}
                value={detailValues[detail.id]}
                values={detailValues}
              />
            );
          })}
        </div>
      ) : notesText ? (
        <div className="platform-runtime-form__checklist-details-preview">
          <span>{notesText}</span>
        </div>
      ) : null}
    </article>
  );
}
