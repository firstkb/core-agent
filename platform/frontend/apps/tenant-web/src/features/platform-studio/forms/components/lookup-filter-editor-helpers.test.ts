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

  it("keeps company lookup view filters to user company switches", () => {
    expect(getLookupClauseDefinitions("company_lookup")).toEqual([
      {
        clauseKey: "business_unit_is_user_company",
        defaultValue: false,
        valueMode: "boolean_flag",
      },
      {
        clauseKey: "main_company_is_user_company",
        defaultValue: false,
        valueMode: "boolean_flag",
      },
    ]);
  });

  it("keeps project lookup view filters to project access switch", () => {
    expect(getLookupClauseDefinitions("project_lookup")).toEqual([
      {
        clauseKey: "project_in_user_access",
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

  it("drops legacy company lookup clauses and inactive switch clauses", () => {
    expect(sanitizeLookupFilterCondition({
      clauses: [
        {
          clauseKey: "business_unit_type",
          id: "legacy-business-unit-type",
          value: "division",
          valueMode: "literal",
        },
        {
          clauseKey: "business_unit_is_user_company",
          id: "inactive-business-unit",
          value: false,
          valueMode: "boolean_flag",
        },
        {
          clauseKey: "main_company_is_user_company",
          id: "main-company",
          value: true,
          valueMode: "boolean_flag",
        },
      ],
      editorType: "lookup",
      fieldId: "company",
      lookupPreset: "company_lookup",
    })).toMatchObject({
      clauses: [
        {
          clauseKey: "main_company_is_user_company",
          id: "main-company",
          value: true,
          valueMode: "boolean_flag",
        },
      ],
    });
  });

  it("drops legacy project lookup clauses and inactive switch clauses", () => {
    expect(sanitizeLookupFilterCondition({
      clauses: [
        {
          clauseKey: "business_unit_id",
          id: "legacy-business-unit",
          value: "roofing",
          valueMode: "literal",
        },
        {
          clauseKey: "assigned_projects",
          dynamicToken: "assigned_projects",
          id: "legacy-assigned-projects",
          valueMode: "dynamic_token",
        },
        {
          clauseKey: "project_in_user_access",
          id: "inactive-project-access",
          value: false,
          valueMode: "boolean_flag",
        },
      ],
      editorType: "lookup",
      fieldId: "project",
      lookupPreset: "project_lookup",
    })).toMatchObject({
      clauses: [],
    });

    expect(sanitizeLookupFilterCondition({
      clauses: [
        {
          clauseKey: "project_in_user_access",
          id: "project-access",
          value: true,
          valueMode: "boolean_flag",
        },
      ],
      editorType: "lookup",
      fieldId: "project",
      lookupPreset: "project_lookup",
    })).toMatchObject({
      clauses: [
        {
          clauseKey: "project_in_user_access",
          id: "project-access",
          value: true,
          valueMode: "boolean_flag",
        },
      ],
    });
  });
});
