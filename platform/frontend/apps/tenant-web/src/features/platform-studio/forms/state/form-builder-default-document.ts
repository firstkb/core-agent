import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import { getFormsPlaceholderFieldDisplayName } from "../forms-placeholder-data";
import type {
  FormBuilderSubformType,
} from "../forms-builder-contract";
import type {
  FormBuilderDocument,
  FormBuilderFilterDefinitions,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderSubformViewSettings,
  FormBuilderSystemFields,
  FormBuilderViewSettings,
} from "../forms-builder-state";
import type { FormBuilderFlatWorkspaceState } from "./form-builder-flat-workspace";

export type FormBuilderModelSubformSchemaScope = {
  displayName: string;
  key: string;
  subformType: FormBuilderSubformType;
};

type DefaultDocumentInternals = {
  buildScopedDocumentFromFlatWorkspace: (
    flatState: FormBuilderFlatWorkspaceState,
    baseDocument: FormBuilderDocument,
    extraFieldIds?: ReadonlyArray<string>,
  ) => FormBuilderDocument;
  createDefaultFilterDefinitions: () => FormBuilderFilterDefinitions;
  createDefaultSubformViewSettings: () => FormBuilderSubformViewSettings;
  createDefaultSystemFields: () => FormBuilderSystemFields;
  createDefaultViewSettings: () => FormBuilderViewSettings;
  createNode: (
    type: FormBuilderNodeType,
    parentId: string | null,
    order: number,
    partial?: Partial<FormBuilderNode>,
    idFactory?: (prefix: string) => string,
  ) => FormBuilderNode;
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
};

export function getFieldSchemaScopeKey(field: Pick<FormsPlaceholderField, "schemaScopeKey">) {
  const normalizedScopeKey = field.schemaScopeKey?.trim();
  return normalizedScopeKey && normalizedScopeKey.length > 0
    ? normalizedScopeKey
    : null;
}

