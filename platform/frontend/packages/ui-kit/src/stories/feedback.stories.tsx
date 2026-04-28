import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeaderBody,
  CardTitle,
  InfoCircleIcon,
  WarningTriangleIcon,
} from "../index";
import { StoryGrid, StorySection, StoryStack } from "./story-helpers";

const meta = {
  title: "UI Kit/Feedback",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AlertsBadgesAndCards: Story = {
  render: () => (
    <StoryStack>
      <StorySection description="Alert tone and action hierarchy should be legible without custom page CSS." title="Alerts">
        <div style={{ display: "grid", gap: "12px", width: "100%" }}>
          <Alert tone="info">
            <AlertIcon>
              <InfoCircleIcon />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>Authoring draft saved</AlertTitle>
              <AlertDescription>Runtime apply has not been published for this form yet.</AlertDescription>
            </AlertBody>
            <AlertActions>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </AlertActions>
          </Alert>

          <Alert tone="warning">
            <AlertIcon>
              <WarningTriangleIcon />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>Some fields need attention</AlertTitle>
              <AlertDescription>Resolve validation warnings before enabling runtime access.</AlertDescription>
            </AlertBody>
          </Alert>
        </div>
      </StorySection>

      <StorySection description="Badges communicate compact status and category metadata." title="Badges">
        <Badge dot variant="neutral">
          Draft
        </Badge>
        <Badge appearance="solid" variant="brand">
          Platform Studio
        </Badge>
        <Badge variant="success">Ready</Badge>
        <Badge variant="warning">Needs review</Badge>
        <Badge variant="danger">Blocked</Badge>
      </StorySection>

      <StorySection description="Cards are neutral containers; product workflow belongs outside the primitive." title="Cards">
        <StoryGrid>
          <Card>
            <CardHeader>
              <CardHeaderBody>
                <CardTitle>Inspection template</CardTitle>
                <CardDescription>Reusable form configuration for tenant operators.</CardDescription>
              </CardHeaderBody>
              <Badge variant="success">Active</Badge>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>18 fields, 4 visibility rules, 2 saved views.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">
                Open
              </Button>
            </CardFooter>
          </Card>

          <Card variant="accent">
            <CardHeader>
              <CardHeaderBody>
                <CardTitle>Ready for review</CardTitle>
                <CardDescription>Accent cards should stay restrained and readable.</CardDescription>
              </CardHeaderBody>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>Use accent only when the panel needs local emphasis.</p>
            </CardContent>
          </Card>
        </StoryGrid>
      </StorySection>
    </StoryStack>
  ),
};
