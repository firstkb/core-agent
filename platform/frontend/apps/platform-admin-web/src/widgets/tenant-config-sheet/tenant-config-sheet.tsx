import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  Badge,
  Button,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
  FormShell,
  Input,
  Select,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@platform/ui-kit";
import { tenantStatusToBadgeVariant } from "@platform/tenant-core";
import type { TenantSummary } from "@platform/tenant-core";

type TenantConfigSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantSummary | null;
};

type TenantConfigFormState = {
  tenantHost: string;
  owner: string;
  authMode: string;
  releaseTrack: string;
  syncProfile: string;
  supportWebhook: string;
  notes: string;
};

type TenantConfigFormErrors = Partial<Record<keyof TenantConfigFormState, string>>;

function getAuthModeValue(tenant: TenantSummary) {
  if (tenant.plan === "Enterprise") return "sso_fallback";
  if (tenant.plan === "Growth") return "password_invites";
  return "password_only";
}

function getReleaseTrackValue(tenant: TenantSummary) {
  if (tenant.plan === "Enterprise") return "stable_preview";
  if (tenant.plan === "Growth") return "stable_monthly";
  return "stable_quarterly";
}

function getSyncProfileValue(tenant: TenantSummary) {
  if (tenant.status === "active") return "continuous_alerting";
  if (tenant.status === "trial") return "observed_onboarding";
  return "manual_checkpoint";
}

function createInitialFormState(tenant: TenantSummary): TenantConfigFormState {
  return {
    tenantHost: `${tenant.slug}.platform.localhost`,
    owner: `${tenant.name} Ops`,
    authMode: getAuthModeValue(tenant),
    releaseTrack: getReleaseTrackValue(tenant),
    syncProfile: getSyncProfileValue(tenant),
    supportWebhook: `https://${tenant.slug}.platform.localhost/hooks/ops`,
    notes:
      tenant.status === "trial"
        ? "Confirm onboarding ownership before promoting this tenant to active."
        : tenant.status === "paused"
          ? "Resolve rollout blocker and verify latest known-good config before resuming."
          : "Keep config drift under review before enabling additional release exposure.",
  };
}

function validateTenantConfigForm(formState: TenantConfigFormState): TenantConfigFormErrors {
  const errors: TenantConfigFormErrors = {};
  const hostPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

  if (!hostPattern.test(formState.tenantHost.trim())) {
    errors.tenantHost = "Use a valid host such as demo.platform.localhost.";
  }

  if (formState.owner.trim().length < 3) {
    errors.owner = "Operations owner must be at least 3 characters.";
  }

  if (!formState.authMode) {
    errors.authMode = "Pick an auth mode.";
  }

  if (!formState.releaseTrack) {
    errors.releaseTrack = "Pick a release track.";
  }

  if (!formState.syncProfile) {
    errors.syncProfile = "Pick a sync profile.";
  }

  if (formState.supportWebhook.trim() && !formState.supportWebhook.trim().startsWith("https://")) {
    errors.supportWebhook = "Webhook must start with https://";
  }

  if (formState.notes.trim().length > 240) {
    errors.notes = "Keep operational notes under 240 characters.";
  }

  return errors;
}

