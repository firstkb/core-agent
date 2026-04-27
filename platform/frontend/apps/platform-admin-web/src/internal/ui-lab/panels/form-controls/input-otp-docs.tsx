import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  InputOtp,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";

export function renderInputOtpDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Slot layouts</CardTitle>
          <CardDescription>Input OTP should stay compact, readable, and predictable whether the code is continuous or visually grouped.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Numeric">
            <InputOtp autoFocus defaultValue="482913" id="ui-lab-input-otp-numeric" name="ui-lab-input-otp-numeric" />
          </ShowcaseRow>
          <ShowcaseRow label="Grouped" stacked>
            <InputOtp defaultValue="763918" id="ui-lab-input-otp-grouped" name="ui-lab-input-otp-grouped" separatorAfter={[3]} />
          </ShowcaseRow>
          <ShowcaseRow label="Alpha-numeric" stacked>
            <InputOtp defaultValue="A7Q4" id="ui-lab-input-otp-alpha" kind="alphanumeric" length={4} name="ui-lab-input-otp-alpha" />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation and field usage</CardTitle>
          <CardDescription>Verification-code entry still needs a normal field shell, helper text, and invalid treatment instead of an auth-screen-specific wrapper.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Field shell" stacked>
            <Field required>
              <FieldLabel htmlFor="ui-lab-input-otp-field-slot-1" id="ui-lab-input-otp-field-label">
                Approval code
              </FieldLabel>
              <InputOtp
                aria-labelledby="ui-lab-input-otp-field-label"
                defaultValue="932781"
                id="ui-lab-input-otp-field"
                name="ui-lab-input-otp-field"
                separatorAfter={[3]}
              />
              <FieldHint>Codes may be pasted in one action and will fill sequentially across slots.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Invalid" stacked>
            <Field invalid>
              <FieldLabel htmlFor="ui-lab-input-otp-invalid-slot-1" id="ui-lab-input-otp-invalid-label">
                Verification code
              </FieldLabel>
              <InputOtp
                aria-labelledby="ui-lab-input-otp-invalid-label"
                defaultValue="12"
                id="ui-lab-input-otp-invalid"
                invalid
                length={6}
                name="ui-lab-input-otp-invalid"
              />
              <FieldError>Enter the full 6-character verification code.</FieldError>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Disabled" stacked>
            <InputOtp defaultValue="847520" disabled id="ui-lab-input-otp-disabled" name="ui-lab-input-otp-disabled" />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared multi-slot code-entry primitive used by verification and short approval flows.", [
        { name: "length", type: "number", notes: "Defines how many slots are rendered for the code entry contract." },
        { name: "kind", type: "\"numeric\" | \"alphanumeric\"", notes: "Controls sanitization and casing without introducing separate auth-specific variants." },
        { name: "separatorAfter", type: "number[]", notes: "Adds quiet visual grouping between slot ranges while keeping the underlying entry model the same." },
        { name: "value / defaultValue / onValueChange", type: "string / callback", notes: "Supports controlled or uncontrolled code entry with sequential paste and slot navigation." },
        { name: "invalid / disabled / autoFocus", type: "boolean", notes: "Covers the stable slot-level state surface without turning the primitive into a workflow shell." },
      ])}

      {renderReferenceNotesCard(
        "Input OTP should stay a small code-entry primitive instead of becoming an authentication screen abstraction.",
        [
          "The stable anatomy is a slot group with one-character fields and optional quiet separators between slot clusters.",
          "Input sanitization belongs to the primitive because numeric and alphanumeric code entry are part of the stable interaction contract.",
          "Field labels, helper text, and error messages still belong to the surrounding field shell rather than bespoke OTP variants.",
        ],
        [
          "Use `length` and `kind` before introducing separate one-time-code component families.",
          "Keep visual grouping subtle through `separatorAfter` instead of screen-specific card or auth layout chrome.",
          "Treat paste, arrow-key navigation, and slot backspace handling as core behavior, not optional page logic.",
        ],
        [
          "The slot group still needs a visible group label or an equivalent accessible name outside placeholder text.",
          "Validation should remain readable through field error text, not slot border color alone.",
          "Do not force one-character entry when a normal text field would communicate better for the task.",
        ],
      )}

      {renderUsageReviewCard(
        "Input OTP works best for short verification or approval codes where multi-slot entry improves scanning and error recovery.",
        [
          "The user is entering a fixed-length code such as a verification token or operator approval code.",
          "Paste handling and quick left-right correction matter more than free-form text entry.",
        ],
        [
          "Keep the slot count explicit and close to the real code format.",
          "Use the field shell for hint and error messaging instead of turning the primitive into an auth template.",
          "Prefer the default compact layout before inventing branded code-entry wrappers.",
        ],
        [
          "Do not use input OTP for values that vary heavily in length or behave like normal text.",
          "Do not hide the required code format in color or slot count alone without a readable label.",
          "Do not couple the primitive to one product flow such as login or onboarding.",
        ],
      )}
    </div>
  );
}
