import { type useTranslation } from "@platform/i18n";

export type WorkspaceDialogTranslate = ReturnType<typeof useTranslation>["t"];

export type WorkspaceDialogEditorState<TDraft> = {
  draft: TDraft;
  index: number | null;
} | null;
