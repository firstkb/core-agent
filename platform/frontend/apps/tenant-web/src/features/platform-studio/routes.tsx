import {
  Navigate,
  Route,
  useParams,
} from "react-router-dom";

import { platformStudioPaths } from "./platform-studio-route-meta";
import { FormsPage } from "./forms/pages/forms-index-page";
import { FormsViewWorkspacePage } from "./forms/pages/forms-ui-schema-workspace-page";
import "./platform-studio.css";

function LegacyViewsRouteRedirect() {
  const params = useParams();
  const modelId = params.modelId ?? params.objectId;
  const viewId = params.viewId ?? params.screenId;

  if (!modelId || !viewId) {
    return <Navigate replace to={platformStudioPaths.forms} />;
  }

  return <Navigate replace to={platformStudioPaths.view(modelId, viewId)} />;
}

function LegacyFormsViewRedirect() {
  const params = useParams();
  const modelId = params.dataSchemaId;
  const viewId = params.uiSchemaId;

  if (!modelId || !viewId) {
    return <Navigate replace to={platformStudioPaths.forms} />;
  }

  return <Navigate replace to={platformStudioPaths.view(modelId, viewId)} />;
}

export function renderPlatformStudioRoutes() {
  return (
    <>
      <Route
        element={<Navigate replace to={platformStudioPaths.forms} />}
        path="builder"
      />
      <Route element={<FormsPage />} path="builder/forms" />
      <Route element={<FormsPage />} path="builder/forms/:modelId" />
      <Route
        element={<FormsViewWorkspacePage />}
        path="builder/forms/:modelId/views/:viewId"
      />
      <Route
        element={<LegacyViewsRouteRedirect />}
        path="builder/forms/:modelId/screens/:viewId"
      />
      <Route element={<LegacyFormsViewRedirect />} path="builder/forms/:dataSchemaId/ui/:uiSchemaId" />
    </>
  );
}
