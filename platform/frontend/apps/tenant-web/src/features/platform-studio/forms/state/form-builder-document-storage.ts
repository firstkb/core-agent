import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import type { FormBuilderDocument } from "../forms-builder-state";
import { wrapWorkspaceDocumentForPersistence } from "../forms-builder-migrations";

const legacyFormsWorkspaceStoragePrefix = "tenant-web-platform-studio-screen-document";
const formsWorkspaceSavedStoragePrefix = "tenant-web-platform-studio-screen-document-saved";

export type FormBuilderDocumentStorageInternals = {
  createDefaultFormBuilderDocument: (
    object: FormsPlaceholderObject,
    screen: FormsPlaceholderScreen,
  ) => FormBuilderDocument;
  normalizeFormBuilderDocument: (
    rawValue: unknown,
    object: FormsPlaceholderObject,
    screen: FormsPlaceholderScreen,
  ) => FormBuilderDocument;
  withFlatCompatibilityCache: (document: FormBuilderDocument) => FormBuilderDocument;
};

type HydrateFormBuilderDocumentOptions = {
  savedDocument?: FormBuilderDocument;
};

function getStorageKeys(
  object: Pick<FormsPlaceholderObject, "key">,
  screen: Pick<FormsPlaceholderScreen, "key">,
) {
  return {
    legacyStorageKey: `${legacyFormsWorkspaceStoragePrefix}:${object.key}:${screen.key}`,
    savedStorageKey: `${formsWorkspaceSavedStoragePrefix}:${object.key}:${screen.key}`,
  };
}

function resetFormBuilderWorkspaceNavigation(
  document: FormBuilderDocument,
  internals: FormBuilderDocumentStorageInternals,
): FormBuilderDocument {
  return internals.withFlatCompatibilityCache({
    ...document,
    activeScopeId: "root",
    rootScope: {
      ...document.rootScope,
      uiSchema: {
        ...document.rootScope.uiSchema,
        currentParentId: null,
        selectedNodeId: null,
      },
    },
    subformScopes: document.subformScopes.map((scope) => ({
      ...scope,
      uiSchema: {
        ...scope.uiSchema,
        currentParentId: null,
        selectedNodeId: null,
      },
    })),
  });
}

function getPersistedFormBuilderDocument(
  document: FormBuilderDocument,
  internals: FormBuilderDocumentStorageInternals,
): FormBuilderDocument {
  return resetFormBuilderWorkspaceNavigation(document, internals);
}

export function createPersistedFormBuilderDocument(
  document: FormBuilderDocument,
  internals: FormBuilderDocumentStorageInternals,
) {
  return getPersistedFormBuilderDocument(document, internals);
}

export function readFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
  internals: FormBuilderDocumentStorageInternals,
): FormBuilderDocument {
  if (typeof window === "undefined") {
    return internals.createDefaultFormBuilderDocument(object, screen);
  }

  const { legacyStorageKey, savedStorageKey } = getStorageKeys(object, screen);

  try {
    const savedValue = window.localStorage.getItem(savedStorageKey);
    if (savedValue) {
      return resetFormBuilderWorkspaceNavigation(
        internals.normalizeFormBuilderDocument(JSON.parse(savedValue), object, screen),
        internals,
      );
    }

    const legacyValue = window.localStorage.getItem(legacyStorageKey);
    if (legacyValue) {
      return resetFormBuilderWorkspaceNavigation(
        internals.normalizeFormBuilderDocument(JSON.parse(legacyValue), object, screen),
        internals,
      );
    }
  } catch {
    return internals.createDefaultFormBuilderDocument(object, screen);
  }

  return internals.createDefaultFormBuilderDocument(object, screen);
}

export function saveFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
  document: FormBuilderDocument,
  internals: FormBuilderDocumentStorageInternals,
) {
  if (typeof window === "undefined") {
    return;
  }

  const { legacyStorageKey, savedStorageKey } = getStorageKeys(object, screen);

  try {
    window.localStorage.setItem(
      savedStorageKey,
      JSON.stringify(wrapWorkspaceDocumentForPersistence(
        getPersistedFormBuilderDocument(document, internals),
        object.fields.map((field) => field.id),
      )),
    );
    window.localStorage.removeItem(legacyStorageKey);
  } catch {
    // Ignore localStorage failures so the builder stays usable in restricted environments.
  }
}

export function useFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
  internals: FormBuilderDocumentStorageInternals,
) {
  const storageSignature = useMemo(() => `${object.key}:${screen.key}`, [object.key, screen.key]);
  const [document, setDocument] = useState<FormBuilderDocument>(() =>
    readFormBuilderDocument(object, screen, internals),
  );
  const [savedDocument, setSavedDocument] = useState<FormBuilderDocument>(() =>
    getPersistedFormBuilderDocument(readFormBuilderDocument(object, screen, internals), internals),
  );

  useEffect(() => {
    const nextSavedDocument = readFormBuilderDocument(object, screen, internals);
    setDocument(nextSavedDocument);
    setSavedDocument(getPersistedFormBuilderDocument(nextSavedDocument, internals));
  }, [storageSignature, object.key, screen.key, internals]);

  const isDirty = useMemo(
    () => JSON.stringify(getPersistedFormBuilderDocument(document, internals)) !== JSON.stringify(savedDocument),
    [document, internals, savedDocument],
  );

  const saveDocument = useCallback(() => {
    saveFormBuilderDocument(object, screen, document, internals);
    setSavedDocument(getPersistedFormBuilderDocument(document, internals));
  }, [document, internals, object, screen]);

  const hydrateDocument = useCallback((nextDocument: FormBuilderDocument, options?: HydrateFormBuilderDocumentOptions) => {
    const nextSavedDocument = options?.savedDocument ?? nextDocument;
    saveFormBuilderDocument(object, screen, nextDocument, internals);
    setDocument(nextDocument);
    setSavedDocument(getPersistedFormBuilderDocument(nextSavedDocument, internals));
  }, [internals, object, screen]);

  return {
    document,
    hydrateDocument,
    isDirty,
    saveDocument,
    savedDocument,
    setDocument,
  } as const;
}
