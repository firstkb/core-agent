import { describe, expect, it } from "vitest";

import {
  getLookupClauseDefinitions,
  sanitizeLookupFilterCondition,
} from "./lookup-filter-editor-helpers";

describe("lookup filter editor helpers", () => {
  it("keeps contact lookup view filters to user account and user company switches", () => {
    expect(getLookupClauseDefinitions("contact_lookup")).toEqual([
      {
        clauseKey: "active_account",
        defaultValue: false,
        valueMode: "boolean_flag",
      },
      {
        clauseKey: "by_user_company",
        defaultValue: false,
        valueMode: "boolean_flag",
      },
    ]);
  });

  it("drops legacy Contact Job Type clauses and inactive switch clauses", () => {
    expect(sanitizeLookupFilterCondition({
      clauses: [
        {
          clauseKey: "contact_job_title",
          id: "legacy-job-title",
          value: "manager",
          valueMode: "literal",
        },
        {
          clauseKey: "active_account",
          dynamicToken: "current_user_id",
          id: "legacy-active-account",
          valueMode: "dynamic_token",
        },
        {
          clauseKey: "by_user_company",
          id: "by-company",
          value: true,
          valueMode: "boolean_flag",
        },
      ],
      editorType: "lookup",
      fieldId: "contact",
      lookupPreset: "contact_lookup",
    })).toMatchObject({
      clauses: [
        {
          clauseKey: "by_user_company",
          id: "by-company",
          value: true,
          valueMode: "boolean_flag",
        },
      ],
    });
  });
});
