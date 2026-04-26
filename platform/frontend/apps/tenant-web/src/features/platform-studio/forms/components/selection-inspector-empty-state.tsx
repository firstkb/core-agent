type SelectionInspectorEmptyStateProps = {
  description: string;
  title: string;
};

export function SelectionInspectorEmptyState({
  description,
  title,
}: SelectionInspectorEmptyStateProps) {
  return (
    <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
      <p className="tenant-web__platform-studio-empty-title">
        {title}
      </p>
      <p>{description}</p>
    </div>
  );
}
