import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { ApiClientError, isUnauthorizedApiError } from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  CollectionTablePage,
  formatCollectionTableCellValue,
  type CollectionTableColumnDefinition,
  type CollectionTableRowData,
} from "@platform/collection-table";
import { useTranslation } from "@platform/i18n";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useTenantRuntimeConfig } from "../../../app/tenant-runtime-config-context";
import { useTenantFavoritesRefresh } from "../../../shared/tenant-favorites-refresh";
import {
  createFormRuntimeCollectionTableAdapter,
  createFormRuntimeCollectionTableClient,
  type FormRuntimeRecordField,
  type FormRuntimeRecordResponse,
  type FormRuntimeRecordSubtable,
} from "../form-runtime-collection-table-client";
import { formRuntimePaths } from "../form-runtime-route-meta";
import "./form-runtime.css";

function PrintIcon() {
  return (
    <svg
      aria-hidden="true"
      className="tenant-web__form-runtime-print-button-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="1rem"
      height="1rem"
    >
      <path d="M7 9V4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V9" />
      <path d="M6.25 17H5a2 2 0 0 1-2-2v-3.5a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 0 1 2.5 2.5V15a2 2 0 0 1-2 2h-1.25" />
      <path d="M8 14h8v6H8z" />
      <path d="M17.25 11.75h.01" />
    </svg>
  );
}

function RuntimeRecordPrintView({
  record,
  t,
}: {
  record: FormRuntimeRecordResponse;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div aria-hidden="true" className="tenant-web__form-runtime-print-root">
      <div className="tenant-web__form-runtime-print-sheet">
        <h1 className="tenant-web__form-runtime-print-title">{record.title || t("tenant.runtime.forms.record.title")}</h1>
        <RuntimeRecordDialogBody record={record} t={t} />
      </div>
    </div>,
    document.body,
  );
}

function formatRuntimeRecordValue(field: FormRuntimeRecordField) {
  const normalizedValue = field.value?.trim() ?? "";
  if (!normalizedValue) {
    return "\u2014";
  }
  return formatCollectionTableCellValue(normalizedValue, field.type);
}

function formatRuntimeSubtableValue(column: CollectionTableColumnDefinition, row: CollectionTableRowData) {
  const cell = row.cells[column.fieldId ?? column.id];
  if (!cell) {
    return "\u2014";
  }

  const rawValue = typeof cell.displayValue === "string" && cell.displayValue.trim().length > 0
    ? cell.displayValue
    : typeof cell.value === "string"
      ? cell.value
      : String(cell.value ?? "");
  if (!rawValue.trim()) {
    return "\u2014";
  }

  return formatCollectionTableCellValue(rawValue, column.type === "actions" ? "text" : column.type);
}