export function TenantConfigSheet({
  open,
  onOpenChange,
  tenant,
}: TenantConfigSheetProps) {
  if (!tenant) return null;

  const [formState, setFormState] = useState<TenantConfigFormState>(() => createInitialFormState(tenant));
  const [errors, setErrors] = useState<TenantConfigFormErrors>({});

  useEffect(() => {
    if (!open) return;

    setFormState(createInitialFormState(tenant));
    setErrors({});
  }, [open, tenant]);

  function updateField<Key extends keyof TenantConfigFormState>(field: Key, value: TenantConfigFormState[Key]) {
    setFormState((currentState) => {
      const nextState = { ...currentState, [field]: value };

      if (Object.keys(errors).length > 0) {
        setErrors(validateTenantConfigForm(nextState));
      }

      return nextState;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateTenantConfigForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open} side="right">
      <SheetContent>
        <SheetHeader>
          <div className="admin-web__surface-header-copy">
            <SheetTitle>{tenant.name} config</SheetTitle>
            <SheetDescription>
              Side-sheet pattern adapted from Metronic donor flows and rewritten for tenant configuration review.
            </SheetDescription>
          </div>
          <Badge appearance="soft" variant={tenantStatusToBadgeVariant(tenant.status)}>
            {tenant.status}
          </Badge>
        </SheetHeader>

        <SheetBody>
          <FormShell id="tenant-config-form" onSubmit={handleSubmit}>
            <FormSection>
              <FormSectionHeader>
                <FormSectionTitle>Access</FormSectionTitle>
                <FormSectionDescription>
                  Field layout adapted from Metronic form sheets, but rewritten for tenant configuration review.
                </FormSectionDescription>
              </FormSectionHeader>

              <FormGrid>
                <Field invalid={Boolean(errors.tenantHost)}>
                  <FieldLabel htmlFor="tenant-host">Tenant host</FieldLabel>
                  <Input
                    id="tenant-host"
                    invalid={Boolean(errors.tenantHost)}
                    onChange={(event) => updateField("tenantHost", event.target.value)}
                    value={formState.tenantHost}
                  />
                  {errors.tenantHost ? (
                    <FieldError>{errors.tenantHost}</FieldError>
                  ) : (
                    <FieldHint>Subdomain host used by tenant routing and local environment overlays.</FieldHint>
                  )}
                </Field>

                <Field invalid={Boolean(errors.owner)}>
                  <FieldLabel htmlFor="tenant-owner">Operations owner</FieldLabel>
                  <Input
                    id="tenant-owner"
                    invalid={Boolean(errors.owner)}
                    onChange={(event) => updateField("owner", event.target.value)}
                    value={formState.owner}
                  />
                  {errors.owner ? (
                    <FieldError>{errors.owner}</FieldError>
                  ) : (
                    <FieldHint>Named owner for rollout, support, and post-release follow-up.</FieldHint>
                  )}
                </Field>
              </FormGrid>

              <FormGrid>
                <Field invalid={Boolean(errors.authMode)}>
                  <FieldLabel htmlFor="tenant-auth-mode">Auth mode</FieldLabel>
                  <Select
                    id="tenant-auth-mode"
                    invalid={Boolean(errors.authMode)}
                    onChange={(event) => updateField("authMode", event.target.value)}
                    value={formState.authMode}
                  >
                    <option value="password_only">Password only</option>
                    <option value="password_invites">Password + invited access</option>
                    <option value="sso_fallback">SSO + password fallback</option>
                  </Select>
                  {errors.authMode ? <FieldError>{errors.authMode}</FieldError> : null}
                </Field>

                <Field invalid={Boolean(errors.supportWebhook)}>
                  <FieldLabel htmlFor="tenant-support-webhook">Support webhook</FieldLabel>
                  <Input
                    id="tenant-support-webhook"
                    invalid={Boolean(errors.supportWebhook)}
                    onChange={(event) => updateField("supportWebhook", event.target.value)}
                    value={formState.supportWebhook}
                  />
                  {errors.supportWebhook ? (
                    <FieldError>{errors.supportWebhook}</FieldError>
                  ) : (
                    <FieldHint>Optional escalation endpoint for operational alerts.</FieldHint>
                  )}
                </Field>
              </FormGrid>
            </FormSection>

            <FormSection>
              <FormSectionHeader>
                <FormSectionTitle>Delivery</FormSectionTitle>
                <FormSectionDescription>
                  Keep release posture and sync policy explicit to reduce hidden tenant-specific behavior.
                </FormSectionDescription>
              </FormSectionHeader>

              <FormGrid>
                <Field invalid={Boolean(errors.releaseTrack)}>
                  <FieldLabel htmlFor="tenant-release-track">Release track</FieldLabel>
                  <Select
                    id="tenant-release-track"
                    invalid={Boolean(errors.releaseTrack)}
                    onChange={(event) => updateField("releaseTrack", event.target.value)}
                    value={formState.releaseTrack}
                  >
                    <option value="stable_quarterly">Stable quarterly</option>
                    <option value="stable_monthly">Stable monthly</option>
                    <option value="stable_preview">Stable + preview canaries</option>
                  </Select>
                  {errors.releaseTrack ? <FieldError>{errors.releaseTrack}</FieldError> : null}
                </Field>

                <Field invalid={Boolean(errors.syncProfile)}>
                  <FieldLabel htmlFor="tenant-sync-profile">Sync profile</FieldLabel>
                  <Select
                    id="tenant-sync-profile"
                    invalid={Boolean(errors.syncProfile)}
                    onChange={(event) => updateField("syncProfile", event.target.value)}
                    value={formState.syncProfile}
                  >
                    <option value="manual_checkpoint">Manual sync with operator checkpoint</option>
                    <option value="observed_onboarding">Observed sync with onboarding review</option>
                    <option value="continuous_alerting">Continuous sync with alerting</option>
                  </Select>
                  {errors.syncProfile ? <FieldError>{errors.syncProfile}</FieldError> : null}
                </Field>
              </FormGrid>

              <div className="admin-web__surface-section">
                <h4 className="admin-web__surface-section-title">Regions</h4>
                <div className="admin-web__tenant-detail-tags">
                  {tenant.regions.map((region) => (
                    <Badge appearance="outline" key={region} variant="neutral">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            </FormSection>

            <FormSection>
              <FormSectionHeader>
                <FormSectionTitle>Operational Notes</FormSectionTitle>
                <FormSectionDescription>
                  Validation states should stay visible for free-form notes and handoff context.
                </FormSectionDescription>
              </FormSectionHeader>

              <Field invalid={Boolean(errors.notes)}>
                <FieldLabel htmlFor="tenant-notes">Notes</FieldLabel>
                <Textarea
                  id="tenant-notes"
                  invalid={Boolean(errors.notes)}
                  onChange={(event) => updateField("notes", event.target.value)}
                  resize="vertical"
                  value={formState.notes}
                />
                {errors.notes ? (
                  <FieldError>{errors.notes}</FieldError>
                ) : (
                  <FieldHint>{formState.notes.trim().length}/240 characters</FieldHint>
                )}
              </Field>
            </FormSection>
          </FormShell>
        </SheetBody>

        <SheetFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Close
          </Button>
          <Button form="tenant-config-form" type="submit" variant="outline">
            Save draft
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
