import type {
  FormsPlaceholderModel,
  FormsPlaceholderView,
} from "./forms-placeholder-data";
import type { TenantWorkspaceUserSession } from "../../../app/tenant-workspace-user-session";

export type FormsActorRole = "schemaOwner" | "viewEditor" | "readonly";

export type FormsAuthoringActor = {
  id: string;
  isRoot: boolean;
  level: number;
  role: FormsActorRole;
  userRole: string;
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

export const formsPlaceholderActors: ReadonlyArray<FormsAuthoringActor> = [
  {
    id: "model-owner",
    isRoot: true,
    level: 100,
    role: "schemaOwner",
    userRole: "root",
  },
  {
    id: "view-only-editor",
    isRoot: false,
    level: 20,
    role: "viewEditor",
    userRole: "member",
  },
  {
    id: "readonly-user",
    isRoot: false,
    level: 0,
    role: "readonly",
    userRole: "readonly",
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

export function getFormsAuthoringActor(
  session: Pick<TenantWorkspaceUserSession, "isRoot" | "level" | "role"> | null | undefined,
): FormsAuthoringActor {
  const level = typeof session?.level === "number" && Number.isFinite(session.level)
    ? Math.trunc(session.level)
    : 0;
  const isRoot = level === 100 || Boolean(session?.isRoot);
  const userRole = session?.role?.trim() || "";

  if (isRoot) {
    return {
      id: "root-user",
      isRoot: true,
      level,
      role: "schemaOwner",
      userRole,
    };
  }

  return {
    id: level > 0 ? "tenant-member" : "readonly-user",
    isRoot: false,
    level,
    role: level > 0 ? "viewEditor" : "readonly",
    userRole,
  };
}

export function getFormsAuthoringAccess(
  actor: FormsAuthoringActor,
  model?: FormsPlaceholderModel | null,
  view?: FormsPlaceholderView | null,
): FormsAuthoringAccess {
  const isRootActor = actor.isRoot;
  const isReadonlyUser = actor.role === "readonly";
  const viewLockedForActor = Boolean(view?.isViewLocked) && !isRootActor;
  const structureLockedForActor = Boolean(model?.isStructureLocked) && !isRootActor;
  const canManageStructure = !isReadonlyUser && !viewLockedForActor && !structureLockedForActor;
  const canEditViews = !isReadonlyUser && !viewLockedForActor;

  let summaryKey = "tenant.platformStudio.forms.permissionSummary.manageAll";
  let summaryVariant: FormsPermissionSummaryVariant = "brand";

  if (isReadonlyUser) {
    summaryKey = "tenant.platformStudio.forms.permissionSummary.readonly";
    summaryVariant = "neutral";
  } else if (viewLockedForActor) {
    summaryKey = "tenant.platformStudio.forms.permissionSummary.viewLocked";
    summaryVariant = "warning";
  } else if (structureLockedForActor) {
    summaryKey = "tenant.platformStudio.forms.canEditViewsOnly";
    summaryVariant = "info";
  }

  let structureRestrictionKey: string | null = null;
  if (!canManageStructure) {
    structureRestrictionKey = isReadonlyUser
      ? "tenant.platformStudio.forms.permission.readonly"
      : structureLockedForActor
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
    canDeleteLockedModel: isRootActor,
    canDeleteModel: canManageStructure,
    canDeleteView: canEditViews,
    canEditViews,
    canManageStructure,
    canMutate: canManageStructure || canEditViews,
    canOpenWorkspace: !viewLockedForActor,
    structureRestrictionKey,
    summaryKey,
    summaryVariant,
    viewRestrictionKey,
  };
}
