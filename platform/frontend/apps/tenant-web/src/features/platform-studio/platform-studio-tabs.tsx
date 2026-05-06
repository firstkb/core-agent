import { useTranslation } from "@platform/i18n";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@platform/ui-kit";
import { useNavigate } from "react-router-dom";

import { platformStudioPaths } from "./platform-studio-route-meta";

export function PlatformStudioTabs({
  activeTool = "forms",
  onFormsNavigate,
}: {
  activeTool?: "forms" | "navigation";
  onFormsNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="tenant-web__platform-studio-tabs">
      <Tabs defaultValue="forms" onValueChange={(value) => {
        if (value === "forms") {
          if (onFormsNavigate) {
            onFormsNavigate();
            return;
          }

          navigate(platformStudioPaths.forms);
        }
        if (value === "navigation") {
          navigate(platformStudioPaths.navigation);
        }
      }} size="sm" value={activeTool} variant="surface">
        <TabsList>
          <TabsTrigger value="forms">{t("tenant.navigation.platformStudio.forms.label")}</TabsTrigger>
          <TabsTrigger value="navigation">{t("tenant.navigation.platformStudio.navigation.label")}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
