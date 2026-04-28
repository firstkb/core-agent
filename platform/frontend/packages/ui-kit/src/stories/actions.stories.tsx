import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArrowRightIcon, Button, PlusIcon, SplitButton } from "../index";
import { StorySection, StoryStack } from "./story-helpers";

const meta = {
  title: "UI Kit/Actions",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => (
    <StoryStack>
      <StorySection
        description="Stable button variants used for primary, secondary, status, and destructive actions."
        title="Variants"
      >
        <Button leadingIcon={<PlusIcon />}>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="info">Info</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="danger">Danger</Button>
      </StorySection>

      <StorySection description="Sizes and pending/disabled states should stay visually distinct." title="States">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg" trailingIcon={<ArrowRightIcon />}>
          Large
        </Button>
        <Button pending>Saving</Button>
        <Button disabled>Disabled</Button>
      </StorySection>

      <StorySection description="SplitButton keeps the default action visible and secondary actions grouped." title="Split action">
        <SplitButton
          items={[
            { id: "draft", label: "Save draft", shortcut: "Cmd+S" },
            { id: "duplicate", label: "Duplicate" },
            { id: "archive", label: "Archive", tone: "danger" },
          ]}
          leadingIcon={<PlusIcon />}
          menuLabel="More actions"
        >
          Create form
        </SplitButton>
      </StorySection>
    </StoryStack>
  ),
};
