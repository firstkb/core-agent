import { useMemo } from "react";

import { useTranslation } from "@platform/i18n";

export type RuntimeFormLoadErrorLabels = {
  genericDescription: string;
  genericTitle: string;
  notFoundDescription: string;
  notFoundTitle: string;
};

export function useRuntimeFormLabels(isSubform: boolean) {
  const { t } = useTranslation();

  const rootRuntimeLabels = useMemo(() => ({
    backToList: t("tenant.runtime.forms.form.backToList"),
    booleanNo: t("tenant.runtime.forms.form.boolean.no"),
    booleanYes: t("tenant.runtime.forms.form.boolean.yes"),
    catalogEmpty: t("tenant.runtime.forms.form.catalog.empty"),
    catalogGroupOther: t("tenant.runtime.forms.form.catalog.groupOther"),
    catalogLoadError: t("tenant.runtime.forms.form.catalog.loadError"),
    catalogLoading: t("tenant.runtime.forms.form.catalog.loading"),
    catalogNoSelection: t("tenant.runtime.forms.form.catalog.noSelection"),
    catalogOpen: t("tenant.runtime.forms.form.catalog.open"),
    catalogRetry: t("tenant.runtime.forms.form.catalog.retry"),
    catalogSearchPlaceholder: t("tenant.runtime.forms.form.catalog.searchPlaceholder"),
    catalogSelect: t("tenant.runtime.forms.form.catalog.select"),
    clearSelection: t("tenant.runtime.forms.form.clearSelection"),
    createModeInfo: t("tenant.runtime.forms.form.createModeInfo"),
    createTitle: t("tenant.runtime.forms.form.createTitle"),
    editModeInfo: t("tenant.runtime.forms.form.editModeInfo"),
    editTitle: t("tenant.runtime.forms.form.editTitle"),
    emptyValue: t("tenant.runtime.forms.form.emptyValue"),
    finish: t("tenant.runtime.forms.form.finish"),
    finishBackInfoActionTemplate: t("tenant.runtime.forms.form.finishInfo.action"),
    finishBackInfoCreateBackTemplate: t("tenant.runtime.forms.form.finishInfo.createBack"),
    finishBackInfoEditBackTemplate: t("tenant.runtime.forms.form.finishInfo.editBack"),
    finishBackInfoStatusTemplate: t("tenant.runtime.forms.form.finishInfo.status"),
    generatedAccordionItemTitle: t("tenant.runtime.forms.form.generated.accordionItem"),
    generatedOutputLabel: t("tenant.runtime.forms.form.generated.output"),
    generatedSubformTitle: t("tenant.runtime.forms.form.generated.subform"),
    generatedTabTitle: t("tenant.runtime.forms.form.generated.tab"),
    invalidEmailError: t("tenant.runtime.forms.form.validation.invalidEmail"),
    invalidGeoPointError: t("tenant.runtime.forms.form.validation.invalidGeoPoint"),
    invalidMaskError: t("tenant.runtime.forms.form.validation.invalidMask"),
    invalidPhoneError: t("tenant.runtime.forms.form.validation.invalidPhone"),
    invalidUrlError: t("tenant.runtime.forms.form.validation.invalidUrl"),
    geoPointLocating: t("tenant.runtime.forms.form.geoPoint.locating"),
    geoPointMap: t("tenant.runtime.forms.form.geoPoint.map"),
    geoPointPlaceholder: t("tenant.runtime.forms.form.geoPoint.placeholder"),
    loadMore: t("tenant.runtime.forms.form.loadMore"),
    noOptions: t("tenant.runtime.forms.form.noOptions"),
    onlineFormTitle: t("tenant.runtime.forms.form.onlineTitle"),
    requiredError: t("tenant.runtime.forms.form.validation.required"),
    saveStates: {
      dirty: t("tenant.runtime.forms.form.saveStates.dirty"),
      error: t("tenant.runtime.forms.form.saveStates.error"),
      idle: t("tenant.runtime.forms.form.saveStates.idle"),
      saved: t("tenant.runtime.forms.form.saveStates.saved"),
      saving: t("tenant.runtime.forms.form.saveStates.saving"),
    },
    search: t("tenant.runtime.forms.form.search"),
    selectPlaceholder: t("tenant.runtime.forms.form.selectPlaceholder"),
    selectValuesPlaceholder: t("tenant.runtime.forms.form.selectValuesPlaceholder"),
    subformAdd: t("tenant.runtime.forms.form.subform.add"),
    subformDelete: t("tenant.runtime.forms.form.subform.delete"),
    subformEdit: t("tenant.runtime.forms.form.subform.edit"),
    subformEmpty: t("tenant.runtime.forms.form.subform.empty"),
    validationFillField: t("tenant.runtime.forms.form.validation.fillField"),
    validationFillFieldCorrectly: t("tenant.runtime.forms.form.validation.fillFieldCorrectly"),
  }), [t]);

  const runtimeLabels = useMemo(() => {
    if (!isSubform) {
      return rootRuntimeLabels;
    }
    return {
      ...rootRuntimeLabels,
      backToList: t("tenant.runtime.forms.form.subform.back"),
      createModeInfo: t("tenant.runtime.forms.form.subform.createModeInfo"),
      editModeInfo: t("tenant.runtime.forms.form.subform.editModeInfo"),
      finish: t("tenant.runtime.forms.form.subform.save"),
      onlineFormTitle: t("tenant.runtime.forms.form.subform.title"),
    };
  }, [isSubform, rootRuntimeLabels, t]);

  const loadErrorLabels = useMemo<RuntimeFormLoadErrorLabels>(() => ({
    genericDescription: t("tenant.runtime.forms.form.loadError.genericDescription"),
    genericTitle: t("tenant.runtime.forms.form.loadError.genericTitle"),
    notFoundDescription: t("tenant.runtime.forms.form.loadError.notFoundDescription"),
    notFoundTitle: t("tenant.runtime.forms.form.loadError.notFoundTitle"),
  }), [t]);

  return {
    loadErrorLabels,
    runtimeLabels,
  };
}
