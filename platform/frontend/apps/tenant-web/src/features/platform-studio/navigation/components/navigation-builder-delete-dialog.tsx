import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@platform/ui-kit";

import {
  getNavigationBuilderDescendantIds,
  type NavigationBuilderNode,
} from "../navigation-builder-state";

type NavigationBuilderDeleteDialogProps = {
  node: NavigationBuilderNode | null;
  nodes: ReadonlyArray<NavigationBuilderNode>;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function NavigationBuilderDeleteDialog({
  node,
  nodes,
  onConfirm,
  onOpenChange,
  open,
}: NavigationBuilderDeleteDialogProps) {
  const removedCount = node
    ? getNavigationBuilderDescendantIds(nodes, node.id).size
    : 0;
  const childCount = Math.max(0, removedCount - 1);
  const description = childCount > 0
    ? `This removes the item and ${childCount} child ${childCount === 1 ? "item" : "items"} from the draft navigation.`
    : "This removes the item from the draft navigation.";

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {node?.label ?? "item"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="danger">
            Delete item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
