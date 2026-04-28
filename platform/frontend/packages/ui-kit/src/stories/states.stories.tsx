import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Button,
  CollectionEmptyState,
  CollectionLoadingState,
  EmptyState,
  ErrorState,
  LoadingState,
  PlusIcon,
  SearchIcon,
} from "../index";
import { StoryGrid, StorySection, StoryStack } from "./story-helpers";

const meta = {
  title: "UI Kit/States",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyLoadingAndError: Story = {
  render: () => (
    <StoryStack>
      <StorySection description="State patterns should explain what happened and what the user can do next." title="Core states">
        <StoryGrid>
          <EmptyState
            actions={
              <Button leadingIcon={<PlusIcon />} size="sm">
                Add first field
              </Button>
            }
            description="Start by adding a field from the palette, then configure labels and validation."
            icon={<SearchIcon />}
            title="No fields yet"
          />

          <LoadingState
            description="Fetching schema, field palette, and saved authoring state."
            title="Loading workspace"
          />

          <ErrorState
            actions={
              <Button size="sm" variant="secondary">
                Try again
              </Button>
            }
            description="The workspace could not load. Check your connection and retry."
            title="Workspace unavailable"
          />
        </StoryGrid>
      </StorySection>

      <StorySection description="Collection states keep list and grid pages consistent." title="Collection states">
        <StoryGrid>
          <CollectionEmptyState
            actions={
              <Button size="sm" variant="secondary">
                Create template
              </Button>
            }
            description="Create a template or adjust filters to show more results."
            eyebrow="Forms"
            highlights={[
              { id: "drafts", label: "Drafts", tone: "warning", value: "3 need review" },
              { id: "active", label: "Active", tone: "success", value: "12 published" },
            ]}
            title="No matching forms"
          />

          <CollectionLoadingState
            description="Loading form templates and saved table preferences."
            items={3}
            layout="list"
            title="Loading forms"
          />
        </StoryGrid>
      </StorySection>
    </StoryStack>
  ),
};
