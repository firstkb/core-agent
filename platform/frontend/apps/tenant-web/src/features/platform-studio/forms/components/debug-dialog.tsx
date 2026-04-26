import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";

type DebugDialogLabels = {
  compiledRuntimeDescription: string;
  compiledRuntimeTitle: string;
  description: string;
  modelSchemaDescription: string;
  modelSchemaTitle: string;
  title: string;
  uiSchemaDescription: string;
  uiSchemaTitle: string;
};

type DebugDialogProps = {
  compiledRuntime: string;
  labels: DebugDialogLabels;
  modelSchema: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  uiSchema: string;
};

export function DebugDialog({
  compiledRuntime,
  labels,
  modelSchema,
  onOpenChange,
  open,
  uiSchema,
}: DebugDialogProps) {
  return (
    <Dialog
      onOpenChange={onOpenChange}
      open={open}
      surfaceClassName="tenant-web__platform-studio-debug-surface"
    >
      <DialogContent className="tenant-web__platform-studio-debug-dialog">
        <DialogHeader>
          <div>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>
              {labels.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody className="tenant-web__platform-studio-debug-dialog-body">
          <div className="tenant-web__platform-studio-debug-schema-grid">
            <DebugSchemaCard
              description={labels.modelSchemaDescription}
              schema={modelSchema}
              title={labels.modelSchemaTitle}
            />

            <DebugSchemaCard
              description={labels.uiSchemaDescription}
              schema={uiSchema}
              title={labels.uiSchemaTitle}
            />

            <DebugSchemaCard
              description={labels.compiledRuntimeDescription}
              schema={compiledRuntime}
              title={labels.compiledRuntimeTitle}
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function DebugSchemaCard({
  description,
  schema,
  title,
}: {
  description: string;
  schema: string;
  title: string;
}) {
  return (
    <Card className="tenant-web__platform-studio-debug-schema-card">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="tenant-web__platform-studio-debug-schema-scroll">
        <pre className="tenant-web__platform-studio-debug-schema-pre">{schema}</pre>
      </CardContent>
    </Card>
  );
}
