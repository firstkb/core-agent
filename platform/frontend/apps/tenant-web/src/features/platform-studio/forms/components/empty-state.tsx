import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/ui-kit";

type WorkspaceLoadingStateProps = {
  description: string;
  title: string;
};

export function WorkspaceLoadingState({
  description,
  title,
}: WorkspaceLoadingStateProps) {
  return (
    <Card className="tenant-web__platform-studio-missing">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
