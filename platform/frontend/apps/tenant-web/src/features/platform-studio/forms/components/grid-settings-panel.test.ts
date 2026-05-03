import { describe, expect, it } from "vitest";

import {
  getFilteredGridSettingsFieldItems,
  type GridSettingsFieldItem,
} from "./grid-settings-panel";

const fieldItems: ReadonlyArray<GridSettingsFieldItem> = [
  {
    iconKey: "short_text",
    id: "site_name",
    label: "Site name",
    visible: true,
  },
  {
    iconKey: "short_text",
    id: "internal_notes",
    label: "Internal notes",
    visible: false,
  },
  {
    iconKey: "date",
    id: "reported_date",
    label: "Reported date",
    visible: true,
  },
];

describe("GridSettingsPanel", () => {
  it("filters the Grid field list to visible columns only when requested", () => {
    expect(getFilteredGridSettingsFieldItems(fieldItems, false).map((field) => field.id))
      .toEqual(["site_name", "internal_notes", "reported_date"]);
    expect(getFilteredGridSettingsFieldItems(fieldItems, true).map((field) => field.id))
      .toEqual(["site_name", "reported_date"]);
  });
});
