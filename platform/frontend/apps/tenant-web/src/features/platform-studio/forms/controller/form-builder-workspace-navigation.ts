import {
  getActiveFormBuilderScope,
  getFormBuilderNode,
  selectFormBuilderNode,
  setFormBuilderCurrentParent,
  type FormBuilderDocument,
} from "../forms-builder-state";

function getRestorableParentId(
  nextDocument: FormBuilderDocument,
  previousDocument: FormBuilderDocument,
) {
  const previousScope = getActiveFormBuilderScope(previousDocument);

  if (previousScope.scopeType === "SUBFORM") {
    const previousParentId = previousScope.uiSchema.currentParentId ?? previousScope.parentSubformNodeId;

    return getFormBuilderNode(nextDocument, previousParentId)
      ? previousParentId
      : null;
  }

  const previousParentId = previousScope.uiSchema.currentParentId;
  if (!previousParentId) {
    return null;
  }

  return getFormBuilderNode(nextDocument, previousParentId)
    ? previousParentId
    : null;
}

export function preserveFormBuilderWorkspaceNavigation(
  nextDocument: FormBuilderDocument,
  previousDocument: FormBuilderDocument,
) {
  const previousScope = getActiveFormBuilderScope(previousDocument);
  const parentId = getRestorableParentId(nextDocument, previousDocument);
  let restoredDocument = parentId
    ? setFormBuilderCurrentParent(nextDocument, parentId)
    : setFormBuilderCurrentParent(nextDocument, null);
  const previousSelectedNodeId = previousScope.uiSchema.selectedNodeId;

  if (previousSelectedNodeId && getFormBuilderNode(restoredDocument, previousSelectedNodeId)) {
    restoredDocument = selectFormBuilderNode(restoredDocument, previousSelectedNodeId);
  } else if (!previousSelectedNodeId) {
    restoredDocument = selectFormBuilderNode(restoredDocument, null);
  }

  return restoredDocument;
}
