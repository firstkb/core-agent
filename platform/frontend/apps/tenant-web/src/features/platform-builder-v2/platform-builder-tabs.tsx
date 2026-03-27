import { useTranslation } from "@platform/i18n";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@platform/ui-kit";
import { useNavigate } from "react-router-dom";

import { platformBuilderPaths } from "./platform-builder-route-meta";

export function PlatformBuilderTabs({
  onFormsNavigate,
}: {
  onFormsNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="tenant-web__platform-builder-tabs">
      <Tabs defaultValue="forms" onValueChange={(value) => {
        if (value === "forms") {
          if (onFormsNavigate) {
            onFormsNavigate();
            return;
          }

          navigate(platformBuilderPaths.forms);
        }
      }} size="sm" value="forms" variant="surface">
        <TabsList>
          <TabsTrigger value="forms">{t("tenant.navigation.platformBuilder.forms.label")}</TabsTrigger>
          <TabsTrigger disabled value="navigation">{t("tenant.navigation.platformBuilder.navigation.label")}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
