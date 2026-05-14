import type { FormsAuthoringAccess } from "../forms-actors";
import type {
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import {
  getFormsPlaceholderFieldDisplayName,
  getFormsPlaceholderFieldIconKey,
  getFormsPlaceholderFieldSearchText,
} from "../forms-placeholder-data";
import {
  formBuilderElementDefinitions,
  formBuilderFieldDefinitions,
} from "../forms-builder-library";
import type {
  FormBuilderDocument,
  FormBuilderElementPaletteItem,
  FormBuilderFieldPaletteItem,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  getActiveFormBuilderScope,
  getAllowedChildNodeTypes,
  getFormBuilderChildren,
  getFormBuilderNode,
} from "./form-builder-selectors";

const formBuilderElementLabels: Record<Exclude<FormBuilderNodeType, "field">, string> = {
  accordion: "Accordion",
  accordion_item: "Accordion item",
  column: "Column",
  divider: "Divider",
  grid: "Grid layout",
  group: "Group",
  heading: "Heading",
  rich_text: "Rich text",
  section: "Section",
  spacer: "Spacer",
  subform: "Subform",
  tab_item: "Tab",
  tabs: "Tabs",
  text: "Text",
  view_only_field: "View-only field",
};

const checklistScopeElementTypes = new Set<FormBuilderNodeType>(["heading", "text"]);
const checklistScopeFieldIdBases = new Set(["date", "short-text", "single-select"]);

export function isFormBuilderContainer(type: FormBuilderNodeType) {
  return (
    type === "accordion" ||
    type === "accordion_item" ||
    type === "section" ||
    type === "group" ||
    type === "grid" ||
    type === "column" ||
    type === "tabs" ||
    type === "tab_item" ||
    type === "subform"
  );
}

export function getFormsWorkspaceAccess(
  access: FormsAuthoringAccess,
  object: FormsPlaceholderObject,
  screen?: FormsPlaceholderScreen | null,
): FormBuilderWorkspaceAccess {
  const viewLockedForActor = Boolean(screen?.isViewLocked) && !access.canEditViews;
  const structureReadOnlyForActor = Boolean(object.canEditViewsOnly) && !access.canManageStructure;
  const structureLockedForActor = object.isStructureLocked && !access.canManageStructure;
  const structureBlockedForActor = structureReadOnlyForActor || structureLockedForActor;
  const canEditSettings = access.canEditViews && !viewLockedForActor;
  const viewLockReasonKey = viewLockedForActor
    ? "tenant.platformStudio.forms.builder.lockedViewNotice"
    : (access.canEditViews
      ? null
      : (access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly"));
  const structureLockReasonKey = viewLockedForActor
    ? viewLockReasonKey
    : structureReadOnlyForActor
      ? access.structureRestrictionKey
      : structureLockedForActor
      ? "tenant.platformStudio.forms.builder.lockedStructureNotice"
      : access.structureRestrictionKey;

  return {
    canAddElementItems: canEditSettings,
    canAddFieldItems: canEditSettings && !structureBlockedForActor,
    canEditSettings,
    canMoveItems: canEditSettings,
    canRemoveItems: canEditSettings,
    lockReasonKey: viewLockReasonKey,
    structureLockReasonKey,
  };
}

export function getElementPaletteItems(
  document: FormBuilderDocument,
  access: FormBuilderWorkspaceAccess,
  searchTerm: string,
): ReadonlyArray<FormBuilderElementPaletteItem> {
  const activeScope = getActiveFormBuilderScope(document);
  const isChecklistScope = activeScope.scopeType === "SUBFORM" && activeScope.subformType === "CHECKLIST";
  const parentType =
    activeScope.uiSchema.currentParentId
      ? getFormBuilderNode(document, activeScope.uiSchema.currentParentId)?.type ?? null
      : (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const allowedTypes = new Set(getAllowedChildNodeTypes(parentType));
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return formBuilderElementDefinitions
    .filter((definition) => {
      if (isChecklistScope && !checklistScopeElementTypes.has(definition.nodeType)) {
        return false;
      }

      if (!allowedTypes.has(definition.nodeType)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return definition.searchTerms.some((term) => term.includes(normalizedSearch));
    })
    .map((definition) => ({
      ...definition,
      disabled: definition.initialNode?.subformType === "CHECKLIST"
        ? !access.canAddElementItems || !access.canAddFieldItems
        : !access.canAddElementItems,
      disabledReasonKey: definition.initialNode?.subformType === "CHECKLIST"
        ? (
            access.canAddElementItems && !access.canAddFieldItems
              ? access.structureLockReasonKey
              : access.lockReasonKey
          )
        : (access.canAddElementItems ? null : access.lockReasonKey),
      kind: "element",
    }));
}

export function getFieldPaletteItems(
  document: FormBuilderDocument,
  access: FormBuilderWorkspaceAccess,
  searchTerm: string,
): ReadonlyArray<FormBuilderFieldPaletteItem> {
  const activeScope = getActiveFormBuilderScope(document);
  const isChecklistScope = activeScope.scopeType === "SUBFORM" && activeScope.subformType === "CHECKLIST";
  const parentType =
    activeScope.uiSchema.currentParentId
      ? getFormBuilderNode(document, activeScope.uiSchema.currentParentId)?.type ?? null
      : (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const allowedTypes = new Set(getAllowedChildNodeTypes(parentType));
  if (!allowedTypes.has("field")) {
    return [];
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  return formBuilderFieldDefinitions
    .filter((definition) =>
      (!isChecklistScope || checklistScopeFieldIdBases.has(definition.idBase))
      && (!normalizedSearch || getFormsPlaceholderFieldSearchText({ ...definition.template, id: definition.idBase }).includes(normalizedSearch)),
    )
    .map((definition) => ({
      category: definition.section,
      descriptionKey: "tenant.platformStudio.forms.builder.palette.fieldDescription",
      definition,
      disabled: !access.canAddFieldItems,
      disabledReasonKey: access.canAddFieldItems ? null : access.structureLockReasonKey,
      iconKey: getFormsPlaceholderFieldIconKey({ ...definition.template, id: definition.idBase }),
      kind: "field" as const,
    }));
}

export function getFormBuilderDisplayLabel(
  node: FormBuilderNode,
  object: FormsPlaceholderObject,
) {
  if (node.type === "field") {
    const field = object.fields.find((entry) => entry.id === node.fieldId);
    return node.title || (field ? getFormsPlaceholderFieldDisplayName(field) : null) || "Field";
  }

  if (node.type === "text") {
    return node.title || "Text";
  }

  return node.title || formBuilderElementLabels[node.type];
}

export function getFormBuilderNodeSummary(
  node: FormBuilderNode,
  document: FormBuilderDocument,
  object: FormsPlaceholderObject,
) {
  if (node.type === "field") {
    const field = object.fields.find((entry) => entry.id === node.fieldId);
    return field?.isLocked
      ? "tenant.platformStudio.forms.builder.summary.fieldLocked"
      : "tenant.platformStudio.forms.builder.summary.field";
  }

  if (node.type === "heading") {
    return "tenant.platformStudio.forms.builder.summary.heading";
  }

  if (node.type === "text") {
    return "tenant.platformStudio.forms.builder.summary.text";
  }

  if (node.type === "rich_text") {
    return "tenant.platformStudio.forms.builder.summary.richText";
  }

  if (node.type === "view_only_field") {
    return node.viewOnlyBinding
      ? "tenant.platformStudio.forms.builder.summary.viewOnlyField"
      : "tenant.platformStudio.forms.builder.summary.viewOnlyFieldEmpty";
  }

  if (node.type === "divider") {
    return "tenant.platformStudio.forms.builder.summary.divider";
  }

  if (node.type === "spacer") {
    return "tenant.platformStudio.forms.builder.summary.spacer";
  }

  const children = getFormBuilderChildren(document, node.id);
  if (children.length > 0) {
    return "tenant.platformStudio.forms.builder.summary.children";
  }

  return "tenant.platformStudio.forms.builder.summary.emptyContainer";
}
