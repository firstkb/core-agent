import { type useTranslation } from "@platform/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormIcon,
  Input,
  LockIcon,
  PlusIcon,
  SearchIcon,
} from "@platform/ui-kit";

import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import {
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { DatabaseModelIcon } from "./forms-index-icons";
import { isStaticFormsModel } from "./forms-index-page-helpers";

type Translate = ReturnType<typeof useTranslation>["t"];

type FormsIndexModelsPanelProps = {
  addModelTitle: string | undefined;
  canManageStructure: boolean;
  filteredModels: ReadonlyArray<FormsPlaceholderModel>;
  isLoadingModels: boolean;
  isSubmittingDialog: boolean;
  modelSearchQuery: string;
  models: ReadonlyArray<FormsPlaceholderModel>;
  modelsError: string | null;
  onAddModel: () => void;
  onModelSearchChange: (value: string) => void;
  onModelSelect: (model: FormsPlaceholderModel) => void;
  selectedModel: FormsPlaceholderModel | null;
  t: Translate;
};

export function FormsIndexModelsPanel({
  addModelTitle,
  canManageStructure,
  filteredModels,
  isLoadingModels,
  isSubmittingDialog,
  modelSearchQuery,
  models,
  modelsError,
  onAddModel,
  onModelSearchChange,
  onModelSelect,
  selectedModel,
  t,
}: FormsIndexModelsPanelProps) {
  return (
    <Card className="tenant-web__platform-studio-panel">
      <CardHeader>
        <div className="tenant-web__platform-studio-panel-header">
          <CardTitle>{t("tenant.platformStudio.forms.modelsTitle")}</CardTitle>
          <Button
            className="tenant-web__platform-studio-action-button"
            disabled={!canManageStructure || isSubmittingDialog}
            leadingIcon={<PlusIcon />}
            onClick={onAddModel}
            size="sm"
            title={addModelTitle}
            variant="secondary"
          >
            {t("tenant.platformStudio.forms.addModel")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
        <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
          <div className="tenant-web__platform-studio-search">
            <div className="tenant-web__platform-studio-search-field">
              <span className="tenant-web__platform-studio-search-icon">
                <SearchIcon />
              </span>
              <Input
                aria-label={t("tenant.platformStudio.forms.modelSearchPlaceholder")}
                className="tenant-web__platform-studio-search-input"
                onChange={(event) => onModelSearchChange(event.target.value)}
                placeholder={t("tenant.platformStudio.forms.modelSearchPlaceholder")}
                value={modelSearchQuery}
              />
            </div>
          </div>
        </div>

        <PlatformStudioPanelScroll
          aria-label={t("tenant.platformStudio.forms.modelsTitle")}
          className="tenant-web__platform-studio-panel-scroll--models"
        >
          <div className="tenant-web__platform-studio-object-list">
            {modelsError ? (
              <div className="tenant-web__platform-studio-inline-help">
                <span>{modelsError}</span>
              </div>
            ) : null}

            {isLoadingModels && models.length === 0 ? (
              <div className="tenant-web__platform-studio-builder-empty">
                <p>{t("tenant.platformStudio.forms.loadingModels")}</p>
              </div>
            ) : null}

            {!isLoadingModels && models.length === 0 ? (
              <div className="tenant-web__platform-studio-builder-empty">
                <p className="tenant-web__platform-studio-empty-title">
                  {t("tenant.platformStudio.forms.emptyModelsTitle")}
                </p>
                <p>{t("tenant.platformStudio.forms.emptyModelsDescription")}</p>
              </div>
            ) : null}

            {!isLoadingModels && models.length > 0 && filteredModels.length === 0 ? (
              <div className="tenant-web__platform-studio-builder-empty">
                <p className="tenant-web__platform-studio-empty-title">
                  {t("tenant.platformStudio.forms.emptyModelSearchTitle")}
                </p>
                <p>{t("tenant.platformStudio.forms.emptyModelSearchDescription")}</p>
              </div>
            ) : null}

            {filteredModels.map((model) => {
              const isActive = selectedModel?.id === model.id;
              const modelIsStatic = isStaticFormsModel(model);

              return (
                <button
                  className={`tenant-web__platform-studio-object-item${isActive ? " tenant-web__platform-studio-object-item--active" : ""}`}
                  key={model.id}
                  onClick={() => onModelSelect(model)}
                  type="button"
                >
                  <span className="tenant-web__platform-studio-object-main">
                    <span className={`tenant-web__platform-studio-object-icon${modelIsStatic ? " tenant-web__platform-studio-object-icon--static" : ""}`}>
                      {modelIsStatic ? <DatabaseModelIcon /> : <FormIcon />}
                    </span>
                    <span className="tenant-web__platform-studio-object-copy">
                      <span className="tenant-web__platform-studio-object-title">{model.title}</span>
                      {model.description ? (
                        <span className="tenant-web__platform-studio-screen-description">{model.description}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="tenant-web__platform-studio-object-meta">
                    {typeof model.dataCount === "number" ? (
                      <Badge
                        appearance="soft"
                        aria-label={t("tenant.platformStudio.forms.modelDataCount", { count: model.dataCount })}
                        className="tenant-web__platform-studio-count-badge"
                        size="sm"
                        title={t("tenant.platformStudio.forms.modelDataCount", { count: model.dataCount })}
                        variant="neutral"
                      >
                        {model.dataCount}
                      </Badge>
                    ) : null}
                    {model.isStructureLocked ? (
                      <Badge
                        appearance="soft"
                        aria-label={t("tenant.platformStudio.forms.structureLocked")}
                        className="tenant-web__platform-studio-lock-badge"
                        size="sm"
                        title={t("tenant.platformStudio.forms.structureLocked")}
                        variant="warning"
                      >
                        <LockIcon />
                      </Badge>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </PlatformStudioPanelScroll>
      </CardContent>
    </Card>
  );
}