function RuntimeRecordDialogBody({
  record,
  t,
}: {
  record: FormRuntimeRecordResponse;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const fields = Array.isArray(record.fields) ? record.fields : [];
  const subtables = Array.isArray(record.subtables) ? record.subtables : [];

  if (fields.length === 0 && subtables.length === 0) {
    return <p className="tenant-web__form-runtime-record-empty">{t("tenant.runtime.forms.record.empty")}</p>;
  }

  return (
    <div className="tenant-web__form-runtime-record-layout">
      {fields.length > 0 ? (
        <section className="tenant-web__form-runtime-record-section">
          <div className="tenant-web__form-runtime-record-grid">
            {fields.map((field) => (
              <div className="tenant-web__form-runtime-record-row" key={field.id}>
                <div className="tenant-web__form-runtime-record-label">{field.label}</div>
                <div className="tenant-web__form-runtime-record-value">{formatRuntimeRecordValue(field)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {subtables.map((subtable) => {
        const columns: ReadonlyArray<CollectionTableColumnDefinition> = Array.isArray(subtable.columns) ? subtable.columns : [];
        const rows: ReadonlyArray<CollectionTableRowData> = Array.isArray(subtable.rows) ? subtable.rows : [];

        return (
          <section className="tenant-web__form-runtime-record-section" key={subtable.id}>
            <div className="tenant-web__form-runtime-record-subtable-header">
              <h3 className="tenant-web__form-runtime-record-subtable-title">{subtable.title}</h3>
            </div>
            <div className="tenant-web__form-runtime-record-subtable-scroll">
              <table className="tenant-web__form-runtime-record-subtable">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.id} scope="col">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows.map((row) => (
                    <tr key={row.id}>
                      {columns.map((column) => (
                        <td key={column.id}>{formatRuntimeSubtableValue(column, row)}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td className="tenant-web__form-runtime-record-subtable-empty" colSpan={Math.max(columns.length, 1)}>
                        {t("tenant.runtime.forms.record.emptySubtable")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function FormsRuntimeListPage({
  entryContext = "runtime",
}: {
  entryContext?: "preview" | "runtime";
}) {
  const { t } = useTranslation();
  const params = useParams();
  const modelId = params.modelId?.trim() ?? "";
  const viewId = params.viewId?.trim() ?? "";
  const routeDocGuid = params.docGuid?.trim() ?? "";
  const navigate = useNavigate();
  const runtimeConfig = useTenantRuntimeConfig();
  const onFavoritesRefresh = useTenantFavoritesRefresh();
  const { getAccessToken, signOut } = useAuth();
  const [activeDocGuid, setActiveDocGuid] = useState(routeDocGuid);
  const [record, setRecord] = useState<FormRuntimeRecordResponse | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);

  const client = useMemo(
    () => modelId && viewId
      ? createFormRuntimeCollectionTableClient({
        baseUrl: runtimeConfig.tenantApiUrl,
        modelId,
        routeContext: entryContext,
        viewId,
      })
      : null,
    [entryContext, modelId, runtimeConfig.tenantApiUrl, viewId],
  );
  const adapter = useMemo(
    () => client
      ? createFormRuntimeCollectionTableAdapter({
        client,
        getAccessToken,
        onUnauthorized: () => {
          void signOut();
        },
      })
      : null,
    [client, getAccessToken, signOut],
  );

  if (!modelId || !viewId || !adapter) {
    return <Navigate replace to="/dashboard" />;
  }

  useEffect(() => {
    setActiveDocGuid(routeDocGuid);
  }, [routeDocGuid]);

  useEffect(() => {
    if (!activeDocGuid || !client) {
      setRecord(null);
      setRecordError(null);
      setRecordLoading(false);
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      void signOut();
      return;
    }

    let cancelled = false;
    setRecordLoading(true);
    setRecordError(null);

    void client.loadRecord(accessToken, activeDocGuid)
      .then((nextRecord) => {
        if (cancelled) {
          return;
        }
        setRecord(nextRecord);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }
        if (isUnauthorizedApiError(requestError)) {
          void signOut();
          return;
        }
        if (requestError instanceof ApiClientError && requestError.statusCode === 404) {
          setRecordError(t("tenant.runtime.forms.record.notFound"));
          setRecord(null);
          return;
        }
        setRecordError(t("tenant.runtime.forms.record.loadFailed"));
        setRecord(null);
      })
      .finally(() => {
        if (!cancelled) {
          setRecordLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDocGuid, client, getAccessToken, signOut, t]);

  return (
    <div className="tenant-web__form-runtime-list-page">
      <CollectionTablePage
        adapter={adapter}
        isIgnorableError={isUnauthorizedApiError}
        key={`${entryContext}:${modelId}:${viewId}`}
        onFrontendRowAction={(action, row) => {
          if (action.id === "view") {
            setActiveDocGuid(row.id);
          }
        }}
        onFavoriteToggleSuccess={onFavoritesRefresh}
        tableId={`form-runtime:${modelId}:${viewId}`}
      />
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setActiveDocGuid("");
            if (routeDocGuid) {
              navigate(formRuntimePaths.list(modelId, viewId), { replace: true });
            }
          }
        }}
        open={Boolean(activeDocGuid)}
        surfaceClassName="tenant-web__form-runtime-record-surface"
      >
        <DialogContent className="tenant-web__form-runtime-record-dialog">
          <DialogHeader className="tenant-web__form-runtime-record-header">
            <div>
              <DialogTitle>{record?.title || t("tenant.runtime.forms.record.title")}</DialogTitle>
            </div>
            <Button
              leadingIcon={<PrintIcon />}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
              size="sm"
              type="button"
              variant="primary"
            >
              {t("tenant.runtime.forms.record.print")}
            </Button>
          </DialogHeader>
          <DialogBody className="tenant-web__form-runtime-record-body">
            {recordLoading ? (
              <p className="tenant-web__form-runtime-record-state">{t("tenant.runtime.forms.record.loading")}</p>
            ) : recordError ? (
              <p className="tenant-web__form-runtime-record-state tenant-web__form-runtime-record-state--error">{recordError}</p>
            ) : record ? (
              <RuntimeRecordDialogBody record={record} t={t} />
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
      {record ? <RuntimeRecordPrintView record={record} t={t} /> : null}
    </div>
  );
}
