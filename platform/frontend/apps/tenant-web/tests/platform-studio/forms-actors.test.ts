import { describe, expect, it } from "vitest";

import {
  getFormsAuthoringAccess,
  getFormsPlaceholderActor,
} from "../../src/features/platform-studio/forms/forms-actors";
import {
  editableFormBuilderModel,
  lockedDelegatedFormBuilderModel,
} from "./forms-test-fixtures";

describe("platform builder forms actor access", () => {
  it("allows model owners to manage locked models and view actions", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("model-owner"),
      lockedDelegatedFormBuilderModel,
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
      lockedDelegatedFormBuilderModel,
    );

    expect(access.canDeleteModel).toBe(false);
    expect(access.canDeleteView).toBe(true);
    expect(access.canManageStructure).toBe(false);
    expect(access.structureRestrictionKey).toBe("tenant.platformStudio.forms.permission.lockedModelOwnerOnly");
    expect(access.summaryKey).toBe("tenant.platformStudio.forms.canEditViewsOnly");
  });

  it("allows tenant members to manage unlocked managed models", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("view-only-editor"),
      editableFormBuilderModel,
    );

    expect(access.canEditViews).toBe(true);
    expect(access.canDeleteModel).toBe(true);
    expect(access.canDeleteView).toBe(true);
    expect(access.canManageStructure).toBe(true);
    expect(access.summaryKey).toBe("tenant.platformStudio.forms.permissionSummary.manageAll");
    expect(access.structureRestrictionKey).toBeNull();
    expect(access.viewRestrictionKey).toBeNull();
  });

  it("keeps readonly users able to open workspaces while blocking mutations", () => {
    const access = getFormsAuthoringAccess(
      getFormsPlaceholderActor("readonly-user"),
      lockedDelegatedFormBuilderModel,
    );

    expect(access.canOpenWorkspace).toBe(true);
    expect(access.canMutate).toBe(false);
    expect(access.canDeleteModel).toBe(false);
    expect(access.canDeleteView).toBe(false);
    expect(access.structureRestrictionKey).toBe("tenant.platformStudio.forms.permission.readonly");
    expect(access.viewRestrictionKey).toBe("tenant.platformStudio.forms.permission.readonly");
  });
});
