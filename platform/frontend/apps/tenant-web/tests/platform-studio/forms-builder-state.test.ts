import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getFormsAuthoringAccess, getFormsPlaceholderActor } from "../../src/features/platform-studio/forms/forms-actors";
import {
  addFormBuilderElementNode,
  addFormBuilderFieldNode,
  createDefaultFormBuilderDocument,
  getElementPaletteItems,
  getFieldPaletteItems,
  getFormsWorkspaceAccess,
  moveFormBuilderNode,
  readFormBuilderDocument,
  reorderFormBuilderNode,
  removeFormBuilderNode,
  saveFormBuilderDocument,
  setFormBuilderCurrentParent,
  type FormBuilderDocument,
} from "../../src/features/platform-studio/forms/forms-builder-state";
import {
  editableFormBuilderModel,
  lockedDelegatedFormBuilderModel,
} from "./forms-test-fixtures";

const editableObject = editableFormBuilderModel;
const editableScreen = editableFormBuilderModel.screens[0];
const lockedObject = lockedDelegatedFormBuilderModel;
const lockedScreen = lockedDelegatedFormBuilderModel.screens[0];

function makeTestIdFactory() {
  let index = 0;

  return (prefix: string) => `${prefix}-${index++}`;
}

function getFieldNodeIds(document: FormBuilderDocument) {
  return document.rootScope.uiSchema.nodes
    .filter((node) => node.type === "field")
    .map((node) => node.fieldId);
}

function getRootNode(document: FormBuilderDocument, nodeId: string) {
  return document.rootScope.uiSchema.nodes.find((node) => node.id === nodeId);
}

function getRootNodeIds(document: FormBuilderDocument) {
  return document.rootScope.uiSchema.nodes.map((node) => node.id);
}

