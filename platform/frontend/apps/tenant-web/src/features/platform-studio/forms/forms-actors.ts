import type {
  FormsPlaceholderModel,
  FormsPlaceholderView,
} from "./forms-placeholder-data";

export type FormsActorRole = "schemaOwner" | "viewEditor" | "readonly";

export type FormsPlaceholderActor = {
  id: string;
  role: FormsActorRole;
};

type FormsPermissionSummaryVariant = "brand" | "info" | "neutral" | "warning";

export type FormsAuthoringAccess = {
  canCopyView: boolean;
  canDeleteLockedModel: boolean;
  canDeleteModel: boolean;
  canDeleteView: boolean;
  canEditViews: boolean;
  canManageStructure: boolean;
  canMutate: boolean;
  canOpenWorkspace: boolean;
  structureRestrictionKey: string | null;
  summaryKey: string;
  summaryVariant: FormsPermissionSummaryVariant;
  viewRestrictionKey: string | null;
};

export const formsPlaceholderActors: ReadonlyArray<FormsPlaceholderActor> = [
  {
    id: "model-owner",
    role: "schemaOwner",
  },
  {
    id: "view-only-editor",
    role: "viewEditor",
  },
  {
    id: "readonly-user",
    role: "readonly",
  },
] as const;

function getDefaultFormsActor() {
  return formsPlaceholderActors[0];
}

export function getFormsPlaceholderActor(actorId: string | undefined) {
  if (!actorId) {
    return getDefaultFormsActor();
  }

  return formsPlaceholderActors.find((actor) => actor.id === actorId) ?? getDefaultFormsActor();
}

export function getFormsAuthoringAccess(
  actor: FormsPlaceholderActor,
  model?: FormsPlaceholderModel | null,
  view?: FormsPlaceholderView | null,
): FormsAuthoringAccess {
  const isModelOwner = actor.role === "schemaOwner";
  const isReadonlyUser = actor.role === "readonly";
  const modelAllowsViewOnlyEditing = model?.canEditViewsOnly ?? true;
  const viewLockedForActor = Boolean(view?.isViewLocked) && !isModelOwner;
  const canManageStructure = isModelOwner;
  const canEditViews = (isModelOwner || (actor.role === "viewEditor" && modelAllowsViewOnlyEditing)) && !viewLockedForActor;

  let summaryKey = "tenant.platformStudio.forms.permissionSummary.manageAll";
  let summaryVariant: FormsPermissionSummaryVariant = "brand";

  if (isReadonlyUser) {
    summaryKey = "tenant.platformStudio.forms.permissionSummary.readonly";
    summaryVariant = "neutral";
  } else if (viewLockedForActor) {
    summaryKey = "tenant.platformStudio.forms.permissionSummary.viewLocked";
    summaryVariant = "warning";
  } else if (!canEditViews) {
    summaryKey = "tenant.platformStudio.forms.permissionSummary.viewAccessUnavailable";
    summaryVariant = "warning";
  } else if (!canManageStructure) {
    summaryKey = "tenant.platformStudio.forms.canEditViewsOnly";
    summaryVariant = "info";
  }

  let structureRestrictionKey: string | null = null;
  if (!canManageStructure) {
    structureRestrictionKey = isReadonlyUser
      ? "tenant.platformStudio.forms.permission.readonly"
      : model?.isStructureLocked
        ? "tenant.platformStudio.forms.permission.lockedModelOwnerOnly"
        : "tenant.platformStudio.forms.permission.ownerOnlyStructure";
  }

  let viewRestrictionKey: string | null = null;
  if (!canEditViews) {
    viewRestrictionKey = isReadonlyUser
      ? "tenant.platformStudio.forms.permission.readonly"
      : viewLockedForActor
        ? "tenant.platformStudio.forms.permission.viewLocked"
        : "tenant.platformStudio.forms.permission.viewAccessDisabled";
  }

  return {
    canCopyView: canEditViews,
    canDeleteLockedModel: isModelOwner,
    canDeleteModel: canManageStructure,
    canDeleteView: canEditViews,
    canEditViews,
    canManageStructure,
    canMutate: canManageStructure || canEditViews,
    canOpenWorkspace: true,
    structureRestrictionKey,
    summaryKey,
    summaryVariant,
    viewRestrictionKey,
  };
}
