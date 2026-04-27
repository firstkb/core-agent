import {
  type WorkspaceFilterDialogsProps,
  WorkspaceFilterDialogs,
} from "./workspace-filter-dialogs";
import {
  type WorkspaceRuleDialogsProps,
  WorkspaceRuleDialogs,
} from "./workspace-rule-dialogs";
import {
  type WorkspaceDeleteNodeDialogProps,
  WorkspaceDeleteNodeDialog,
  type WorkspaceLookupSourceDialogProps,
  WorkspaceLookupSourceDialog,
  type WorkspaceSupportDialogsProps,
  WorkspaceSupportDialogs,
} from "./workspace-support-dialogs";

type WorkspaceDialogStackProps =
  & WorkspaceDeleteNodeDialogProps
  & WorkspaceFilterDialogsProps
  & WorkspaceLookupSourceDialogProps
  & WorkspaceRuleDialogsProps
  & WorkspaceSupportDialogsProps;

export function WorkspaceDialogStack(props: WorkspaceDialogStackProps) {
  return (
    <>
      <WorkspaceDeleteNodeDialog {...props} />
      <WorkspaceRuleDialogs {...props} />
      <WorkspaceLookupSourceDialog {...props} />
      <WorkspaceFilterDialogs {...props} />
      <WorkspaceSupportDialogs {...props} />
    </>
  );
}
