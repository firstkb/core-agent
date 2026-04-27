import {
  ArrowRightIcon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckCircleIcon,
  InfoCircleIcon,
  PlusIcon,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";

export function renderToggleDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Variants and sizes</CardTitle>
          <CardDescription>Toggle should stay compact and legible whether it is used as a plain pressed control or as an outlined choice.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <Toggle size="sm">Small</Toggle>
            <Toggle defaultPressed>Pressed</Toggle>
            <Toggle leadingIcon={<PlusIcon />}>With icon</Toggle>
            <Toggle size="lg" trailingIcon={<ArrowRightIcon />}>
              Large
            </Toggle>
          </ShowcaseRow>
          <ShowcaseRow label="Outline">
            <Toggle variant="outline">Overview</Toggle>
            <Toggle defaultPressed variant="outline">
              Selected
            </Toggle>
            <Toggle leadingIcon={<InfoCircleIcon />} variant="outline">
              Annotated
            </Toggle>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Pressed, disabled, and icon-only density should remain explicit without becoming a navigation system.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Pressed">
            <Toggle defaultPressed leadingIcon={<CheckCircleIcon />}>
              Active filter
            </Toggle>
            <Toggle defaultPressed variant="outline">
              Pinned
            </Toggle>
          </ShowcaseRow>
          <ShowcaseRow label="Disabled">
            <Toggle disabled>Unavailable</Toggle>
            <Toggle defaultPressed disabled variant="outline">
              Locked
            </Toggle>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared pressed-button API used by toggle.", [
        { name: "pressed / defaultPressed", type: "boolean", notes: "Support controlled or uncontrolled pressed state without changing the primitive shape." },
        { name: "onPressedChange", type: "(pressed: boolean) => void", notes: "Receives the resolved pressed state whenever the user toggles the control." },
        { name: "variant", type: "\"default\" | \"outline\"", notes: "Controls whether the toggle reads as a quiet pressed button or a framed choice." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts density while preserving the same pressed-button contract." },
        { name: "leadingIcon / trailingIcon", type: "ReactNode", notes: "Optional supporting iconography for denser action and filter surfaces." },
      ])}

      {renderReferenceNotesCard(
        "Toggle should document the smallest pressed-state action primitive before grouped or route-aware switching patterns are layered on top.",
        [
          "The stable anatomy is one pressable surface with optional icon and visible pressed state.",
          "Variant and size change emphasis and density without changing the underlying pressed-button semantics.",
          "Toggle stays smaller than tabs and more stateful than an ordinary neutral button.",
        ],
        [
          "`pressed`, `defaultPressed`, `onPressedChange`, `variant`, and `size` define the current stable contract.",
          "Use toggle for on-page selection or formatting states where pressed feedback matters immediately.",
          "Keep route logic, grouped orchestration, and product workflow semantics outside the primitive.",
        ],
        [
          "Pressed state must stay understandable through text and shape, not color alone.",
          "Every toggle still needs a readable accessible name even when it is icon-bearing.",
          "Do not use toggle where the user expects a mutually exclusive tab or route switch by default.",
        ],
      )}

      {renderUsageReviewCard(
        "Toggle is best for compact pressed-state actions and option chips that need immediate visual state.",
        [
          "A control needs to stay on the page and show whether it is currently active or inactive.",
          "Dense toolbars or filter rows need a lighter pressed-state primitive than tabs or checkbox rows.",
        ],
        [
          "Keep labels short and preserve a visible pressed state.",
          "Use outline when the control should read as a selectable chip rather than a ghost action.",
          "Use grouped patterns separately when the user needs coordinated single or multiple selection.",
        ],
        [
          "Do not replace route navigation or tabs with toggles just because the surface looks compact.",
          "Do not use toggle for destructive or irreversible actions that should read as standard buttons.",
          "Do not rely on icon-only toggles without an accessible name or visible context.",
        ],
      )}
    </div>
  );
}

