import type {
  RuntimeFormFieldDefinition,
  RuntimeFormResolvedLabels,
  RuntimeFormScaffoldProps,
  RuntimeFormValue,
} from "../runtime-form-types";

export type RuntimeFieldControlProps = {
  controlId: string;
  disabled: boolean;
  error?: string;
  field: RuntimeFormFieldDefinition;
  groupName: string;
  labels: RuntimeFormResolvedLabels;
  loadLookupOptions?: RuntimeFormScaffoldProps["loadLookupOptions"];
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  required: boolean;
  value: RuntimeFormValue | undefined;
};
