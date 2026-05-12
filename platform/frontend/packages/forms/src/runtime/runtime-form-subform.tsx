import {
  Button,
  PlusIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@platform/ui-kit";

import type {
  RuntimeFormResolvedLabels,
  RuntimeFormSubformDefinition,
  RuntimeFormSubformRow,
} from "./runtime-form-types";
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
  labels,
  onAdd,
  onDelete,
  onEdit,
  rows = [],
  subform,
}: {
  labels: RuntimeFormResolvedLabels;
  onAdd?: (subform: RuntimeFormSubformDefinition) => void;
  onDelete?: (subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) => void;
  onEdit?: (subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) => void;
  rows?: ReadonlyArray<RuntimeFormSubformRow>;
  subform: RuntimeFormSubformDefinition;
}) {
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
