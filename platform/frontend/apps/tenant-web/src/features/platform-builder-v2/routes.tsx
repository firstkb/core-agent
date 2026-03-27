import {
  Navigate,
  Route,
  useParams,
} from "react-router-dom";

import { platformBuilderPaths } from "./platform-builder-route-meta";
import { FormsPage } from "./forms/pages/forms-index-page";
import { FormsScreenWorkspacePage } from "./forms/pages/forms-ui-schema-workspace-page";
import "./platform-builder-v2.css";

function LegacyScreensRouteRedirect() {
  const params = useParams();
  const objectId = params.objectId;
  const screenId = params.screenId;

  if (!objectId || !screenId) {
    return <Navigate replace to={platformBuilderPaths.forms} />;
  }

  return <Navigate replace to={platformBuilderPaths.view(objectId, screenId)} />;
}

function LegacyFormsScreenRedirect() {
  const params = useParams();
  const objectId = params.dataSchemaId;
  const screenId = params.uiSchemaId;

  if (!objectId || !screenId) {
    return <Navigate replace to={platformBuilderPaths.forms} />;
  }

  return <Navigate replace to={platformBuilderPaths.view(objectId, screenId)} />;
}

export function renderPlatformBuilderRoutes() {
  return (
    <>
      <Route
        element={<Navigate replace to={platformBuilderPaths.forms} />}
        path="builder"
      />
      <Route element={<FormsPage />} path="builder/forms" />
      <Route element={<FormsPage />} path="builder/forms/:objectId" />
      <Route
        element={<FormsScreenWorkspacePage />}
        path="builder/forms/:objectId/views/:screenId"
      />
      <Route
        element={<LegacyScreensRouteRedirect />}
        path="builder/forms/:objectId/screens/:screenId"
      />
      <Route element={<LegacyFormsScreenRedirect />} path="builder/forms/:dataSchemaId/ui/:uiSchemaId" />
    </>
  );
}
