import {
  useMemo,
  useState,
} from "react";

import {
  type useTranslation,
} from "@platform/i18n";

import {
  compileDebugSchemas,
} from "./form-builder-workspace-debug-schemas";
import {
  type FormBuilderDocument,
} from "../forms-builder-state";
import {
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";

type Translate = ReturnType<typeof useTranslation>["t"];

type UseFormBuilderDebugDialogInput = {
  currentLayoutBlueprint: Record<string, unknown>;
  currentModel: FormsPlaceholderModel;
  currentModelSchemaScopes: FormsPlaceholderModel["schemaScopes"];
  currentView: FormsPlaceholderView;
  document: FormBuilderDocument;
  t: Translate;
};

export function useFormBuilderDebugDialog({
  currentLayoutBlueprint,
  currentModel,
  currentModelSchemaScopes,
  currentView,
  document,
  t,
}: UseFormBuilderDebugDialogInput) {
  const [debugOpen, setDebugOpen] = useState(false);
  const compiledDebugSchemas = useMemo(
    () => compileDebugSchemas(
      document,
      {
        ...currentModel,
        schemaScopes: currentModelSchemaScopes,
      },
      currentView,
      currentLayoutBlueprint,
      t,
    ),
    [currentLayoutBlueprint, currentModel, currentModelSchemaScopes, currentView, document, t],
  );
  const debugDataSchema = useMemo(
    () => JSON.stringify(compiledDebugSchemas.modelSchema, null, 2),
    [compiledDebugSchemas.modelSchema],
  );
  const debugCompiledRuntime = useMemo(
    () => JSON.stringify(compiledDebugSchemas.compiledRuntime, null, 2),
    [compiledDebugSchemas.compiledRuntime],
  );
  const debugUiSchema = useMemo(
    () => JSON.stringify(compiledDebugSchemas.uiSchema, null, 2),
    [compiledDebugSchemas.uiSchema],
  );

  return {
    debugCompiledRuntime,
    debugDataSchema,
    debugOpen,
    debugUiSchema,
    setDebugOpen,
  } as const;
}
