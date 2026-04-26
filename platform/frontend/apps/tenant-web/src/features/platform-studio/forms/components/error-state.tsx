import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/ui-kit";

type WorkspaceErrorStateProps = {
  actions?: ReactNode;
  description: string;
  title: string;
};

export function WorkspaceErrorState({
  actions,
  description,
  title,
}: WorkspaceErrorStateProps) {
  return (
    <Card className="tenant-web__platform-studio-missing">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      {actions ? (
        <CardContent className="tenant-web__platform-studio-row">
          {actions}
        </CardContent>
      ) : null}
    </Card>
  );
}
