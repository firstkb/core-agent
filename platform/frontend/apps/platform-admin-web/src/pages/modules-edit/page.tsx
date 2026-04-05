import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/ui-kit";
import { useNavigate, useParams } from "react-router-dom";

const modulesListPath = "/modules/list";

export function AdminModuleEditPage() {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const isCreateMode = moduleId === "new";

  return (
    <div className="admin-web__stack">
      <Card>
        <CardHeader>
          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <Badge size="sm" variant="brand">Backend-ready route</Badge>
            <Badge appearance="outline" size="sm" variant="neutral">Host-managed action</Badge>
          </div>
          <div>
            <CardTitle>{isCreateMode ? "Create module" : "Module edit"}</CardTitle>
            <CardDescription>
              {isCreateMode
                ? "Host-managed create route for the collection table toolbar. The backend exposes the capability and the app owns navigation."
                : "Frontend-managed row action target for the collection table. The table owns discovery, while the app owns route navigation."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="admin-web__stack">
          <div className="admin-web__surface-summary-card">
            <p className="admin-web__surface-summary-label">{isCreateMode ? "Route mode" : "Module id"}</p>
            <p className="admin-web__surface-summary-value">{moduleId ?? "Missing route param"}</p>
          </div>

          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <Button onClick={() => navigate(modulesListPath)} size="sm" variant="outline">
              Back to modules list
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