function humanizeSchemaScopeKey(value: string) {
  return value
    .replace(/^pb_/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Subform";
}

export function getModelSubformSchemaScopes(
  object: FormsPlaceholderObject,
): ReadonlyArray<FormBuilderModelSubformSchemaScope> {
  const scopes = new Map<string, FormBuilderModelSubformSchemaScope>();

  object.schemaScopes?.forEach((scope) => {
    const key = scope.key.trim();
    if (!key) {
      return;
    }

    scopes.set(key, {
      displayName: scope.displayName.trim() || humanizeSchemaScopeKey(key),
      key,
      subformType: scope.subformType === "CHECKLIST" ? "CHECKLIST" : "DEFAULT",
    });
  });

  object.fields.forEach((field) => {
    const scopeKey = getFieldSchemaScopeKey(field);
    if (!scopeKey || scopeKey === "root" || scopes.has(scopeKey)) {
      return;
    }

    scopes.set(scopeKey, {
      displayName: humanizeSchemaScopeKey(scopeKey),
      key: scopeKey,
      subformType: "DEFAULT",
    });
  });

  return [...scopes.values()];
}

export function getRootSeedFieldIds(fields: ReadonlyArray<FormsPlaceholderField>) {
  return fields
    .filter((field) => {
      const scopeKey = getFieldSchemaScopeKey(field);
      return scopeKey === null || scopeKey === "root";
    })
    .map((field) => field.id);
}

export function createFormBuilderDefaultDocumentHelpers({
  buildScopedDocumentFromFlatWorkspace,
  createDefaultFilterDefinitions,
  createDefaultSubformViewSettings,
  createDefaultSystemFields,
  createDefaultViewSettings,
  createNode,
  dedupeFieldIds,
}: DefaultDocumentInternals) {
  function createDocumentShell(
    viewTitle: string,
    viewKind: "detail" | "form",
    viewDescription: string,
    rootFieldIds: ReadonlyArray<string>,
  ): FormBuilderDocument {
    return {
      activeScopeId: "root",
      currentParentId: null,
      filterDefinitions: createDefaultFilterDefinitions(),
      nodes: [],
      rootScope: {
        dataSchema: {
          fieldIds: dedupeFieldIds(rootFieldIds),
        },
        scopeId: "root",
        scopeType: "ROOT",
        uiSchema: {
          currentParentId: null,
          nodes: [],
          selectedNodeId: null,
          unplacedFieldIds: [],
        },
      },
      selectedNodeId: null,
      subformScopes: [],
      systemFields: createDefaultSystemFields(),
      viewKind,
      viewSettings: createDefaultViewSettings(),
      viewDescription,
      viewTitle,
    };
  }

  function createEmptyFormBuilderDocument(
    object: FormsPlaceholderObject,
    screen: FormsPlaceholderScreen,
  ): FormBuilderDocument {
    return createDocumentShell(
      screen.title,
      screen.kind,
      `${screen.title} for ${object.title}.`,
      getRootSeedFieldIds(object.fields),
    );
  }

  function createDefaultFormBuilderDocument(
    object: FormsPlaceholderObject,
    screen: FormsPlaceholderScreen,
  ): FormBuilderDocument {
    const modelSubformScopes = getModelSubformSchemaScopes(object);
    if (object.fields.length === 0 && modelSubformScopes.length === 0) {
      return createEmptyFormBuilderDocument(object, screen);
    }

    const seededFields = object.fields.filter((field) => {
      const scopeKey = getFieldSchemaScopeKey(field);
      return scopeKey === null || scopeKey === "root";
    });

    const rootFieldNodes = seededFields.map((field, index) =>
      createNode(
        "field",
        null,
        index,
        {
          fieldId: field.id,
          helperText: "",
          title: getFormsPlaceholderFieldDisplayName(field),
        },
      ),
    );

    const subformNodes = modelSubformScopes.map((scope, index) =>
      createNode(
        "subform",
        null,
        rootFieldNodes.length + index,
        {
          subformType: scope.subformType,
          title: scope.displayName,
        },
      ),
    );
    const subformNodeByScopeKey = new Map(
      subformNodes.map((node, index) => [modelSubformScopes[index].key, node]),
    );
    const subformFieldOrderByScopeKey = new Map<string, number>();
    const subformFieldNodes = object.fields.flatMap((field) => {
      const scopeKey = getFieldSchemaScopeKey(field);
      if (!scopeKey || scopeKey === "root") {
        return [];
      }

      const parentSubformNode = subformNodeByScopeKey.get(scopeKey);
      if (!parentSubformNode) {
        return [];
      }

      const nextOrder = subformFieldOrderByScopeKey.get(scopeKey) ?? 0;
      subformFieldOrderByScopeKey.set(scopeKey, nextOrder + 1);

      return [createNode(
        "field",
        parentSubformNode.id,
        nextOrder,
        {
          fieldId: field.id,
          helperText: "",
          title: getFormsPlaceholderFieldDisplayName(field),
        },
      )];
    });

    const baseDocument = createEmptyFormBuilderDocument(object, screen);
    baseDocument.subformScopes = subformNodes.map((node, index) => ({
      dataSchema: {
        fieldIds: object.fields
          .filter((field) => getFieldSchemaScopeKey(field) === modelSubformScopes[index].key)
          .map((field) => field.id),
      },
      filterDefinitions: createDefaultFilterDefinitions(),
      parentSubformNodeId: node.id,
      scopeId: node.id,
      scopeType: "SUBFORM",
      subformType: modelSubformScopes[index].subformType,
      tableKey: modelSubformScopes[index].key,
      uiSchema: {
        currentParentId: null,
        nodes: [],
        selectedNodeId: null,
        unplacedFieldIds: [],
      },
      viewSettings: createDefaultSubformViewSettings(),
    }));

    return buildScopedDocumentFromFlatWorkspace(
      {
        currentParentId: null,
        nodes: [...rootFieldNodes, ...subformNodes, ...subformFieldNodes],
        selectedNodeId: null,
      },
      baseDocument,
    );
  }

  return {
    createDefaultFormBuilderDocument,
    createDocumentShell,
    createEmptyFormBuilderDocument,
  } as const;
}
