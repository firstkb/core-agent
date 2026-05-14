import { type FormBuilderNode } from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";

type DeleteNodeConfirmationAction =
  | {
      kind: "delete-unsaved-field";
      fieldId: string;
      nodeId: string;
    }
  | {
      kind: "noop";
    }
  | {
      kind: "remove-node";
      nodeId: string;
    };

export function getDeleteNodeConfirmationAction({
  isSelectedFieldLocked,
  isSelectedFieldPersisted,
  selectedField,
  selectedNode,
}: {
  isSelectedFieldLocked: boolean;
  isSelectedFieldPersisted: boolean;
  selectedField: Pick<FormsPlaceholderField, "id"> | null;
  selectedNode: Pick<FormBuilderNode, "id" | "type"> | null;
}): DeleteNodeConfirmationAction {
  if (!selectedNode) {
    return { kind: "noop" };
  }

  if (selectedNode.type === "field" && isSelectedFieldLocked) {
    return { kind: "noop" };
  }

  if (selectedNode.type === "field" && selectedField && !isSelectedFieldPersisted) {
    return {
      fieldId: selectedField.id,
      kind: "delete-unsaved-field",
      nodeId: selectedNode.id,
    };
  }

  return {
    kind: "remove-node",
    nodeId: selectedNode.id,
  };
}
