import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Checkbox,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
  Input,
  InputAddon,
  InputGroup,
  Select,
  Switch,
  Textarea,
} from "../index";
import { StorySection, StoryStack } from "./story-helpers";

const meta = {
  title: "UI Kit/Form Controls",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controls: Story = {
  render: () => (
    <StoryStack>
      <StorySection description="Field rhythm, labels, helper text, and invalid states must stay consistent." title="Fields">
        <div style={{ maxWidth: "760px", width: "100%" }}>
          <FormGrid columns={2}>
            <Field required>
              <FieldLabel htmlFor="story-name">Inspection name</FieldLabel>
              <Input id="story-name" placeholder="Daily safety walkthrough" />
              <FieldHint>Use a clear name that will be visible to operators.</FieldHint>
            </Field>

            <Field invalid required>
              <FieldLabel htmlFor="story-code">Reference code</FieldLabel>
              <Input id="story-code" invalid placeholder="VSM-001" />
              <FieldError>Reference code is required.</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="story-status">Status</FieldLabel>
              <Select defaultValue="draft" id="story-status">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="story-score">Score range</FieldLabel>
              <InputGroup>
                <InputAddon>0</InputAddon>
                <Input id="story-score" placeholder="100" />
                <InputAddon>pts</InputAddon>
              </InputGroup>
            </Field>
          </FormGrid>
        </div>
      </StorySection>

      <StorySection description="Textarea should remain readable and bounded in dense editor panels." title="Long copy">
        <div style={{ maxWidth: "520px", width: "100%" }}>
          <Field>
            <FieldLabel htmlFor="story-notes">Instructions</FieldLabel>
            <Textarea
              id="story-notes"
              placeholder="Describe what the user should check before submitting this step."
              rows={4}
            />
          </Field>
        </div>
      </StorySection>

      <StorySection description="Boolean controls need obvious checked, unchecked, disabled, and indeterminate states." title="Booleans">
        <label style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
          <Checkbox defaultChecked />
          Required
        </label>
        <label style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
          <Checkbox indeterminate />
          Mixed
        </label>
        <label style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
          <Switch defaultChecked />
          Active
        </label>
        <label style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
          <Switch disabled />
          Disabled
        </label>
      </StorySection>
    </StoryStack>
  ),
};