export function renderToggleGroupDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Single selection</CardTitle>
          <CardDescription>Toggle group should support compact mutually exclusive switching without inheriting route semantics.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <ToggleGroup defaultValue="weekly">
              <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
              <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            </ToggleGroup>
          </ShowcaseRow>
          <ShowcaseRow label="Outline" stacked>
            <ToggleGroup defaultValue="grid" variant="outline">
              <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
            </ToggleGroup>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multiple selection</CardTitle>
          <CardDescription>Grouped pressed controls should also support compact multi-select for review filters and formatting-like choices.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Multiple" stacked>
            <ToggleGroup defaultValue={["review", "alerts"]} type="multiple" variant="outline">
              <ToggleGroupItem value="review">Review</ToggleGroupItem>
              <ToggleGroupItem value="alerts">Alerts</ToggleGroupItem>
              <ToggleGroupItem value="errors">Errors</ToggleGroupItem>
            </ToggleGroup>
          </ShowcaseRow>
          <ShowcaseRow label="Vertical" stacked>
            <ToggleGroup defaultValue={["operators"]} orientation="vertical" type="multiple">
              <ToggleGroupItem value="operators">Operators</ToggleGroupItem>
              <ToggleGroupItem value="workspace-owners">Workspace owners</ToggleGroupItem>
              <ToggleGroupItem value="tenant-admins">Tenant admins</ToggleGroupItem>
            </ToggleGroup>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared grouped pressed-button API used by toggle group.", [
        { name: "type", type: "\"single\" | \"multiple\"", notes: "Controls whether the group behaves like one selected option or a compact multi-select set." },
        { name: "value / defaultValue", type: "string | string[]", notes: "Use a string for single selection and a string array for multiple selection." },
        { name: "onValueChange", type: "(value: string | string[]) => void", notes: "Receives the resolved group value after any item press change." },
        { name: "orientation", type: "\"horizontal\" | \"vertical\"", notes: "Controls layout direction without changing the group semantics." },
        { name: "variant / size", type: "shared toggle props", notes: "The group distributes visual density and treatment to each item." },
      ])}

      {renderReferenceNotesCard(
        "Toggle group should stay a grouped pressed-control contract, not a disguised tab bar or route switcher.",
        [
          "The stable anatomy is one group container plus grouped pressed items that share variant, size, and selection behavior.",
          "Single and multiple selection belong to the same compact group contract because both are built from the same pressed-item language.",
          "Orientation changes layout only; it should not imply a different semantic role or screen shell.",
        ],
        [
          "`type`, `value`, `defaultValue`, `onValueChange`, and `orientation` define the stable grouped-selection surface.",
          "Use shared item composition so all group items inherit the same density and pressed-state treatment.",
          "Keep route transitions and app-specific panel orchestration out of the primitive until a separate contract is approved.",
        ],
        [
          "Grouped items still need clear visible labels and predictable state changes.",
          "Single-selection groups should not read like tabs unless they are intentionally being used as compact in-page option switches.",
          "Do not depend on color alone to distinguish selected and unselected items.",
        ],
      )}

      {renderUsageReviewCard(
        "Toggle group is useful when several compact pressed controls need to behave as one bounded set.",
        [
          "A toolbar, filter rail, or option row needs either single or multiple compact pressed-state choices.",
          "The user benefits from scanning all available options without opening a menu or dropdown.",
        ],
        [
          "Use `single` for mutually exclusive compact options and `multiple` for chip-like multi-selection.",
          "Keep item labels short and parallel so grouped choices scan quickly.",
          "Prefer toggle group over tabs only when the surface is a compact option set rather than clear section navigation.",
        ],
        [
          "Do not use toggle group for route-level navigation or large labeled sections that should be real tabs.",
          "Do not overload the group with long-form descriptive cards or dense metadata.",
          "Do not hide dozens of options in one group when select or command-style search is the better fit.",
        ],
      )}
    </div>
  );
}
