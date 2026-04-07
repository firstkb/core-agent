import { useSyncExternalStore } from "react";

import type {
  ChildCollectionDefinition,
  DraftSnapshot,
  EntityDefinition,
  FieldDefinition,
  PolicySet,
  RelationDefinition,
  SemanticRoleBinding,
  VisibilityPolicyMode,
  VisibilityRecipientAssignments,
  ViewDefinition,
  WorkflowDefinition,
  WorkflowStatusDefinition,
  WorkflowTransitionDefinition,
} from "@platform/platform-studio-core";

import { builderDraftSeed } from "./builder-draft-seed";

export type BuilderDraftStatus = "empty" | "ready";

export type BuilderDraftState = {
  draft: DraftSnapshot | null;
  status: BuilderDraftStatus;
};

export type BuilderRegistrySummary = {
  childCollectionCount: number;
  entityCount: number;
  fieldCount: number;
  navigationNodeCount: number;
  policyCount: number;
  relationCount: number;
  validationState: "attention" | "valid";
  viewCount: number;
  workflowCount: number;
};

export type BuilderEntitySummary = {
  childCollectionCount: number;
  entity: EntityDefinition;
  fieldCount: number;
  incomingRelationCount: number;
  semanticRoleLabels: string[];
  viewCount: number;
  workflowCount: number;
};

export type BuilderEntityDetail = {
  childCollections: ChildCollectionDefinition[];
  entity: EntityDefinition;
  fields: FieldDefinition[];
  incomingRelations: RelationDefinition[];
  semanticRoles: SemanticRoleBinding[];
  views: ViewDefinition[];
  workflows: WorkflowDefinition[];
};

export type BuilderEntityMetadataInput = Pick<EntityDefinition, "description" | "name" | "pluralName">;

export type BuilderWorkflowMetadataInput = Pick<WorkflowDefinition, "name"> & {
  statuses: Array<Pick<WorkflowStatusDefinition, "id" | "label">>;
  transitions: Array<Pick<WorkflowTransitionDefinition, "id" | "label">>;
};

export type BuilderViewSummary = {
  entity: EntityDefinition | null;
  nodeCount: number;
  view: ViewDefinition;
};

export type BuilderViewDetail = {
  entity: EntityDefinition | null;
  view: ViewDefinition;
};

export type BuilderPolicyVisibilityKind = "generic" | "none" | "page";

export type BuilderPolicyVisibilityUpdate =
  | {
    kind: "none";
  }
  | {
    assignments?: VisibilityRecipientAssignments;
    kind: "generic";
  }
  | {
    assignments?: VisibilityRecipientAssignments;
    kind: "page";
    mode: VisibilityPolicyMode;
  };

const listeners = new Set<() => void>();
let currentDraftState = createBuilderDraftState(builderDraftSeed);

const visibilityRecipientAssignmentKeys = [
  "companyIds",
  "contactIds",
  "jobTypeIds",
] satisfies Array<keyof VisibilityRecipientAssignments>;

function getEntityMap(draft: DraftSnapshot) {
  return new Map(draft.entities.map((entity) => [entity.id, entity]));
}

function getSemanticRoleLabels(bindings: SemanticRoleBinding[]) {
  return bindings.map((binding) => binding.role).sort();
}

function normalizeBuilderOptionalText(value?: string) {
  const nextValue = value?.trim();

  return nextValue && nextValue.length > 0 ? nextValue : undefined;
}

export function normalizeBuilderWorkflowMetadata(
  metadata: BuilderWorkflowMetadataInput,
): BuilderWorkflowMetadataInput {
  return {
    name: metadata.name.trim(),
    statuses: metadata.statuses.map((status) => ({
      id: status.id,
      label: status.label.trim(),
    })),
    transitions: metadata.transitions.map((transition) => ({
      id: transition.id,
      label: transition.label.trim(),
    })),
  };
}

export function serializeBuilderWorkflowMetadata(
  metadata: BuilderWorkflowMetadataInput,
) {
  return JSON.stringify(normalizeBuilderWorkflowMetadata(metadata));
}

export function createBuilderDraftState(draft: DraftSnapshot | null): BuilderDraftState {
  return {
    draft,
    status: draft && draft.entities.length > 0 ? "ready" : "empty",
  };
}

