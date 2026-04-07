import { describe, expect, it } from "vitest";

import {
  getFormsAuthoringAccess,
  getFormsPlaceholderActor,
} from "../../src/features/platform-studio/forms/forms-actors";
import { getFormsPlaceholderObject } from "../../src/features/platform-studio/forms/forms-placeholder-data";

const lockedDelegatedModel = getFormsPlaceholderObject("customer-profile");
const editableOwnerOnlyModel = getFormsPlaceholderObject("site-audit");

if (!lockedDelegatedModel || !editableOwnerOnlyModel) {
  throw new Error("Expected forms placeholder models for permission tests.");
}

describe("platform builder forms actor access", () => {
  it("allows model owners to manage locked models and view actions", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("model-owner"),
      lockedDelegatedModel,
    );

    expect(access.canDeleteLockedModel).toBe(true);
    expect(access.canDeleteModel).toBe(true);
    expect(access.canDeleteView).toBe(true);
    expect(access.canManageStructure).toBe(true);
    expect(access.structureRestrictionKey).toBeNull();
  });

  it("blocks view-only editors from structure actions while keeping delegated view actions available", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("view-only-editor"),
      lockedDelegatedModel,
    );

    expect(access.canDeleteModel).toBe(false);
    expect(access.canDeleteView).toBe(true);
    expect(access.canManageStructure).toBe(false);
    expect(access.structureRestrictionKey).toBe("tenant.platformStudio.forms.permission.lockedModelOwnerOnly");
    expect(access.summaryKey).toBe("tenant.platformStudio.forms.canEditViewsOnly");
  });

  it("blocks view-only editors when a model does not grant view-only editing", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("view-only-editor"),
      editableOwnerOnlyModel,
    );

    expect(access.canEditViews).toBe(false);
    expect(access.canDeleteView).toBe(false);
    expect(access.summaryKey).toBe("tenant.platformStudio.forms.permissionSummary.viewAccessUnavailable");
    expect(access.viewRestrictionKey).toBe("tenant.platformStudio.forms.permission.viewAccessDisabled");
  });

  it("keeps readonly users able to open workspaces while blocking mutations", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("readonly-user"),
      lockedDelegatedModel,
    );

    expect(access.canOpenWorkspace).toBe(true);
    expect(access.canMutate).toBe(false);
    expect(access.canDeleteModel).toBe(false);
    expect(access.canDeleteView).toBe(false);
    expect(access.structureRestrictionKey).toBe("tenant.platformStudio.forms.permission.readonly");
    expect(access.viewRestrictionKey).toBe("tenant.platformStudio.forms.permission.readonly");
  });
});