describe("forms builder workspace state", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        clear() {
          storage.clear();
        },
        getItem(key: string) {
          return storage.has(key) ? storage.get(key) ?? null : null;
        },
        removeItem(key: string) {
          storage.delete(key);
        },
        setItem(key: string, value: string) {
          storage.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads saved workspace documents from localStorage", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const selectedNodeId = document.rootScope.uiSchema.nodes[0]?.id ?? null;
    const updatedDocument = {
      ...document,
      rootScope: {
        ...document.rootScope,
        uiSchema: {
          ...document.rootScope.uiSchema,
          currentParentId: selectedNodeId,
          selectedNodeId,
        },
      },
      viewDescription: "Saved detail workspace",
    } satisfies FormBuilderDocument;

    window.localStorage.clear();
    saveFormBuilderDocument(editableObject, editableScreen, updatedDocument);

    const reopenedDocument = readFormBuilderDocument(editableObject, editableScreen);

    expect(reopenedDocument.viewDescription).toBe("Saved detail workspace");
    expect(reopenedDocument.rootScope.uiSchema.currentParentId).toBeNull();
    expect(reopenedDocument.rootScope.uiSchema.selectedNodeId).toBeNull();
  });

  it("falls back to legacy saved documents when no new snapshot exists", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const selectedNodeId = document.rootScope.uiSchema.nodes[0]?.id ?? null;

    window.localStorage.clear();
    window.localStorage.setItem(
      `tenant-web-platform-studio-screen-document:${editableObject.id}:${editableScreen.id}`,
      JSON.stringify({
        ...document,
        rootScope: {
          ...document.rootScope,
          uiSchema: {
            ...document.rootScope.uiSchema,
            currentParentId: selectedNodeId,
            selectedNodeId,
          },
        },
        viewDescription: "Legacy saved workspace",
      }),
    );

    const reopenedDocument = readFormBuilderDocument(editableObject, editableScreen);

    expect(reopenedDocument.viewDescription).toBe("Legacy saved workspace");
    expect(reopenedDocument.rootScope.uiSchema.currentParentId).toBeNull();
    expect(reopenedDocument.rootScope.uiSchema.selectedNodeId).toBeNull();
  });

  it("seeds the root scope with the existing model fields", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());

    expect(getFieldNodeIds(document)).toEqual(editableObject.fields.map((field) => field.id));
    expect(document.rootScope.dataSchema.fieldIds).toEqual(editableObject.fields.map((field) => field.id));
  });

  it("prevents duplicate bound field insertion", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const firstField = editableObject.fields[0];

    const nextDocument = addFormBuilderFieldNode(document, document.currentParentId, firstField, makeTestIdFactory());

    expect(nextDocument.nodes).toHaveLength(document.nodes.length);
    expect(getFieldNodeIds(nextDocument).filter((fieldId) => fieldId === firstField.id)).toHaveLength(1);
  });

  it("limits tabs containers to tab items only", () => {
    const baseDocument = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const withTabs = addFormBuilderElementNode(baseDocument, null, "tabs", undefined, makeTestIdFactory());
    const tabsNode = withTabs.rootScope.uiSchema.nodes.find((node) => node.type === "tabs");

    expect(tabsNode).toBeTruthy();
    const insideTabs = setFormBuilderCurrentParent(withTabs, tabsNode?.id ?? null);

    const editableAccess = getFormsWorkspaceAccess(
      getFormsAuthoringAccess(getFormsPlaceholderActor("model-owner"), editableObject),
      editableObject,
    );

    const palette = getElementPaletteItems(
      insideTabs,
      editableAccess,
      "",
    );

    expect(palette.map((item) => item.nodeType)).toEqual(["tab_item"]);
  });

  it("keeps unlocked managed model palettes editable for tenant members", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const memberAccess = getFormsWorkspaceAccess(
      getFormsAuthoringAccess(getFormsPlaceholderActor("view-only-editor"), editableObject, editableScreen),
      editableObject,
      editableScreen,
    );

    const elementPalette = getElementPaletteItems(document, memberAccess, "");
    const fieldPalette = getFieldPaletteItems(document, memberAccess, "");

    expect(elementPalette.every((item) => item.disabled)).toBe(false);
    expect(fieldPalette.every((item) => item.disabled)).toBe(false);
    expect(memberAccess.canEditSettings).toBe(true);
  });

  it("disables field additions while leaving delegated view layout editing available", () => {
    const document = createDefaultFormBuilderDocument(lockedObject, lockedScreen, makeTestIdFactory());
    const lockedAccess = getFormsWorkspaceAccess(
      getFormsAuthoringAccess(getFormsPlaceholderActor("view-only-editor"), lockedObject),
      lockedObject,
    );

    const elementPalette = getElementPaletteItems(document, lockedAccess, "");
    const fieldPalette = getFieldPaletteItems(document, lockedAccess, "");

    expect(elementPalette.every((item) => item.disabled)).toBe(false);
    expect(fieldPalette.every((item) => item.disabled)).toBe(true);
    expect(lockedAccess.canMoveItems).toBe(true);
    expect(lockedAccess.canRemoveItems).toBe(true);
  });

  it("reorders and removes nodes within the current document", () => {
    const fieldOnlyDocument = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const fieldANode = fieldOnlyDocument.rootScope.uiSchema.nodes[0];
    const fieldBNode = fieldOnlyDocument.rootScope.uiSchema.nodes[1];

    expect(fieldANode).toBeTruthy();
    expect(fieldBNode).toBeTruthy();

    const movedDocument = moveFormBuilderNode(fieldOnlyDocument, fieldBNode.id, -1);
    expect(getRootNode(movedDocument, fieldBNode.id)?.order).toBe(0);
    expect(getRootNode(movedDocument, fieldANode.id)?.order).toBe(1);

    const reorderedDocument = reorderFormBuilderNode(movedDocument, fieldANode.id, fieldBNode.id);
    expect(getRootNode(reorderedDocument, fieldANode.id)?.order).toBe(0);
    expect(getRootNode(reorderedDocument, fieldBNode.id)?.order).toBe(1);

    const removedDocument = removeFormBuilderNode(reorderedDocument, fieldANode.id);
    expect(getRootNodeIds(removedDocument)).toEqual([fieldBNode.id]);
    expect(removedDocument.rootScope.uiSchema.unplacedFieldIds).toContain(fieldANode.fieldId);
  });
});
