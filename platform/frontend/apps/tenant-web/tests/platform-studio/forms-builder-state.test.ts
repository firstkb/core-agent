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
  type FormBuilderDocument,
} from "../../src/features/platform-studio/forms/forms-builder-state";
import {
  getFormsPlaceholderObject,
  getFormsPlaceholderScreen,
} from "../../src/features/platform-studio/forms/forms-placeholder-data";

const editableObject = getFormsPlaceholderObject("site-audit");
const editableScreen = getFormsPlaceholderScreen("site-audit", "field-checklist");
const lockedObject = getFormsPlaceholderObject("customer-profile");
const lockedScreen = getFormsPlaceholderScreen("customer-profile", "intake-form");

if (!editableObject || !editableScreen || !lockedObject || !lockedScreen) {
  throw new Error("Expected platform builder placeholder fixtures for form builder state tests.");
}

function makeTestIdFactory() {
  let index = 0;

  return (prefix: string) => `${prefix}-${index++}`;
}

function getFieldNodeIds(document: FormBuilderDocument) {
  return document.nodes.filter((node) => node.type === "field").map((node) => node.fieldId);
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
    const nestedSectionId = document.nodes[0]?.id ?? null;
    const updatedDocument = {
      ...document,
      currentParentId: nestedSectionId,
      selectedNodeId: document.nodes.find((node) => node.type === "field")?.id ?? document.selectedNodeId,
      viewDescription: "Saved detail workspace",
    } satisfies FormBuilderDocument;

    window.localStorage.clear();
    saveFormBuilderDocument(editableObject, editableScreen, updatedDocument);

    const reopenedDocument = readFormBuilderDocument(editableObject, editableScreen);

    expect(reopenedDocument.viewDescription).toBe("Saved detail workspace");
    expect(reopenedDocument.currentParentId).toBeNull();
    expect(reopenedDocument.selectedNodeId).toBe(nestedSectionId);
  });

  it("falls back to legacy saved documents when no new snapshot exists", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());
    const nestedSectionId = document.nodes[0]?.id ?? null;

    window.localStorage.clear();
    window.localStorage.setItem(
      `tenant-web-platform-studio-screen-document:${editableObject.id}:${editableScreen.id}`,
      JSON.stringify({
        ...document,
        currentParentId: nestedSectionId,
        selectedNodeId: document.nodes.find((node) => node.type === "field")?.id ?? document.selectedNodeId,
        viewDescription: "Legacy saved workspace",
      }),
    );

    const reopenedDocument = readFormBuilderDocument(editableObject, editableScreen);

    expect(reopenedDocument.viewDescription).toBe("Legacy saved workspace");
    expect(reopenedDocument.currentParentId).toBeNull();
    expect(reopenedDocument.selectedNodeId).toBe(nestedSectionId);
  });

  it("seeds one section plus the existing model fields", () => {
    const document = createDefaultFormBuilderDocument(editableObject, editableScreen, makeTestIdFactory());

    expect(document.nodes[0]?.type).toBe("section");
    expect(getFieldNodeIds(document)).toEqual(editableObject.fields.map((field) => field.id));
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
    const withTabs = addFormBuilderElementNode(baseDocument, null, "tabs", makeTestIdFactory());
    const tabsNode = withTabs.nodes.find((node) => node.type === "tabs");

    expect(tabsNode).toBeTruthy();

    const editableAccess = getFormsWorkspaceAccess(
      getFormsAuthoringAccess(getFormsPlaceholderActor("model-owner"), editableObject),
      editableObject,
    );

    const palette = getElementPaletteItems(
      {
        ...withTabs,
        currentParentId: tabsNode?.id ?? null,
      },
      editableAccess,
      "",
    );

    expect(palette.map((item) => item.nodeType)).toEqual(["tab_item"]);
  });

  it("disables palette additions when the model structure is locked", () => {
    const document = createDefaultFormBuilderDocument(lockedObject, lockedScreen, makeTestIdFactory());
    const lockedAccess = getFormsWorkspaceAccess(
      getFormsAuthoringAccess(getFormsPlaceholderActor("model-owner"), lockedObject),
      lockedObject,
    );

    const elementPalette = getElementPaletteItems(document, lockedAccess, "");
    const fieldPalette = getFieldPaletteItems(document, lockedObject, lockedAccess, "");

    expect(elementPalette.every((item) => item.disabled)).toBe(true);
    expect(fieldPalette.every((item) => item.disabled)).toBe(true);
    expect(lockedAccess.canMoveItems).toBe(true);
    expect(lockedAccess.canRemoveItems).toBe(false);
  });

  it("reorders and removes nodes within the current document", () => {
    const fieldOnlyDocument: FormBuilderDocument = {
      currentParentId: null,
      nodes: [
        {
          fieldId: "field-a",
          helperText: "",
          id: "field-a-node",
          order: 0,
          parentId: null,
          title: "Field A",
          type: "field",
          visibility: "visible",
        },
        {
          fieldId: "field-b",
          helperText: "",
          id: "field-b-node",
          order: 1,
          parentId: null,
          title: "Field B",
          type: "field",
          visibility: "visible",
        },
      ],
      selectedNodeId: "field-a-node",
      viewDescription: "Test view",
    };

    const movedDocument = moveFormBuilderNode(fieldOnlyDocument, "field-b-node", -1);
    expect(movedDocument.nodes.find((node) => node.id === "field-b-node")?.order).toBe(0);
    expect(movedDocument.nodes.find((node) => node.id === "field-a-node")?.order).toBe(1);

    const reorderedDocument = reorderFormBuilderNode(movedDocument, "field-a-node", "field-b-node");
    expect(reorderedDocument.nodes.find((node) => node.id === "field-a-node")?.order).toBe(0);
    expect(reorderedDocument.nodes.find((node) => node.id === "field-b-node")?.order).toBe(1);

    const removedDocument = removeFormBuilderNode(reorderedDocument, "field-a-node");
    expect(removedDocument.nodes.map((node) => node.id)).toEqual(["field-b-node"]);
  });
});
