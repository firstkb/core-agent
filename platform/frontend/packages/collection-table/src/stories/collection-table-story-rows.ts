import type { CollectionTableRowData } from "../index";

export const readyRows: ReadonlyArray<CollectionTableRowData> = [
  {
    cells: {
      owner: {
        value: "M. Rivera",
      },
      risk: {
        label: "High",
        tone: "danger",
        value: "high",
      },
      site: {
        value: "North Plant",
      },
      status: {
        label: "Open",
        tone: "warning",
        value: "open",
      },
      summary: {
        value: "Forklift aisle guardrail is missing a lower rail near the packaging lane.",
      },
      title: {
        value: "Guardrail repair required",
      },
      updated_at: {
        displayValue: "Apr 27, 2026",
        value: "2026-04-27",
      },
    },
    id: "obs-001",
    selectable: true,
  },
  {
    cells: {
      owner: {
        value: "A. Chen",
      },
      risk: {
        label: "Medium",
        tone: "warning",
        value: "medium",
      },
      site: {
        value: "Warehouse 4",
      },
      status: {
        label: "In review",
        tone: "info",
        value: "review",
      },
      summary: {
        value: "Temporary cable crossing needs a permanent cover before shift change.",
      },
      title: {
        value: "Cable crossing cover",
      },
      updated_at: {
        displayValue: "Apr 26, 2026",
        value: "2026-04-26",
      },
    },
    id: "obs-002",
    selectable: true,
  },
  {
    cells: {
      owner: {
        value: "J. Patel",
      },
      risk: {
        label: "Low",
        tone: "success",
        value: "low",
      },
      site: {
        value: "South Yard",
      },
      status: {
        label: "Closed",
        tone: "success",
        value: "closed",
      },
      summary: {
        value: "Spill kit was replenished and inspection photos were attached.",
      },
      title: {
        value: "Spill kit replenished",
      },
      updated_at: {
        displayValue: "Apr 25, 2026",
        value: "2026-04-25",
      },
    },
    id: "obs-003",
    selectable: true,
  },
];
