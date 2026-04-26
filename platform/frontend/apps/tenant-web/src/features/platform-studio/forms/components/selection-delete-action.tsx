import { Button } from "@platform/ui-kit";

type SelectionDeleteActionProps = {
  label: string;
  onDelete: () => void;
};

export function SelectionDeleteAction({
  label,
  onDelete,
}: SelectionDeleteActionProps) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-danger-zone">
        <Button
          onClick={onDelete}
          variant="danger"
        >
          {label}
        </Button>
      </div>
    </div>
  );
}