export function subscribeToBuilderDraft(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getBuilderDraftState() {
  return currentDraftState;
}

export function setBuilderDraft(nextDraft: DraftSnapshot | null) {
  currentDraftState = createBuilderDraftState(nextDraft);
  listeners.forEach((listener) => listener());
}

function normalizeBuilderIds(ids?: readonly string[]) {
  const nextIds = [...new Set(
    (ids ?? [])
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  )].sort();

  return nextIds.length > 0 ? nextIds : undefined;
}

function normalizeVisibilityAssignments(
  assignments?: VisibilityRecipientAssignments,
): VisibilityRecipientAssignments | undefined {
  const nextAssignments: VisibilityRecipientAssignments = {};

  visibilityRecipientAssignmentKeys.forEach((key) => {
    const ids = normalizeBuilderIds(assignments?.[key]);

    if (ids) {
      nextAssignments[key] = ids;
    }
  });

  return Object.keys(nextAssignments).length > 0 ? nextAssignments : undefined;
}

function buildPolicyVisibility(
  visibility: BuilderPolicyVisibilityUpdate,
): PolicySet["visibility"] {
  if (visibility.kind === "none") {
    return undefined;
  }

  const assignments = normalizeVisibilityAssignments(visibility.assignments);

  if (visibility.kind === "page") {
    return assignments ? { assignments, mode: visibility.mode } : { mode: visibility.mode };
  }

  return assignments ? { assignments } : {};
}

function serializePolicyVisibility(visibility: PolicySet["visibility"]) {
  return JSON.stringify(visibility ?? null);
}

function cloneBuilderViewSnapshot(view: ViewDefinition): ViewDefinition {
  return {
    ...view,
    nodes: view.nodes.map((node) => {
      switch (node.kind) {
        case "group":
        case "section":
        case "tab":
          return {
            ...node,
            slots: {
              body: [...node.slots.body],
            },
          };
        case "tabs":
          return {
            ...node,
            slots: {
              tabs: [...node.slots.tabs],
            },
          };
        default:
          return {
            ...node,
          };
      }
    }),
  };
}

export function updateBuilderDraftPolicyVisibility(
  draft: DraftSnapshot,
  policyId: string,
  visibility: BuilderPolicyVisibilityUpdate,
): DraftSnapshot {
  const nextVisibility = buildPolicyVisibility(visibility);
  const serializedNextVisibility = serializePolicyVisibility(nextVisibility);
  let didUpdate = false;

  const nextPolicies = draft.policies.map((policy) => {
    if (policy.id !== policyId) {
      return policy;
    }

    if (serializePolicyVisibility(policy.visibility) === serializedNextVisibility) {
      return policy;
    }

    didUpdate = true;

    return {
      ...policy,
      visibility: nextVisibility,
    };
  });

  if (!didUpdate) {
    return draft;
  }

  return {
    ...draft,
    policies: nextPolicies,
    updatedAt: new Date().toISOString(),
  };
}

export function setBuilderDraftPolicyVisibility(
  policyId: string,
  visibility: BuilderPolicyVisibilityUpdate,
) {
  if (!currentDraftState.draft) {
    return false;
  }

  const nextDraft = updateBuilderDraftPolicyVisibility(
    currentDraftState.draft,
    policyId,
    visibility,
  );

  if (nextDraft === currentDraftState.draft) {
    return false;
  }

  setBuilderDraft(nextDraft);

  return true;
}

export function useBuilderDraftStore() {
  return useSyncExternalStore(
    subscribeToBuilderDraft,
    getBuilderDraftState,
    getBuilderDraftState,
  );
}

export function buildBuilderRegistrySummary(draft: DraftSnapshot): BuilderRegistrySummary {
  return {
    childCollectionCount: draft.childCollections.length,
    entityCount: draft.entities.length,
    fieldCount: draft.fields.length,
    navigationNodeCount: draft.navigationNodes.length,
    policyCount: draft.policies.length,
    relationCount: draft.relations.length,
    validationState: draft.lastValidationReport?.valid === false ? "attention" : "valid",
    viewCount: draft.views.length,
    workflowCount: draft.workflows.length,
  };
}

export function getBuilderEntitySummaries(draft: DraftSnapshot): BuilderEntitySummary[] {
  return draft.entities
    .map((entity) => {
      const fields = draft.fields.filter((field) => field.entityId === entity.id);
      const incomingRelations = draft.relations.filter((relation) => relation.targetEntityId === entity.id);
      const semanticRoles = draft.semanticRoles.filter((binding) => binding.entityId === entity.id);
      const views = draft.views.filter((view) => view.entityId === entity.id);
      const workflows = draft.workflows.filter((workflow) => workflow.entityId === entity.id);
      const childCollections = draft.childCollections.filter((collection) => collection.parentEntityId === entity.id);

      return {
        childCollectionCount: childCollections.length,
        entity,
        fieldCount: fields.length,
        incomingRelationCount: incomingRelations.length,
        semanticRoleLabels: getSemanticRoleLabels(semanticRoles),
        viewCount: views.length,
        workflowCount: workflows.length,
      };
    })
    .sort((left, right) => left.entity.name.localeCompare(right.entity.name));
}

export function getBuilderEntityDetail(draft: DraftSnapshot, entityId: string): BuilderEntityDetail | null {
  const entity = draft.entities.find((candidate) => candidate.id === entityId);
  if (!entity) {
    return null;
  }

  return {
    childCollections: draft.childCollections.filter((collection) => collection.parentEntityId === entity.id),
    entity,
    fields: draft.fields.filter((field) => field.entityId === entity.id),
    incomingRelations: draft.relations.filter((relation) => relation.targetEntityId === entity.id),
    semanticRoles: draft.semanticRoles.filter((binding) => binding.entityId === entity.id),
    views: draft.views.filter((view) => view.entityId === entity.id),
    workflows: draft.workflows.filter((workflow) => workflow.entityId === entity.id),
  };
}

export function normalizeBuilderEntityMetadata(
  metadata: BuilderEntityMetadataInput,
): BuilderEntityMetadataInput {
  return {
    description: normalizeBuilderOptionalText(metadata.description),
    name: metadata.name.trim(),
    pluralName: normalizeBuilderOptionalText(metadata.pluralName),
  };
}

export function serializeBuilderEntityMetadata(
  metadata: BuilderEntityMetadataInput,
) {
  return JSON.stringify(normalizeBuilderEntityMetadata(metadata));
}

export function updateBuilderDraftEntityMetadata(
  draft: DraftSnapshot,
  entityId: string,
  metadata: BuilderEntityMetadataInput,
): DraftSnapshot {
  const nextMetadata = normalizeBuilderEntityMetadata(metadata);

  if (nextMetadata.name.length === 0) {
    return draft;
  }

  const serializedNextMetadata = serializeBuilderEntityMetadata(nextMetadata);
  let didUpdate = false;

  const nextEntities = draft.entities.map((entity) => {
    if (entity.id !== entityId) {
      return entity;
    }

    if (serializeBuilderEntityMetadata(entity) === serializedNextMetadata) {
      return entity;
    }

    didUpdate = true;

    return {
      ...entity,
      description: nextMetadata.description,
      name: nextMetadata.name,
      pluralName: nextMetadata.pluralName,
    };
  });

  if (!didUpdate) {
    return draft;
  }

  return {
    ...draft,
    entities: nextEntities,
    updatedAt: new Date().toISOString(),
  };
}

export function setBuilderDraftEntityMetadata(
  entityId: string,
  metadata: BuilderEntityMetadataInput,
) {
  if (!currentDraftState.draft) {
    return false;
  }

  const nextDraft = updateBuilderDraftEntityMetadata(
    currentDraftState.draft,
    entityId,
    metadata,
  );

  if (nextDraft === currentDraftState.draft) {
    return false;
  }

  setBuilderDraft(nextDraft);

  return true;
}

export function updateBuilderDraftWorkflowMetadata(
  draft: DraftSnapshot,
  workflowId: string,
  metadata: BuilderWorkflowMetadataInput,
): DraftSnapshot {
  const nextMetadata = normalizeBuilderWorkflowMetadata(metadata);

  if (
    nextMetadata.name.length === 0
    || nextMetadata.statuses.some((status) => status.label.length === 0)
    || nextMetadata.transitions.some((transition) => transition.label.length === 0)
  ) {
    return draft;
  }

  const statusLabelMap = new Map(
    nextMetadata.statuses.map((status) => [status.id, status.label]),
  );
  const transitionLabelMap = new Map(
    nextMetadata.transitions.map((transition) => [transition.id, transition.label]),
  );
  let didUpdate = false;

  const nextWorkflows = draft.workflows.map((workflow) => {
    if (workflow.id !== workflowId) {
      return workflow;
    }

    let didUpdateStatus = false;
    const nextStatuses = workflow.statuses.map((status) => {
      const nextLabel = statusLabelMap.get(status.id);

      if (nextLabel === undefined || nextLabel === status.label) {
        return status;
      }

      didUpdateStatus = true;

      return {
        ...status,
        label: nextLabel,
      };
    });

    let didUpdateTransition = false;
    const nextTransitions = workflow.transitions.map((transition) => {
      const nextLabel = transitionLabelMap.get(transition.id);

      if (nextLabel === undefined || nextLabel === transition.label) {
        return transition;
      }

      didUpdateTransition = true;

      return {
        ...transition,
        label: nextLabel,
      };
    });

    if (
      workflow.name === nextMetadata.name
      && !didUpdateStatus
      && !didUpdateTransition
    ) {
      return workflow;
    }

    didUpdate = true;

    return {
      ...workflow,
      name: nextMetadata.name,
      statuses: didUpdateStatus ? nextStatuses : workflow.statuses,
      transitions: didUpdateTransition ? nextTransitions : workflow.transitions,
    };
  });

  if (!didUpdate) {
    return draft;
  }

  return {
    ...draft,
    updatedAt: new Date().toISOString(),
    workflows: nextWorkflows,
  };
}

export function setBuilderDraftWorkflowMetadata(
  workflowId: string,
  metadata: BuilderWorkflowMetadataInput,
) {
  if (!currentDraftState.draft) {
    return false;
  }

  const nextDraft = updateBuilderDraftWorkflowMetadata(
    currentDraftState.draft,
    workflowId,
    metadata,
  );

  if (nextDraft === currentDraftState.draft) {
    return false;
  }

  setBuilderDraft(nextDraft);

  return true;
}

export function getBuilderViewSummaries(draft: DraftSnapshot): BuilderViewSummary[] {
  const entityMap = getEntityMap(draft);

  return draft.views
    .map((view) => ({
      entity: entityMap.get(view.entityId) ?? null,
      nodeCount: view.nodes.length,
      view,
    }))
    .sort((left, right) => left.view.title.localeCompare(right.view.title));
}

export function getBuilderViewDetail(draft: DraftSnapshot, viewId: string): BuilderViewDetail | null {
  const view = draft.views.find((candidate) => candidate.id === viewId);
  if (!view) {
    return null;
  }

  return {
    entity: getEntityMap(draft).get(view.entityId) ?? null,
    view,
  };
}

export function resolveBuilderAuthoringViewId(
  draft: DraftSnapshot,
  preferredViewId?: string,
): string | null {
  if (preferredViewId && draft.views.some((view) => view.id === preferredViewId)) {
    return preferredViewId;
  }

  const defaultViewId = draft.views.find((view) => view.isDefault)?.id;

  if (defaultViewId) {
    return defaultViewId;
  }

  return getBuilderViewSummaries(draft)[0]?.view.id ?? null;
}

function serializeBuilderView(view: ViewDefinition) {
  return JSON.stringify(view);
}

export function updateBuilderDraftView(
  draft: DraftSnapshot,
  nextView: ViewDefinition,
): DraftSnapshot {
  let didUpdate = false;

  const nextViews = draft.views.map((view) => {
    if (view.id !== nextView.id) {
      return view;
    }

    if (serializeBuilderView(view) === serializeBuilderView(nextView)) {
      return view;
    }

    didUpdate = true;

    return cloneBuilderViewSnapshot(nextView);
  });

  if (!didUpdate) {
    return draft;
  }

  return {
    ...draft,
    updatedAt: new Date().toISOString(),
    views: nextViews,
  };
}

export function setBuilderDraftView(nextView: ViewDefinition) {
  if (!currentDraftState.draft) {
    return false;
  }

  const nextDraft = updateBuilderDraftView(currentDraftState.draft, nextView);

  if (nextDraft === currentDraftState.draft) {
    return false;
  }

  setBuilderDraft(nextDraft);

  return true;
}
