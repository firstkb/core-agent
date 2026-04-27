import {
  updateFormBuilderNode,
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { cycleNodeVisibility } from "./form-builder-workspace-normalization-helpers";

export function applyCanvasNodeVisibilityCycleUpdate(
  document: FormBuilderDocument,
  nodeId: string,
  visibility: FormBuilderNode["visibility"],
) {
  return updateFormBuilderNode(document, nodeId, {
    visibility: cycleNodeVisibility(visibility),
  });
}
