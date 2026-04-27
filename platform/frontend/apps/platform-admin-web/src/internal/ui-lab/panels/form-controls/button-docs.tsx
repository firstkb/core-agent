import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PlusIcon,
  ArrowRightIcon,
} from "@platform/ui-kit";

import {
  buttonAllVariants,
  buttonNeutralVariants,
  buttonSemanticVariants,
  buttonSizes,
} from "../../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard } from "../../components/docs-cards";
import { SplitButtonPreview } from "./action-previews";

export function renderButtonDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Action family should cover neutral controls and semantic states without inventing screen-specific buttons.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Neutral">
            {buttonNeutralVariants.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant[0].toUpperCase()}
                {variant.slice(1)}
              </Button>
            ))}
          </ShowcaseRow>
          <ShowcaseRow label="Semantic">
            {buttonSemanticVariants.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant[0].toUpperCase()}
                {variant.slice(1)}
              </Button>
            ))}
          </ShowcaseRow>
          <ShowcaseRow label="Disabled">
            {buttonAllVariants.map((variant) => (
              <Button disabled key={variant} variant={variant}>
                {variant[0].toUpperCase()}
                {variant.slice(1)}
              </Button>
            ))}
          </ShowcaseRow>
          <ShowcaseRow label="Split actions" stacked>
            <div className="ui-lab-page__inline-wrap">
              <SplitButtonPreview
                buttonLabel="Create tenant"
                menuLabel="Additional create actions"
                variant="primary"
              />
              <SplitButtonPreview
                buttonLabel="Assign owner"
                menuLabel="Additional assignment actions"
                variant="secondary"
              />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes and icons</CardTitle>
          <CardDescription>Scale and icon placement should stay readable across dense admin surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Sizes">
            {buttonSizes.map((size) => (
              <Button key={size} size={size}>
                {size.toUpperCase()}
              </Button>
            ))}
          </ShowcaseRow>
          <ShowcaseRow label="Leading">
            {buttonSizes.map((size) => (
              <Button key={size} leadingIcon={<PlusIcon />} size={size} variant="secondary">
                Create
              </Button>
            ))}
          </ShowcaseRow>
          <ShowcaseRow label="Trailing">
            {buttonSizes.map((size) => (
              <Button key={size} size={size} trailingIcon={<ArrowRightIcon />} variant="outline">
                Continue
              </Button>
            ))}
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Pending and block examples help validate the operational action layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Pending">
            <Button pending>Saving changes</Button>
            <Button pending variant="secondary">
              Queueing review
            </Button>
          </ShowcaseRow>
          <ShowcaseRow label="Block" stacked>
            <Button block leadingIcon={<PlusIcon />}>
              Add workspace
            </Button>
            <Button block trailingIcon={<ArrowRightIcon />} variant="outline">
              Continue to review
            </Button>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the stable action API that product surfaces are allowed to rely on.", [
        { name: "variant", type: "\"primary\" | \"secondary\" | \"outline\" | \"ghost\" | \"info\" | \"success\" | \"warning\" | \"danger\"", notes: "Controls visual emphasis for the action without changing the core button contract." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Keeps action density consistent across dense toolbars, forms, and standalone surfaces." },
        { name: "pending", type: "boolean", notes: "Disables the button and exposes loading feedback while preserving the same footprint." },
        { name: "block", type: "boolean", notes: "Stretches the primitive to full available width without creating a separate component." },
        { name: "leadingIcon / trailingIcon", type: "ReactNode", notes: "Optional icon slots for directional or contextual emphasis around the label." },
        { name: "SplitButton.items", type: "Array<{ id, label, tone?, shortcut?, disabled? }>", notes: "Provides secondary menu actions while keeping one primary action visible on the main segment." },
      ])}

      {renderReferenceNotesCard(
        "Button is the core action primitive and should document emphasis, density, and safe interaction semantics before any screen-specific styling layers appear.",
        [
          "A button may contain text plus optional leading or trailing icon content.",
          "Pending state adds loading feedback without changing the overall button footprint.",
          "Block mode keeps the same primitive while stretching to full available width.",
          "Split button keeps one primary action visible and moves secondary actions into a bounded menu trigger.",
        ],
        [
          "`variant` controls action emphasis across neutral and semantic states such as primary, outline, info, success, warning, and danger.",
          "`size`, `pending`, `disabled`, `block`, `leadingIcon`, and `trailingIcon` cover the stable API surface shown in the lab.",
          "Use `SplitButton` when one dominant action has a small set of nearby alternatives, instead of turning every variation into a separate visible button.",
          "Use native button attributes for submit, reset, and standard click behavior rather than adding app-owned wrapper props.",
        ],
        [
          "Buttons need visible text or an accessible name when rendered as icon-only triggers.",
          "Disabled and danger states must not rely on color alone to communicate meaning.",
          "Split-button dropdown triggers still need an explicit accessible label because the chevron itself is not descriptive.",
          "Use the correct button type in forms so action semantics stay predictable for keyboard users.",
        ],
      )}
    </div>
  );
}
