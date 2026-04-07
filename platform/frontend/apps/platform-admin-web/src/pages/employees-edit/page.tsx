import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldHint,
  FieldLabel,
  Input,
  Select,
} from "@platform/ui-kit";
import {
  ApiClientError,
  createAdminEmployeesClient,
  isUnauthorizedApiError,
  type AdminEmployee,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import { useNavigate, useParams } from "react-router-dom";

const employeesListPath = "/admin/users";

type EmployeeFormState = {
  name: string;
  phone: string;
  status: string;
};

function normalizeEmployeeStatus(status?: string) {
  return status?.trim().toLowerCase() === "disabled" ? "disabled" : "active";
}

function createFormState(employee: AdminEmployee | null): EmployeeFormState {
  return {
    name: employee?.name?.trim() ?? "",
    phone: employee?.phone?.trim() ?? "",
    status: normalizeEmployeeStatus(employee?.status),
  };
}

function formatRoleLabel(employee: AdminEmployee | null) {
  if (employee?.role?.trim()) {
    return employee.role
      .split(/[_\-\s]+/)
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
      .join(" ");
  }

  const level = typeof employee?.level === "number" ? employee.level : 0;
  if (level >= 100) {
    return "Root";
  }
  if (level >= 80) {
    return "Admin";
  }
  if (level >= 60) {
    return "Support";
  }
  return "Readonly";
}

function formatStatusLabel(status?: string) {
  return normalizeEmployeeStatus(status) === "disabled" ? "Disabled" : "Active";
}

function getStatusVariant(status?: string) {
  return normalizeEmployeeStatus(status) === "disabled" ? "warning" : "success";
}

function formatCreatedAt(value?: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeRequestError(error: unknown) {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}

function isDirty(employee: AdminEmployee | null, formState: EmployeeFormState) {
  const initialState = createFormState(employee);

  return initialState.name !== formState.name ||
    initialState.phone !== formState.phone ||
    initialState.status !== formState.status;
}

export function AdminEmployeeEditPage({
  adminApiUrl,
}: {
  adminApiUrl: string;
}) {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { getAccessToken, signOut } = useAuth();
  const client = useMemo(
    () => createAdminEmployeesClient(adminApiUrl),
    [adminApiUrl],
  );
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [formState, setFormState] = useState<EmployeeFormState>(createFormState(null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployee() {
      if (!userId) {
        setError("Employee id is missing.");
        setLoading(false);
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        void signOut();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.getEmployee(accessToken, userId);
        if (cancelled) {
          return;
        }

        setEmployee(response.user);
        setFormState(createFormState(response.user));
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedApiError(requestError)) {
          void signOut();
          return;
        }

        setError(normalizeRequestError(requestError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [client, getAccessToken, signOut, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setError("Employee id is missing.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      void signOut();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await client.updateEmployee(accessToken, userId, {
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        status: normalizeEmployeeStatus(formState.status),
      });

      setEmployee(response.user);
      setFormState(createFormState(response.user));
    } catch (requestError) {
      if (isUnauthorizedApiError(requestError)) {
        void signOut();
        return;
      }

      setError(normalizeRequestError(requestError));
    } finally {
      setSaving(false);
    }
  }

  const roleLabel = formatRoleLabel(employee);
  const statusLabel = formatStatusLabel(employee?.status);
  const dirty = isDirty(employee, formState);

  return (
    <div className="admin-web__stack">
      <Card>
        <CardHeader>
          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <Badge size="sm" variant="brand">Host-managed action</Badge>
            <Badge appearance="outline" size="sm" variant="neutral">Platform admin user</Badge>
            {employee?.isCurrentUser ? (
              <Badge appearance="soft" size="sm" variant="info">Current session</Badge>
            ) : null}
          </div>
          <div>
            <CardTitle>{loading ? "Loading employee" : employee?.name?.trim() || employee?.email || "Edit employee"}</CardTitle>
            <CardDescription>
              Edit the platform admin user record behind the Employees collection surface.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="admin-web__stack">
          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <Badge appearance="soft" variant="brand">{roleLabel}</Badge>
            <Badge appearance="soft" variant={getStatusVariant(employee?.status)}>{statusLabel}</Badge>
          </div>

          {error ? (
            <Alert appearance="outline" tone="danger">
              <AlertBody>
                <AlertTitle>Unable to save employee</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </AlertBody>
            </Alert>
          ) : null}

          <div className="admin-web__surface-summary-card">
            <p className="admin-web__surface-summary-label">Employee id</p>
            <p className="admin-web__surface-summary-value">{employee?.id ?? userId ?? "Missing route param"}</p>
          </div>

          <div className="admin-web__surface-summary-card">
            <p className="admin-web__surface-summary-label">Created</p>
            <p className="admin-web__surface-summary-value">{formatCreatedAt(employee?.createdAt)}</p>
          </div>

          <form className="admin-web__stack" onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="employee-email">Email</FieldLabel>
              <Input
                disabled
                id="employee-email"
                readOnly
                value={employee?.email ?? ""}
              />
              <FieldHint>Email stays read-only because it is also used by the admin auth flow.</FieldHint>
            </Field>

            <Field>
              <FieldLabel htmlFor="employee-name">Name</FieldLabel>
              <Input
                id="employee-name"
                onChange={(event) => setFormState((currentValue) => ({
                  ...currentValue,
                  name: event.target.value,
                }))}
                placeholder="Employee name"
                value={formState.name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="employee-phone">Phone</FieldLabel>
              <Input
                id="employee-phone"
                onChange={(event) => setFormState((currentValue) => ({
                  ...currentValue,
                  phone: event.target.value,
                }))}
                placeholder="Phone number"
                value={formState.phone}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="employee-status">Status</FieldLabel>
              <Select
                disabled={employee?.isCurrentUser}
                id="employee-status"
                onChange={(event) => setFormState((currentValue) => ({
                  ...currentValue,
                  status: event.target.value,
                }))}
                value={formState.status}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </Select>
              <FieldHint>
                {employee?.isCurrentUser
                  ? "You can edit your own profile fields here, but status changes stay locked to avoid breaking the current admin session."
                  : "Status changes here use the same active/disabled contract as the Employees bulk action bar."}
              </FieldHint>
            </Field>

            <div className="admin-web__toolbar admin-web__toolbar--compact">
              <Button
                onClick={() => navigate(employeesListPath)}
                size="sm"
                variant="outline"
              >
                Back to employees list
              </Button>
              <Button disabled={!dirty || loading} pending={saving} size="sm" type="submit">
                Save employee
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
