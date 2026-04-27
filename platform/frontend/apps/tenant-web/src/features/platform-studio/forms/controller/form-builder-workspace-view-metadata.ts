import { type FormBuilderDocument } from "../forms-builder-state";
import {
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";

export function applyModelStructureLockedUpdate(
  model: FormsPlaceholderModel,
  isStructureLocked: boolean,
) {
  return {
    ...model,
    isStructureLocked,
  };
}

export function applyViewActiveUpdate(
  view: FormsPlaceholderView,
  isActive: boolean,
) {
  return {
    ...view,
    isActive,
  };
}

export function applyViewLockedUpdate(
  view: FormsPlaceholderView,
  isViewLocked: boolean,
) {
  return {
    ...view,
    isViewLocked,
  };
}

export function applyDocumentViewDescriptionUpdate(
  document: FormBuilderDocument,
  viewDescription: string,
) {
  return {
    ...document,
    viewDescription,
  };
}

export function applyDocumentViewTitleUpdate(
  document: FormBuilderDocument,
  viewTitle: string,
) {
  return {
    ...document,
    viewTitle,
  };
}
