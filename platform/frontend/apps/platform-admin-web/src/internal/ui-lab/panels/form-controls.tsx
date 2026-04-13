import { useEffect, useState } from "react";

import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  DatePicker,
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
  InputAddon,
  InputGroup,
  InputOtp,
  InfoCircleIcon,
  Label,
  PlusIcon,
  RadioGroup,
  RadioGroupItem,
  RichTextContent,
  RichTextEditor,
  ScrollArea,
  Select,
  Slider,
  SplitButton,
  Switch,
  TagInput,
  TableMetaCell,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@platform/ui-kit";

import {
  buttonAllVariants,
  buttonNeutralVariants,
  buttonSemanticVariants,
  buttonSizes,
  demoRows,
  getStatusTone,
  inputSizes,
  uiLabRangePresets,
} from "../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../components/docs-cards";

function SliderValueRow({
  ariaLabel,
  defaultValue,
  label,
  max,
  min,
  name,
  step,
  disabled = false,
}: {
  ariaLabel: string;
  defaultValue: number;
  label: string;
  max?: number;
  min?: number;
  name: string;
  step?: number;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="ui-lab-page__slider-row">
      <span className="ui-lab-page__slider-meta">{label} · {disabled ? "disabled" : value}</span>
      <Slider
        aria-label={ariaLabel}
        defaultValue={defaultValue}
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        onValueChange={setValue}
        step={step}
      />
    </div>
  );
}

function SplitButtonPreview({
  buttonLabel,
  menuLabel,
  size = "md",
  variant = "primary",
}: {
  buttonLabel: string;
  menuLabel: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
}) {
  const [lastAction, setLastAction] = useState("Create manually");

  return (
    <div className="ui-lab-page__stack">
      <SplitButton
        dropdownAriaLabel={`${buttonLabel} more actions`}
        items={[
          { id: "manual", label: "Create manually" },
          { id: "import", label: "Import CSV" },
          { id: "template", label: "Start from template" },
        ]}
        menuLabel={menuLabel}
        onItemSelect={(item) => {
          if (typeof item.label === "string") {
            setLastAction(item.label);
          }
        }}
        size={size}
        variant={variant}
      >
        {buttonLabel}
      </SplitButton>
      <p className="ui-lab-page__muted">Last secondary action: {lastAction}</p>
    </div>
  );
}

const comboboxAssessmentTypeOptions = [
  { label: "Satisfactory", searchText: "satisfactory", value: "satisfactory" },
  { label: "Unsatisfactory", searchText: "unsatisfactory", value: "unsatisfactory" },
] as const;

const comboboxCompanyOptions = [
  {
    description: "Logistics provider",
    label: "Northstar Freight",
    searchText: "northstar freight logistics provider",
    value: "northstar-freight",
  },
  {
    description: "Manufacturing company",
    label: "Aurora Components",
    searchText: "aurora components manufacturing company",
    value: "aurora-components",
  },
  {
    description: "Software vendor",
    label: "Helio Systems",
    searchText: "helio systems software vendor",
    value: "helio-systems",
  },
  {
    description: "Professional services firm",
    label: "Summit Advisory",
    searchText: "summit advisory professional services firm",
    value: "summit-advisory",
  },
  {
    description: "Retail operator",
    label: "Cinder Retail Group",
    searchText: "cinder retail group retail operator",
    value: "cinder-retail-group",
  },
] as const;

const comboboxLargeCompanyTypes = [
  "Logistics provider",
  "Manufacturing company",
  "Software vendor",
  "Professional services firm",
  "Retail operator",
  "Energy supplier",
  "Insurance carrier",
  "Healthcare network",
] as const;

const comboboxLargeCompanyNames = [
  "Northstar",
  "Aurora",
  "Helio",
  "Summit",
  "Cinder",
  "Nova",
  "Vertex",
  "Lattice",
  "Pioneer",
  "Harbor",
] as const;

const comboboxLargeCompanySuffixes = [
  "Holdings",
  "Systems",
  "Group",
  "Logistics",
  "Works",
  "Partners",
  "Industries",
  "Advisory",
] as const;

const comboboxLargeCompanyDirectory = Array.from({ length: 1000 }, (_, index) => {
  const companyType = comboboxLargeCompanyTypes[index % comboboxLargeCompanyTypes.length];
  const companyName = `${comboboxLargeCompanyNames[index % comboboxLargeCompanyNames.length]} ${
    comboboxLargeCompanySuffixes[index % comboboxLargeCompanySuffixes.length]
  } ${String(index + 1).padStart(3, "0")}`;

  return {
    description: companyType,
    label: companyName,
    searchText: `${companyName} ${companyType}`.toLowerCase(),
    value: `company-${String(index + 1).padStart(4, "0")}`,
  };
});

function ComboboxSimplePreview() {
  const [value, setValue] = useState<string | null>("satisfactory");
  const selectedOption = comboboxAssessmentTypeOptions.find((option) => option.value === value);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-type"
        label="Type"
        onValueChange={setValue}
        options={comboboxAssessmentTypeOptions}
        placeholder="Select type"
        searchInputAriaLabel="Search type values"
        searchPlaceholder="Search type..."
        triggerAriaLabel="Type"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Simple enum template renders label only: {selectedOption ? selectedOption.label : "No type selected"}.
      </p>
    </div>
  );
}

function ComboboxCompanyPreview() {
  const [value, setValue] = useState<string | null>("aurora-components");
  const selectedOption = comboboxCompanyOptions.find((option) => option.value === value);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-company"
        label="Company"
        onValueChange={setValue}
        options={comboboxCompanyOptions}
        placeholder="Select company"
        searchInputAriaLabel="Search companies"
        searchPlaceholder="Search company..."
        triggerAriaLabel="Company"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Company template stacks the name with the company type below it:{" "}
        {selectedOption ? selectedOption.label : "No company selected"}.
      </p>
    </div>
  );
}

function ComboboxLargeCompanyPreview() {
  const [value, setValue] = useState<string | null>("company-0004");

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-large-directory"
        initialVisibleCount={10}
        label="Company"
        loadMoreStep={10}
        onValueChange={setValue}
        options={comboboxLargeCompanyDirectory}
        placeholder="Search 1000 companies"
        searchInputAriaLabel="Search large company directory"
        searchPlaceholder="Search by company name or type..."
        triggerAriaLabel="Large company directory"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Local large-list mode starts with 10 records, loads 10 more on scroll, and search matches any word from company name or company type.
      </p>
    </div>
  );
}

function ComboboxAsyncPreview() {
  const [value, setValue] = useState<string | null>("company-0004");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(comboboxLargeCompanyDirectory.slice(0, 12));

  useEffect(() => {
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      const normalizedQuery = query.trim().toLowerCase();
      const nextOptions = !normalizedQuery
        ? comboboxLargeCompanyDirectory.slice(0, 12)
        : comboboxLargeCompanyDirectory.filter((option) => option.searchText.includes(normalizedQuery)).slice(0, 12);

      setOptions(nextOptions);
      setLoading(false);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const selectedOption = comboboxLargeCompanyDirectory.find((option) => option.value === value);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        filterMode="none"
        id="ui-lab-combobox-preview-remote"
        label="Remote company search"
        loading={loading}
        loadingLabel="Searching companies…"
        onSearchValueChange={setQuery}
        onValueChange={setValue}
        options={options}
        placeholder="Search companies from server"
        searchInputAriaLabel="Search remote companies"
        searchPlaceholder="Type to search remote companies..."
        triggerAriaLabel="Remote company search"
        value={value}
        searchValue={query}
      />
      <p className="ui-lab-page__muted">
        Ajax-style search remains caller-owned: `ui-kit` receives the query string and current result slice. Current selection:{" "}
        {selectedOption ? selectedOption.label : "None"}.
      </p>
    </div>
  );
}

function ComboboxMultiCompanyPreview() {
  const [value, setValue] = useState<string[]>(["aurora-components", "helio-systems"]);
  const selectedOptions = comboboxCompanyOptions.filter((option) => value.includes(option.value));

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-company-multi"
        label="Companies"
        onValueChange={setValue}
        options={comboboxCompanyOptions}
        placeholder="Select companies"
        searchInputAriaLabel="Search companies"
        searchPlaceholder="Search companies..."
        selectionMode="multiple"
        triggerAriaLabel="Companies"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Multi-select lookup mode keeps canonical selections inside the combobox surface:{" "}
        {selectedOptions.length > 0 ? selectedOptions.map((option) => option.label).join(", ") : "No companies selected"}.
      </p>
    </div>
  );
}

function ComboboxMultiLargeDirectoryPreview() {
  const [value, setValue] = useState<string[]>(["company-0004", "company-0012", "company-0090"]);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-large-directory-multi"
        initialVisibleCount={10}
        label="Company directory"
        loadMoreStep={10}
        onValueChange={setValue}
        options={comboboxLargeCompanyDirectory}
        placeholder="Search and select companies"
        searchInputAriaLabel="Search large company directory"
        searchPlaceholder="Search by company name or type..."
        selectionMode="multiple"
        triggerAriaLabel="Large company directory"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Large local directory still reveals a bounded visible slice while preserving multiple selected companies: {value.length} selected.
      </p>
    </div>
  );
}

function RichTextEditorPreview() {
  const [value, setValue] = useState(
    "<h2>Getting started</h2><p>Use one shared rich-text surface when stored narrative needs lightweight formatting instead of plain textarea notes.</p><p><strong>Keep the first slice focused</strong> on common writing needs that appear in forms, review notes, and stored instructions.</p><ul><li>Headings for structure</li><li>Lists for scanability</li><li><a href='https://tiptap.dev/'>Links</a> for references</li></ul>",
  );

  return (
    <div className="ui-lab-page__stack">
      <RichTextEditor
        id="ui-lab-rich-text-editor-default"
        onChange={setValue}
        placeholder="Write rollout guidance..."
        value={value}
      />
      <p className="ui-lab-page__muted">Current HTML length: {value.length} characters.</p>
    </div>
  );
}

function RichTextReadonlyPreview() {
  return (
    <RichTextContent
      className="ui-lab-page__surface-card ui-lab-page__surface-card--soft"
      html="<h3>Readonly output</h3><p><strong>Readonly rendering</strong> should reuse the same HTML contract without keeping editor chrome mounted.</p><p><a href='https://example.com'>Reference links</a>, headings, and list structure must remain predictable.</p><ol><li>Store sanitized HTML</li><li>Render through one shared surface</li></ol>"
    />
  );
}

function TagInputPreview() {
  const [tags, setTags] = useState(["enterprise", "priority-support"]);

  return (
    <div className="ui-lab-page__stack">
      <TagInput
        id="ui-lab-tag-input-preview-freeform"
        inputAriaLabel="Tenant labels"
        mode="freeform"
        onValueChange={setTags}
        placeholder="Add tenant labels"
        value={tags}
      />
      <p className="ui-lab-page__muted">
        Current tags: {tags.length > 0 ? tags.join(", ") : "No tags yet"}.
      </p>
    </div>
  );
}

const predefinedTagOptions = [
  "Enterprise",
  "Growth",
  "Trial",
  "Needs review",
  "Escalated",
  "Priority support",
  "Compliance hold",
  "Regional rollout",
] as const;

function PresetTagInputPreview() {
  const [tags, setTags] = useState(["Enterprise", "Priority support"]);

  return (
    <div className="ui-lab-page__stack">
      <TagInput
        id="ui-lab-tag-input-preview-preset"
        inputAriaLabel="Preset tenant labels"
        mode="preset"
        onValueChange={setTags}
        placeholder="Choose existing labels"
        suggestions={predefinedTagOptions}
        value={tags}
      />
      <p className="ui-lab-page__muted">
        Preset-only mode lets users choose only from the predefined tag dictionary: {tags.join(", ")}.
      </p>
    </div>
  );
}

function HybridTagInputPreview() {
  const [tags, setTags] = useState(["Enterprise", "Priority support", "Late payer"]);

  return (
    <div className="ui-lab-page__stack">
      <TagInput
        id="ui-lab-tag-input-preview-hybrid"
        inputAriaLabel="Flexible tenant labels"
        mode="hybrid"
        onValueChange={setTags}
        placeholder="Choose or create labels"
        suggestions={predefinedTagOptions}
        value={tags}
      />
      <p className="ui-lab-page__muted">
        Hybrid mode lets users start from the predefined dictionary and still add custom labels: {tags.join(", ")}.
      </p>
    </div>
  );
}

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

export function renderScrollAreaDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Vertical viewport</CardTitle>
          <CardDescription>Scroll area should support bounded overflow without forcing the page itself to become the scrolling contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <ScrollArea className="ui-lab-page__scroll-demo">
              <div className="ui-lab-page__scroll-list">
                {demoRows.map((row) => (
                  <div className="ui-lab-page__scroll-item" key={`scroll-${row.id}`}>
                    <TableMetaCell
                      description={row.note}
                      title={row.id.replace("tenant-", "")}
                    />
                    <Badge appearance="soft" variant={getStatusTone(row.status)}>
                      {row.status}
                    </Badge>
                  </div>
                ))}
                <div className="ui-lab-page__scroll-item">
                  <TableMetaCell
                    description="4 regions · synced 6m ago"
                    title="solstice"
                  />
                  <Badge appearance="soft" variant="success">
                    Healthy
                  </Badge>
                </div>
                <div className="ui-lab-page__scroll-item">
                  <TableMetaCell
                    description="2 regions · synced 1h ago"
                    title="meridian"
                  />
                  <Badge appearance="soft" variant="warning">
                    Review
                  </Badge>
                </div>
              </div>
            </ScrollArea>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horizontal viewport</CardTitle>
          <CardDescription>Horizontal overflow should stay useful for dense chip rows and compact preview rails.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Horizontal" stacked>
            <ScrollArea className="ui-lab-page__scroll-demo ui-lab-page__scroll-demo--horizontal" orientation="horizontal">
              <div className="ui-lab-page__scroll-chip-row">
                <Badge appearance="soft" variant="brand">Workspace scope</Badge>
                <Badge appearance="soft" variant="success">Healthy tenants</Badge>
                <Badge appearance="soft" variant="warning">2 active filters</Badge>
                <Badge appearance="soft" variant="info">Signal review</Badge>
                <Badge appearance="soft" variant="neutral">Compact mode</Badge>
                <Badge appearance="soft" variant="brand">Shared primitive</Badge>
                <Badge appearance="soft" variant="warning">Range override</Badge>
                <Badge appearance="soft" variant="danger">Escalation required</Badge>
                <Badge appearance="soft" variant="neutral">Regional rollout</Badge>
                <Badge appearance="soft" variant="brand">Enterprise only</Badge>
                <Badge appearance="soft" variant="info">Muted overflow rail</Badge>
              </div>
            </ScrollArea>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the bounded-overflow wrapper used by dense lists, chip rows, and preview rails.", [
        { name: "orientation", type: "\"vertical\" | \"horizontal\" | \"both\"", notes: "Controls which axis may overflow while keeping the wrapper and viewport contract stable." },
        { name: "viewportClassName", type: "string", notes: "Allows local viewport-level padding or layout tuning without replacing the shared wrapper." },
        { name: "children", type: "ReactNode", notes: "Scroll area stays composition-first so list stacks, rows, and chip rails remain product-owned content." },
        { name: "native div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Use standard attributes for sizing and labeling rather than creating a large scroll API." },
      ])}

      {renderReferenceNotesCard(
        "Scroll area should document a calm bounded-overflow contract, not a second layout system.",
        [
          "The stable anatomy is root wrapper plus viewport that owns the actual overflow behavior.",
          "Orientation belongs to the primitive because overflow direction is part of the shared behavior contract.",
          "Content inside the viewport should remain normal composition rather than a bespoke scroll-item API.",
        ],
        [
          "Use scroll area when the surface itself needs bounded overflow inside a card, panel, or preview slot.",
          "Keep content ownership outside the primitive so lists, chip rows, and dense rails stay compositional.",
          "Use `viewportClassName` for small spacing adjustments instead of introducing product-specific variants.",
        ],
        [
          "Do not rely on hidden overflow regions for critical content without clear sizing and discoverable scrolling.",
          "Preserve normal reading order and semantic structure inside the viewport.",
          "Keep scrollable regions predictable so keyboard and assistive users can understand what scrolls.",
        ],
      )}

      {renderUsageReviewCard(
        "Scroll area works best when a bounded surface needs overflow management without changing the outer page layout.",
        [
          "A card, panel, or preview slot needs its own scrolling region.",
          "Dense inline metadata or chip clusters need horizontal overflow instead of wrapping into unreadable rows.",
        ],
        [
          "Use scroll area for local overflow and keep the boundary visually obvious.",
          "Size the region deliberately so the user can understand why scrolling exists.",
          "Keep the content semantic and compositional inside the viewport.",
        ],
        [
          "Do not replace normal page scrolling with nested scroll areas without a strong reason.",
          "Do not hide essential actions or validation in tiny overflow regions.",
          "Do not turn scroll area into a product-specific data-list primitive.",
        ],
      )}
    </div>
  );
}

export function renderAspectRatioDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Media framing</CardTitle>
          <CardDescription>Aspect ratio should keep previews and media shells stable without introducing donor page cards.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="16:9" stacked>
            <AspectRatio className="ui-lab-page__aspect-demo" ratio={16 / 9}>
              <div className="ui-lab-page__aspect-fill ui-lab-page__aspect-fill--wide">
                <strong>16:9 media shell</strong>
                <span className="ui-lab-page__muted">Useful for dashboard previews, embeds, and feature hero surfaces.</span>
              </div>
            </AspectRatio>
          </ShowcaseRow>
          <ShowcaseRow label="1:1" stacked>
            <AspectRatio className="ui-lab-page__aspect-demo" ratio={1}>
              <div className="ui-lab-page__aspect-fill ui-lab-page__aspect-fill--square">
                <strong>1:1 identity tile</strong>
                <span className="ui-lab-page__muted">Square framing keeps avatars, media thumbs, and preview tiles aligned.</span>
              </div>
            </AspectRatio>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card composition</CardTitle>
          <CardDescription>Aspect ratio should compose inside other surfaces instead of becoming a content card by itself.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inside card" stacked>
            <Card>
              <CardHeader>
                <CardTitle>Embedded preview</CardTitle>
                <CardDescription>Media framing stays stable even when the surrounding card content changes.</CardDescription>
              </CardHeader>
              <CardContent>
                <AspectRatio className="ui-lab-page__aspect-demo ui-lab-page__aspect-demo--inline" ratio={4 / 3}>
                  <div className="ui-lab-page__aspect-fill ui-lab-page__aspect-fill--inline">
                    <strong>4:3 evidence snapshot</strong>
                  </div>
                </AspectRatio>
              </CardContent>
            </Card>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the layout utility that keeps media and preview surfaces framed predictably.", [
        { name: "ratio", type: "number", notes: "Defines the width-to-height relationship for the framed content area." },
        { name: "children", type: "ReactNode", notes: "Rendered inside the positioned inner wrapper that fills the ratio box." },
        { name: "className / native div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Allow local framing adjustments without turning the primitive into a media card." },
      ])}

      {renderReferenceNotesCard(
        "Aspect ratio should stay a quiet layout utility that frames media and previews, not a visual component with its own content language.",
        [
          "The stable anatomy is only a ratio wrapper plus an inner fill area for composed content.",
          "The primitive should work with images, media placeholders, charts, and lightweight preview shells.",
          "It provides framing, not semantics, media loading logic, or content styling.",
        ],
        [
          "Use aspect ratio wherever the same content family needs consistent framing across variable container widths.",
          "Compose other stable primitives inside it instead of baking a dedicated media card into the utility.",
          "Keep the ratio values explicit and reusable instead of hardcoding one-off padding hacks in app code.",
        ],
        [
          "Do not rely on aspect ratio as the only way to communicate media meaning or state.",
          "Do not turn the primitive into an image loader, gallery, or page hero system.",
          "Keep readable fallback copy available when visual previews are incomplete or decorative.",
        ],
      )}

      {renderUsageReviewCard(
        "Aspect ratio fits previews, embeds, cover blocks, and stable media shells that need predictable framing at different widths.",
        [
          "A card, dashboard, or docs surface needs media or illustration framing that stays stable during resize.",
          "Preview content should hold a predictable ratio instead of collapsing into arbitrary height based on surrounding copy.",
        ],
        [
          "Use one ratio wrapper and compose your content inside it.",
          "Prefer explicit ratio values like 16:9, 4:3, or 1:1 for repeatable layout decisions.",
          "Keep styling calm so the primitive remains about framing, not decoration.",
        ],
        [
          "Do not build media player logic or product-specific hero systems into the primitive.",
          "Do not use aspect ratio when plain intrinsic content sizing already reads well.",
          "Do not overload the wrapper with page-specific spacing and state logic that belongs in a surrounding surface.",
        ],
      )}
    </div>
  );
}

export function renderInputDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Input sizing should stay compact enough for dense admin forms without hurting readability.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {inputSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <Input
                aria-label={`Input ${size}`}
                id={`ui-lab-input-size-${size}`}
                name={`ui-lab-input-size-${size}`}
                placeholder={`Input ${size}`}
                size={size}
              />
            </ShowcaseRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Input should stay predictable when wrapped in field-level label, hint, error, and disabled semantics.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-matrix-default">Default</FieldLabel>
                <Input defaultValue="demo.platform.local" id="ui-lab-input-matrix-default" />
                <FieldHint>Neutral field with helper text.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-input-matrix-invalid">Invalid</FieldLabel>
                <Input defaultValue="demo platform" id="ui-lab-input-matrix-invalid" invalid />
                <FieldError>Use a valid host or slug format.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-matrix-readonly">Read only</FieldLabel>
                <Input defaultValue="platform-admin-web" id="ui-lab-input-matrix-readonly" readOnly />
                <FieldHint>Read-only keeps the same field structure.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-matrix-disabled">Disabled</FieldLabel>
                <Input defaultValue="Unavailable in this environment" disabled id="ui-lab-input-matrix-disabled" />
                <FieldHint>Disabled should still preserve spacing and hierarchy.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-input-matrix-required">Required</FieldLabel>
                <Input defaultValue="aurora.platform.local" id="ui-lab-input-matrix-required" required />
                <FieldHint>Required fields get the shared left accent without changing the rest of the input contract.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grouped entry</CardTitle>
          <CardDescription>Grouped patterns stay local to the text entry contract and do not imply a full product layout.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Hostname" stacked>
            <InputGroup>
              <InputAddon>https://</InputAddon>
              <Input
                aria-label="Hostname"
                defaultValue="demo.platform.local"
                id="ui-lab-input-group-hostname"
                name="ui-lab-input-group-hostname"
              />
            </InputGroup>
          </ShowcaseRow>
          <ShowcaseRow label="Tenant slug" stacked>
            <InputGroup>
              <Input
                aria-label="Tenant slug"
                defaultValue="aurora"
                id="ui-lab-input-group-slug"
                name="ui-lab-input-group-slug"
              />
              <InputAddon>.platform.local</InputAddon>
            </InputGroup>
          </ShowcaseRow>
          <ShowcaseRow label="Field usage" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-input-doc-email">Owner email</FieldLabel>
              <Input defaultValue="owner@platform.local" id="ui-lab-input-doc-email" />
              <FieldHint>Input remains the base contract even when placed in a field shell.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field shell examples</CardTitle>
          <CardDescription>Input should read consistently inside real field wrappers, not only as a bare control preview.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Identity" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-field-name">Tenant display name</FieldLabel>
                <Input defaultValue="Aurora Commerce" id="ui-lab-input-field-name" />
                <FieldHint>Preferred public label shown in shared admin surfaces.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-input-field-host">Primary host</FieldLabel>
                <Input defaultValue="aurora platform local" id="ui-lab-input-field-host" invalid />
                <FieldError>Use a valid host format such as `aurora.platform.local`.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
          <ShowcaseRow label="Responsive inline" stacked>
            <Field layout="responsive-inline">
              <FieldLabel htmlFor="ui-lab-input-field-inline-owner">Owner email</FieldLabel>
              <Input defaultValue="owner@aurora.platform.local" id="ui-lab-input-field-inline-owner" />
              <FieldHint>Desktop keeps the label in a left column; mobile returns the same field to the default stacked reading flow.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Wrapped label" stacked>
            <Field layout="responsive-inline">
              <FieldLabel htmlFor="ui-lab-input-field-inline-rollout">
                Primary rollout owner email for review notifications
              </FieldLabel>
              <Input defaultValue="review@aurora.platform.local" id="ui-lab-input-field-inline-rollout" />
              <FieldHint>Longer labels should still align cleanly against the control on desktop and wrap naturally back above it on mobile.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable text-entry reference for the shared input contract before any app-owned wrappers are introduced.", [
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Controls control density while keeping the same visual grammar and field contract." },
        { name: "invalid", type: "boolean", notes: "Applies the shared invalid surface treatment when validation should be visible on the control itself." },
        { name: "readOnly", type: "boolean", notes: "Uses native read-only behavior while preserving the same field layout and hierarchy." },
        { name: "disabled", type: "boolean", notes: "Disables interaction while keeping spacing and form rhythm stable." },
        { name: "native input props", type: "InputHTMLAttributes<HTMLInputElement>", notes: "Use standard props for value, name, autocomplete, placeholder, and input semantics." },
      ])}

      {renderReferenceNotesCard(
        "Input should document the base text-entry contract separately from field wrappers and grouped add-ons.",
        [
          "The base control is a single text-entry surface that can live alone or inside `Field` and `InputGroup` wrappers.",
          "Add-ons stay outside the input itself so prefixes and suffixes remain compositional rather than hard-coded.",
          "Shared field wrappers may place the label above by default or move it into a left desktop column through the responsive-inline field layout.",
          "Longer labels should still read cleanly when they wrap in the left column instead of forcing a separate field variant.",
          "Hint and error content belong to the surrounding field shell, not to bespoke input variants.",
        ],
        [
          "`size`, `invalid`, `readOnly`, and `disabled` cover the stable visual contract.",
          "Required field emphasis comes from the shared `Field` wrapper so the same accent can be reused across input, select, and textarea.",
          "Use native input props for value, defaultValue, placeholder, name, and autocomplete behavior.",
          "Grouped host or slug entry should be composed with `InputGroup` and `InputAddon`, not with screen-specific input variants.",
        ],
        [
          "Every input still needs a visible label or an equivalent accessible name outside placeholder text.",
          "Validation messaging should be connected through the field layer so error text is not color-only.",
          "Read-only and disabled states must remain visually distinct without breaking reading order.",
        ],
      )}
    </div>
  );
}

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

export function renderLabelDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Label should stay calm and readable whether it carries primary control naming or quieter supporting text.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Primary" stacked>
            <FormGrid columns={2}>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-primary">Tenant display name</Label>
                <Input defaultValue="Aurora Commerce" id="ui-lab-label-primary" name="ui-lab-label-primary" />
              </div>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-owner">Owner email</Label>
                <Input defaultValue="owner@platform.local" id="ui-lab-label-owner" name="ui-lab-label-owner" />
              </div>
            </FormGrid>
          </ShowcaseRow>
          <ShowcaseRow label="Secondary" stacked>
            <FormGrid columns={2}>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-host" variant="secondary">
                  Optional rollout note
                </Label>
                <Input defaultValue="Preview text only" id="ui-lab-label-host" name="ui-lab-label-host" readOnly />
              </div>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-slug" variant="secondary">
                  Supporting field text should remain calmer than the primary field label.
                </Label>
                <Input defaultValue="aurora-platform" id="ui-lab-label-slug" name="ui-lab-label-slug" readOnly />
              </div>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Control usage</CardTitle>
          <CardDescription>Standalone label should support simple control rows when a full `Field` shell would be excessive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inline control" stacked>
            <FormGrid columns={2}>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-inline-name">Workspace slug</Label>
                <Input defaultValue="aurora-platform" id="ui-lab-label-inline-name" name="ui-lab-label-inline-name" />
              </div>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-inline-host" variant="secondary">
                  Preview host
                </Label>
                <Input defaultValue="demo.platform.local" id="ui-lab-label-inline-host" name="ui-lab-label-inline-host" readOnly />
              </div>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the standalone label primitive used when the heavier field shell is unnecessary.", [
        { name: "variant", type: "\"primary\" | \"secondary\"", notes: "Controls whether the label reads as primary control naming or calmer supporting label text." },
        { name: "htmlFor", type: "string", notes: "Connects the label to its target control using standard browser semantics." },
        { name: "children", type: "ReactNode", notes: "Visible label text for a control, grouped setting, or compact helper row." },
        { name: "native label props", type: "LabelHTMLAttributes<HTMLLabelElement>", notes: "Keeps the primitive semantic and light instead of growing a custom API." },
      ])}

      {renderReferenceNotesCard(
        "Label should stay a small semantic primitive for standalone control naming and supporting label rows.",
        [
          "The stable anatomy is a single label element with calm typographic treatment.",
          "Primary and secondary variants adjust emphasis only; they do not turn label into a field shell.",
          "Use standalone label where the full `Field` wrapper would add unnecessary structure.",
        ],
        [
          "Use `htmlFor` and the matching control `id` to keep the label semantic and clickable.",
          "Prefer `FieldLabel` inside the field shell and `Label` for lighter control compositions outside it.",
          "Keep label copy concise and let hint or error messaging live in the appropriate surrounding contract.",
        ],
        [
          "Every standalone label should still be connected to the correct form control or setting.",
          "Do not rely on visual proximity alone if `htmlFor` and `id` can provide a stronger association.",
          "Secondary labels should remain readable and not collapse into decorative muted text.",
        ],
      )}

      {renderUsageReviewCard(
        "Label works best for simple control rows and standalone form semantics where a full field wrapper is not needed.",
        [
          "A control needs semantic naming but does not need hint, error, and surrounding field structure.",
          "The surface needs a lightweight form row or settings item with calm typographic hierarchy.",
        ],
        [
          "Use primary labels for the main control name and secondary labels for calmer supporting label rows.",
          "Keep label copy short and attach it semantically through `htmlFor` when possible.",
          "Escalate to `Field` only when the surface needs full hint, error, or validation structure.",
        ],
        [
          "Do not duplicate `FieldLabel` and `Label` on the same control row without a clear reason.",
          "Do not use Label as a general text-style utility detached from form or control meaning.",
          "Do not hide essential control meaning in a muted secondary label without a stronger primary name.",
        ],
      )}
    </div>
  );
}

export function renderDateFieldDocs(
  calendarDateValue: string,
  onCalendarDateValueChange: (value: string) => void,
  rangeStartDate: string,
  rangeEndDate: string,
  onRangeStartDateChange: (value: string) => void,
  onRangeEndDateChange: (value: string) => void,
  activeRangePresetId: string | null,
  onRangePresetSelect: (presetId: string) => void,
) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Single-date selection</CardTitle>
          <CardDescription>Date picker should cover simple single-date entry without forcing the product to choose between separate primitives.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {inputSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <DatePicker
                aria-label={`${size} date picker`}
                defaultValue="2026-03-21"
                id={`ui-lab-date-picker-size-${size}`}
                name={`ui-lab-date-picker-size-${size}`}
                size={size}
              />
            </ShowcaseRow>
          ))}
          <ShowcaseRow label="Calendar mode" stacked>
            <DatePicker
              aria-label="Calendar date picker"
              id="ui-lab-date-picker-calendar"
              name="ui-lab-date-picker-calendar"
              onValueChange={onCalendarDateValueChange}
              openOnFieldClick
              picker="calendar"
              value={calendarDateValue}
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Range selection</CardTitle>
          <CardDescription>Date range is the same job family, so it should stay inside the same date-picker contract rather than becoming a separate top-level component.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Range presets" stacked>
            <DatePicker
              activePresetId={activeRangePresetId}
              endDate={rangeEndDate}
              endDateFieldId="ui-lab-date-picker-range-end"
              endDateFieldName="ui-lab-date-picker-range-end"
              mode="range"
              onEndDateChange={onRangeEndDateChange}
              onPresetSelect={onRangePresetSelect}
              onStartDateChange={onRangeStartDateChange}
              openOnFieldClick
              picker="calendar"
              presets={uiLabRangePresets}
              startDateFieldId="ui-lab-date-picker-range-start"
              startDateFieldName="ui-lab-date-picker-range-start"
              startDate={rangeStartDate}
            />
          </ShowcaseRow>
          <ShowcaseRow label="Compare" stacked>
            <div className="ui-lab-page__stack">
              <DatePicker
                activePresetId={activeRangePresetId}
                endDate={rangeEndDate}
                endDateFieldId="ui-lab-date-picker-compare-range-end"
                endDateFieldName="ui-lab-date-picker-compare-range-end"
                mode="range"
                onEndDateChange={onRangeEndDateChange}
                onPresetSelect={onRangePresetSelect}
                onStartDateChange={onRangeStartDateChange}
                openOnFieldClick
                picker="calendar"
                presets={uiLabRangePresets}
                startDateFieldId="ui-lab-date-picker-compare-range-start"
                startDateFieldName="ui-lab-date-picker-compare-range-start"
                startDate={rangeStartDate}
              />
              <FormGrid columns={2}>
                <Field>
                  <FieldLabel htmlFor="ui-lab-date-picker-compare-start">Start date</FieldLabel>
                  <DatePicker
                    id="ui-lab-date-picker-compare-start"
                    max={rangeEndDate || undefined}
                    name="ui-lab-date-picker-compare-start"
                    onValueChange={onRangeStartDateChange}
                    openOnFieldClick
                    picker="calendar"
                    value={rangeStartDate}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ui-lab-date-picker-compare-end">End date</FieldLabel>
                  <DatePicker
                    id="ui-lab-date-picker-compare-end"
                    min={rangeStartDate || undefined}
                    name="ui-lab-date-picker-compare-end"
                    onValueChange={onRangeEndDateChange}
                    openOnFieldClick
                    picker="calendar"
                    value={rangeEndDate}
                  />
                </Field>
              </FormGrid>
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Form shell" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-date-default">Cutoff date</FieldLabel>
                <DatePicker defaultValue="2026-03-21" id="ui-lab-date-default" name="ui-lab-date-default" />
                <FieldHint>Date picker defaults to the lowest-risk native entry contract.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-date-invalid">Launch date</FieldLabel>
                <DatePicker id="ui-lab-date-invalid" invalid max="2026-03-21" name="ui-lab-date-invalid" value="2026-04-03" />
                <FieldError>Choose a date inside the current rollout window.</FieldError>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-date-required">Renewal review</FieldLabel>
                <DatePicker defaultValue="2026-04-15" id="ui-lab-date-required" name="ui-lab-date-required" required />
                <FieldHint>Required accent comes from the field wrapper, not from a special date variant.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-date-disabled">Locked period</FieldLabel>
                <DatePicker defaultValue="2026-05-01" disabled id="ui-lab-date-disabled" name="ui-lab-date-disabled" />
                <FieldHint>Disabled date fields should still preserve control height and spacing.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Reference for the shared date-picker contract that covers both one-date and date-range selection.", [
        { name: "mode", type: "\"single\" | \"range\"", notes: "Keeps single-date and date-range selection inside one user-facing contract." },
        { name: "picker", type: "\"native\" | \"calendar\"", notes: "Switches between the light native baseline and the richer shared calendar picker." },
        { name: "value / onValueChange", type: "string / (value) => void", notes: "Single-date mode stays string-based at the form boundary for predictable form integration." },
        { name: "startDate / endDate", type: "string", notes: "Range mode keeps explicit start and end values instead of hiding them inside a separate top-level component." },
        { name: "activePresetId / presets / onPresetSelect", type: "range helpers", notes: "Optional range affordances stay inside the same date-picker family." },
        { name: "openOnFieldClick", type: "boolean", notes: "Allows the whole field to open the calendar picker instead of limiting interaction to the trailing icon." },
      ])}

      {renderReferenceNotesCard(
        "Date picker should be the one shared user-facing contract for temporal selection.",
        [
          "Choosing one date and choosing a range are the same job family and should not force product surfaces to adopt unrelated components.",
          "The contract can still expose a light native path and a richer calendar path without splitting the mental model.",
          "Hint, error, and required semantics still belong to the surrounding field wrapper.",
        ],
        [
          "Use single mode for scalar dates and range mode for periods, windows, and filters.",
          "Keep native and calendar entry as variants of one contract instead of separate feature families.",
          "Keep linked range controls on shared state so presets, start/end fields, and calendar selection always stay in sync.",
          "Prefer explicit string values at the form boundary so URL state and filter state stay simple.",
        ],
        [
          "Accessible labeling still needs to describe whether the control chooses one date or a range.",
          "Calendar opening should be reachable from the whole field when the field visually communicates a picker contract.",
          "Do not rely on color or placement alone to explain start and end semantics in range mode.",
        ],
      )}

      {renderUsageReviewCard(
        "Date picker works when the task is temporal selection, whether that means one date or a start-end period.",
        [
          "The surface needs either a single date or a range, but the user should not learn two different top-level date components.",
          "The page benefits from switching between native and calendar entry without changing the surrounding form contract.",
        ],
        [
          "Use single mode for one date and range mode for periods and filter windows.",
          "Keep constraints explicit with hint and error copy instead of hiding them in picker behavior.",
          "Use one shared date state when the surface exposes both a combined range picker and start/end field editors.",
          "Use the same field shell and validation grammar as the rest of the form layer.",
        ],
        [
          "Do not split one temporal task into separate user-facing component families because the internal implementation differs.",
          "Do not overload the contract with time, timezone, booking, or schedule-specific logic yet.",
          "Do not assume presets are mandatory; they belong only where repeated shortcuts add real value.",
        ],
      )}
    </div>
  );
}

export function renderSelectDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Select should stay visually aligned with input sizing across dense form layouts.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {inputSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <Select
                aria-label={`${size} select`}
                defaultValue="growth"
                id={`ui-lab-select-size-${size}`}
                name={`ui-lab-select-size-${size}`}
                size={size}
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </ShowcaseRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Select should preserve field semantics even before any advanced menu behavior is introduced.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-default">Default</FieldLabel>
                <Select defaultValue="enterprise" id="ui-lab-select-matrix-default">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Default field with section-neutral helper text.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-select-matrix-invalid">Invalid</FieldLabel>
                <Select defaultValue="starter" id="ui-lab-select-matrix-invalid" invalid>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldError>Select a plan tier before saving.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-disabled">Disabled</FieldLabel>
                <Select defaultValue="growth" disabled id="ui-lab-select-matrix-disabled">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Disabled keeps the same label and hint treatment.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-size">Compact</FieldLabel>
                <Select defaultValue="growth" id="ui-lab-select-matrix-size" size="sm">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Smaller density should still read as the same contract.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-select-matrix-required">Required</FieldLabel>
                <Select defaultValue="growth" id="ui-lab-select-matrix-required" required>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Required select fields reuse the same left accent as text fields.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Select remains product-safe when reviewed inside a stable field shell.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Field" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-select-doc-plan">Plan tier</FieldLabel>
              <Select defaultValue="growth" id="ui-lab-select-doc-plan">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
              <FieldHint>Choose the reusable contract, not a screen-specific dropdown treatment.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision matrix</CardTitle>
          <CardDescription>Side-by-side field examples make validation, density, and helper copy easier to compare.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Review" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-region">Region</FieldLabel>
                <Select defaultValue="us-east" id="ui-lab-select-matrix-region">
                  <option value="us-east">US East</option>
                  <option value="eu-west">EU West</option>
                  <option value="ap-south">AP South</option>
                </Select>
                <FieldHint>Field-level hint should stay calm and short.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-select-matrix-owner">Owner assignment</FieldLabel>
                <Select defaultValue="" id="ui-lab-select-matrix-owner" invalid>
                  <option value="">Select owner</option>
                  <option value="ops">Operations</option>
                  <option value="success">Customer Success</option>
                </Select>
                <FieldError>Select one owner group before continuing.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable choice-entry reference for the shared select contract while advanced custom menu behavior remains out of scope.", [
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Matches the same density scale used by input so form rows stay visually aligned." },
        { name: "invalid", type: "boolean", notes: "Exposes the shared invalid treatment when the field should visibly fail validation." },
        { name: "disabled", type: "boolean", notes: "Uses native disabled select semantics while preserving the shared surface rhythm." },
        { name: "children", type: "ReactNode (<option /> ...)", notes: "Keeps option content native and lightweight in the first stable shared contract." },
        { name: "native select props", type: "SelectHTMLAttributes<HTMLSelectElement>", notes: "Use standard value, defaultValue, name, and form semantics rather than custom API layers." },
      ])}

      {renderReferenceNotesCard(
        "Select remains the shared choice primitive while advanced menu behavior stays outside the stable contract.",
        [
          "The stable structure is visible label, native select control, and optional hint or error through `Field`.",
          "Option sets stay native in the first shared contract so choice behavior is predictable and light-weight.",
          "Density and validation are reviewed at the field level, not through custom dropdown shells.",
        ],
        [
          "`size`, `invalid`, and `disabled` form the core styling API for the shared select contract.",
          "Required emphasis is inherited from the surrounding `Field` so the same signal works across all base form controls.",
          "Use native option lists and value/defaultValue semantics instead of custom item renderers in the stable layer.",
          "Keep placeholder-like behavior explicit with an empty option rather than inventing a separate prop.",
        ],
        [
          "Select still needs a visible label that explains the choice, even when the current value is obvious.",
          "Validation and helper text should be exposed through the field wrapper so the state is announced consistently.",
          "Do not rely on the first option alone to act as hidden instructional text.",
        ],
      )}
    </div>
  );
}

export function renderComboboxDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Template variants</CardTitle>
          <CardDescription>Combobox should support plain values, stacked lookup rows, and canonical multi-selection without inventing separate components.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Simple values" stacked>
            <ComboboxSimplePreview />
          </ShowcaseRow>
          <ShowcaseRow label="Company list" stacked>
            <ComboboxCompanyPreview />
          </ShowcaseRow>
          <ShowcaseRow label="Company multi-select" stacked>
            <ComboboxMultiCompanyPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Large local directory</CardTitle>
          <CardDescription>Large local lists should not dump 1000 rows into view immediately when a smaller progressive slice is enough.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="1000 companies" stacked>
            <ComboboxLargeCompanyPreview />
          </ShowcaseRow>
          <ShowcaseRow label="1000 companies multi-select" stacked>
            <ComboboxMultiLargeDirectoryPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caller-owned async search</CardTitle>
          <CardDescription>Remote search should pass the query string out to app code instead of hiding fetch logic inside the shared primitive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Ajax search" stacked>
            <ComboboxAsyncPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Combobox should read like the same form family as input and select, even while single and multiple search flows stay richer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-default">Default</FieldLabel>
                <Combobox
                  defaultValue="satisfactory"
                  id="ui-lab-combobox-default"
                  label="Type"
                  options={comboboxAssessmentTypeOptions}
                  placeholder="Select type"
                  triggerAriaLabel="Type"
                />
                <FieldHint>Simple enum rows should work with label-only options and no extra chrome.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-combobox-invalid">Invalid</FieldLabel>
                <Combobox
                  defaultValue={null}
                  id="ui-lab-combobox-invalid"
                  invalid
                  label="Company"
                  options={comboboxCompanyOptions}
                  placeholder="Choose company"
                  triggerAriaLabel="Company"
                />
                <FieldError>Select one company before saving this review.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-disabled">Disabled</FieldLabel>
                <Combobox
                  disabled
                  defaultValue="northstar-freight"
                  id="ui-lab-combobox-disabled"
                  label="Company"
                  options={comboboxCompanyOptions}
                  triggerAriaLabel="Locked company"
                />
                <FieldHint>Disabled state should stay aligned with the rest of the form family.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-compact">Large local list</FieldLabel>
                <Combobox
                  defaultValue="company-0004"
                  id="ui-lab-combobox-compact"
                  initialVisibleCount={10}
                  label="Company directory"
                  loadMoreStep={10}
                  options={comboboxLargeCompanyDirectory}
                  size="sm"
                  triggerAriaLabel="Company directory"
                />
                <FieldHint>Search still works across company name and company type while the list reveals rows progressively on scroll.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-multi-default">Multi-select</FieldLabel>
                <Combobox
                  defaultValue={["northstar-freight", "helio-systems"]}
                  id="ui-lab-combobox-multi-default"
                  label="Companies"
                  options={comboboxCompanyOptions}
                  placeholder="Choose companies"
                  selectionMode="multiple"
                  triggerAriaLabel="Companies"
                />
                <FieldHint>Use multi-select for canonical lookup lists when tags would hide the real source of truth.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-combobox-multi-invalid">Multi-select invalid</FieldLabel>
                <Combobox
                  defaultValue={[]}
                  id="ui-lab-combobox-multi-invalid"
                  invalid
                  label="Project reviewers"
                  options={comboboxCompanyOptions}
                  placeholder="Choose reviewers"
                  selectionMode="multiple"
                  triggerAriaLabel="Project reviewers"
                />
                <FieldError>Select at least one reviewer before continuing.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderUsageReviewCard(
        "Combobox is the review-stage answer for searchable option lists that outgrow native select without requiring a full data-grid runtime.",
        [
          "Use combobox when the option set benefits from inline search or richer option copy such as company name plus company type.",
          "Use `selectionMode=\"multiple\"` when the user must choose several canonical records from the same searchable lookup surface.",
          "Use `filterMode=\"none\"` when app code owns remote search and only passes current results into the list.",
          "Use the stable native `Select` when the option set is short, fixed, and does not need search.",
        ],
        [
          "Keep fetch, debounce, and query caching in app code; the shared helper should only render search state and options.",
          "Use label-only rows for plain enums and label-plus-description rows for richer company-style templates.",
          "Keep multi-select canonical: selected values should remain option-backed, not free-form strings.",
          "Reuse the same field shell, labels, and validation language as other form controls.",
          "Use `initialVisibleCount` and `loadMoreStep` when large local datasets should open with a smaller visible slice.",
        ],
        [
          "Do not fold arbitrary free-form creation into the combobox contract.",
          "Do not hide route-specific fetch rules or domain wording inside the shared helper.",
          "Do not replace every stable native select with combobox by default.",
        ],
      )}

      {renderPropsApiCard("Review-stage searchable select contract for local data and caller-owned async search.", [
        { name: "options", type: "Array<{ value, label, description?, meta?, disabled?, searchText? }>", notes: "Provides the rendered option list while keeping filtering and fetch ownership outside the primitive when needed." },
        { name: "selectionMode", type: "\"single\" | \"multiple\"", notes: "Keeps the same searchable combobox shell while letting callers choose one or many canonical options." },
        { name: "value / onValueChange", type: "string | null or string[]", notes: "Keeps selected value caller-owned for both single-select and multi-select flows." },
        { name: "searchValue / onSearchValueChange", type: "string", notes: "Lets app code own the search string for remote or debounced queries instead of hardwiring Ajax into `ui-kit`." },
        { name: "filterMode", type: "\"local\" | \"none\"", notes: "Uses lightweight built-in local filtering by default or skips it when the option list already comes from caller-owned async search." },
        { name: "initialVisibleCount / loadMoreStep", type: "number", notes: "Lets large local lists start with a bounded visible slice and reveal more options as the user scrolls." },
        { name: "loading / emptyLabel", type: "boolean / ReactNode", notes: "Exposes async and empty states without inventing a second overlay contract." },
        { name: "size / invalid / disabled", type: "\"sm\" | \"md\" | \"lg\" / boolean / boolean", notes: "Aligns the control with the same density and validation language used by input and select." },
      ])}

      {renderReferenceNotesCard(
        "Combobox is intentionally separate from the stable native `Select` contract because searchable lists and remote queries carry a different interaction model.",
        [
          "The core structure is trigger button, popover surface, search field, and bounded option list.",
          "Options may render as label-only rows or as stacked rows with description, while staying list-shaped and lightweight.",
          "Large local lists may open with a smaller visible slice and reveal more rows on scroll without changing the selection model.",
          "Multi-select stays in the same combobox family when the source remains canonical and searchable; tags and free-form entry still live in companion patterns.",
        ],
        [
          "`selectionMode`, `options`, `value`, and `onValueChange` form the base selection contract.",
          "`searchValue`, `onSearchValueChange`, `loading`, and `filterMode` are the review-stage hooks for remote search without embedding fetch logic.",
          "Use `searchText` when the visible template is custom JSX or when search must include extra words beyond the visible label and description.",
          "Use `placeholder`, `emptyLabel`, `size`, `invalid`, and `disabled` to align the control with field-shell needs.",
        ],
        [
          "Always provide a visible field label or an explicit trigger aria label so the picker has a stable name.",
          "Search input and list content should stay keyboard reachable without trapping users in the popover.",
          "Do not rely on placeholder text alone to explain what the option list means.",
        ],
      )}
    </div>
  );
}

export function renderTagInputDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Entry variants</CardTitle>
          <CardDescription>Tag input should cover free-form entry, strict dictionary selection, and a hybrid choose-or-create mode without changing the basic string-array contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Free-form" stacked>
            <TagInputPreview />
          </ShowcaseRow>
          <ShowcaseRow label="Preset-only" stacked>
            <PresetTagInputPreview />
          </ShowcaseRow>
          <ShowcaseRow label="Hybrid" stacked>
            <HybridTagInputPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Density and validation</CardTitle>
          <CardDescription>Tag entry should align with the same spacing and validation rules as input, not create a parallel form language.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-default">Default</FieldLabel>
                <TagInput
                  defaultValue={["regional", "needs-review"]}
                  id="ui-lab-tag-input-default"
                  inputAriaLabel="Default tag input"
                  mode="freeform"
                  placeholder="Add tags"
                />
                <FieldHint>Press Enter or comma to commit a tag inside the same control surface.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-tag-input-invalid">Invalid</FieldLabel>
                <TagInput
                  defaultValue={["draft"]}
                  id="ui-lab-tag-input-invalid"
                  inputAriaLabel="Invalid tag input"
                  invalid
                  mode="freeform"
                  placeholder="Add labels"
                />
                <FieldError>Remove unapproved labels before publishing.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-preset">Preset-only</FieldLabel>
                <TagInput
                  defaultValue={["Enterprise", "Needs review"]}
                  id="ui-lab-tag-input-preset"
                  inputAriaLabel="Preset-only tag input"
                  mode="preset"
                  placeholder="Choose preset labels"
                  suggestions={predefinedTagOptions}
                />
                <FieldHint>Users can search the predefined tags, but cannot create values outside that list.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-hybrid">Hybrid</FieldLabel>
                <TagInput
                  defaultValue={["Enterprise", "Late payer"]}
                  id="ui-lab-tag-input-hybrid"
                  inputAriaLabel="Hybrid tag input"
                  mode="hybrid"
                  placeholder="Choose or create labels"
                  suggestions={predefinedTagOptions}
                />
                <FieldHint>Suggestions stay searchable, but callers may still accept additional custom tags.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-disabled">Disabled</FieldLabel>
                <TagInput
                  defaultValue={["enterprise", "signed-contract"]}
                  disabled
                  id="ui-lab-tag-input-disabled"
                  inputAriaLabel="Disabled tag input"
                  mode="freeform"
                />
                <FieldHint>Disabled tags should remain visible but not editable.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-compact">Compact</FieldLabel>
                <TagInput
                  defaultValue={["trial", "watchlist"]}
                  id="ui-lab-tag-input-compact"
                  inputAriaLabel="Compact tag input"
                  mode="hybrid"
                  placeholder="Add compact tags"
                  size="sm"
                  suggestions={predefinedTagOptions}
                />
                <FieldHint>Compact tagging should still fit dense filter or metadata rails.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderUsageReviewCard(
        "Tag input is a review-stage free-form label helper, not a replacement for canonical enums or searchable single-select choice.",
        [
          "Use tag input for lightweight labels, ad-hoc metadata, or draft categorization that callers own as string arrays.",
          "Use `mode=\"preset\"` when users may pick multiple labels, but only from an approved tag dictionary.",
          "Use `mode=\"hybrid\"` when suggestions should guide selection but callers may still accept custom labels.",
          "Use combobox or stable select when the user must choose from a canonical option list.",
          "Use tag input when inline removable pills communicate the resulting state more clearly than a plain textarea or comma-separated text field.",
        ],
        [
          "Keep tags short and human-readable so the inline pill surface stays legible.",
          "Let the caller own persistence, normalization, and any domain-level validation rules.",
          "Prefer `mode` to make intent explicit; `allowCustomValues` remains only as backward-compatible fallback wiring.",
          "Keep the shared contract string-array based until a stronger multi-surface need proves richer token objects.",
        ],
        [
          "Do not turn tag input into a hidden taxonomy browser or route-specific filter runtime.",
          "Do not overload it with remote search, grouped results, or large controlled menus.",
          "Do not use tags where a stable enum should stay explicit through select, checkbox, or combobox.",
        ],
      )}

      {renderPropsApiCard("Review-stage free-form tag entry contract for compact metadata lists.", [
        { name: "value / onValueChange", type: "string[]", notes: "Keeps the committed tag array caller-owned rather than hiding persistence inside the control." },
        { name: "mode", type: "\"freeform\" | \"preset\" | \"hybrid\"", notes: "Makes tag behavior explicit: create only, choose only, or choose from suggestions while still allowing new values." },
        { name: "placeholder", type: "string", notes: "Guides free-form entry without adding a second visible label layer." },
        { name: "separators", type: "string[]", notes: "Controls which keyboard separators commit a tag; comma remains the default donor pattern." },
        { name: "suggestions / allowCustomValues", type: "string[] / boolean", notes: "Adds local suggestion picking; `allowCustomValues` stays as legacy compatibility when `mode` is omitted." },
        { name: "addOnBlur / allowDuplicates / maxTags", type: "boolean / boolean / number", notes: "Keeps commit and validation rules explicit while the component is still under review." },
        { name: "size / invalid / disabled", type: "\"sm\" | \"md\" | \"lg\" / boolean / boolean", notes: "Aligns the control with the same shared form density and validation language." },
      ])}

      {renderReferenceNotesCard(
        "Tag input stays intentionally narrow so it can validate as a reusable metadata-entry surface before any richer taxonomy workflows are considered.",
        [
          "The shared structure is one bordered input shell with inline committed tags and a single text cursor.",
          "Committed tags stay string-based and removable inside the same control surface.",
          "Suggestion lists may support strict dictionary selection or hybrid choose-or-create flows while the contract still remains string-array based and lightweight.",
        ],
        [
          "`value`, `onValueChange`, `placeholder`, and `separators` define the main review API.",
          "`mode` and `suggestions` define whether the control is free-form, preset-only, or hybrid without promoting a heavier tokenized multi-select runtime.",
          "`addOnBlur`, `allowDuplicates`, and `maxTags` tune commit rules without turning the helper into workflow logic.",
          "Use `invalid` and `disabled` the same way as other form controls rather than creating new status props.",
        ],
        [
          "The inner text input still needs a visible field label or explicit input aria label.",
          "Remove buttons should expose the tag name so assistive tech understands what will be deleted.",
          "Do not rely only on color or chip styling to explain whether a tag is editable.",
        ],
      )}
    </div>
  );
}

export function renderTextareaDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Default and resize</CardTitle>
          <CardDescription>Textarea should stay visually aligned with the shared entry family while remaining useful for longer notes and reviews.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <Textarea
              aria-label="Vertical textarea"
              defaultValue="Aurora rollout notes stay in one shared textarea contract instead of drifting into screen-owned long-form fields."
              id="ui-lab-textarea-vertical"
              name="ui-lab-textarea-vertical"
              rows={4}
            />
          </ShowcaseRow>
          <ShowcaseRow label="No resize" stacked>
            <Textarea
              aria-label="No resize textarea"
              defaultValue="Use no-resize only when the surrounding layout already provides the right amount of room."
              id="ui-lab-textarea-no-resize"
              name="ui-lab-textarea-no-resize"
              resize="none"
              rows={4}
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Textarea should preserve the same field semantics as other entry controls, including helper copy, invalid state, and required emphasis.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-textarea-default">Default</FieldLabel>
                <Textarea
                  defaultValue="Customer-facing summary for the selected tenant."
                  id="ui-lab-textarea-default"
                  rows={4}
                />
                <FieldHint>Neutral helper copy should stay calm and short.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-textarea-invalid">Invalid</FieldLabel>
                <Textarea
                  defaultValue="Webhook notes exceed the current length rules for this environment."
                  id="ui-lab-textarea-invalid"
                  invalid
                  rows={4}
                />
                <FieldError>Keep the note under 160 characters for this review surface.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-textarea-disabled">Disabled</FieldLabel>
                <Textarea
                  defaultValue="This note is locked while the environment remains archived."
                  disabled
                  id="ui-lab-textarea-disabled"
                  rows={4}
                />
                <FieldHint>Disabled textarea should keep the same rhythm and height expectations.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-textarea-required">Required</FieldLabel>
                <Textarea
                  defaultValue="State the owner-facing reason for the rollout exception."
                  id="ui-lab-textarea-required"
                  required
                  rows={4}
                />
                <FieldHint>Required textarea fields reuse the same left accent as input and select.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsive inline field</CardTitle>
          <CardDescription>Longer textarea labels should still align cleanly when the shared field layout moves the label to the left on desktop.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inline field" stacked>
            <Field layout="responsive-inline" required>
              <FieldLabel htmlFor="ui-lab-textarea-inline">
                Operator notes for the next rollout review window
              </FieldLabel>
              <Textarea
                defaultValue="Keep this explanation concise enough for reviewers to scan, but long enough to explain why the tenant remains queued."
                id="ui-lab-textarea-inline"
                rows={5}
              />
              <FieldHint>Desktop keeps the label in a left column; mobile returns it above the control.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable reference for the shared multi-line text-entry contract.", [
        { name: "invalid", type: "boolean", notes: "Applies the same invalid treatment used by the rest of the shared entry family." },
        { name: "resize", type: "\"vertical\" | \"none\"", notes: "Controls whether the browser resize affordance stays available without creating separate textarea variants." },
        { name: "rows", type: "number", notes: "Defines the initial vertical footprint while preserving the same control contract." },
        { name: "disabled / readOnly / required", type: "native textarea props", notes: "Use native semantics while the field wrapper handles label, hint, error, and required emphasis." },
        { name: "native textarea props", type: "TextareaHTMLAttributes<HTMLTextAreaElement>", notes: "Use standard props for value, defaultValue, name, placeholder, and input semantics." },
      ])}

      {renderReferenceNotesCard(
        "Textarea should document the shared long-form entry contract separately from product-specific comment modules or rich editing surfaces.",
        [
          "The stable anatomy is a single multi-line text control that may live bare or inside a `Field` wrapper.",
          "Resize behavior remains a small control-level option instead of a separate screen-specific variant.",
          "Required, hint, and error semantics still come from the surrounding field shell.",
        ],
        [
          "`invalid`, `resize`, `rows`, and standard textarea props define the stable control-level API.",
          "Use `Field` to carry label, hint, error, and required semantics instead of inventing textarea-specific wrapper APIs.",
          "Keep textarea focused on plain multi-line entry, not rich formatting or workflow-owned editing patterns.",
        ],
        [
          "Textarea still needs a visible label or equivalent accessible name beyond placeholder text.",
          "Helper and error copy should remain connected through the field layer so validation is not color-only.",
          "Do not rely on placeholder copy as the primary instruction for longer-form entry.",
        ],
      )}

      {renderUsageReviewCard(
        "Textarea is appropriate when users need plain multi-line input that is still short enough to stay inside the shared entry contract.",
        [
          "A form needs notes, summaries, descriptions, or review comments longer than a single text line.",
          "The surface still benefits from the same lightweight field and validation structure used by other form controls.",
        ],
        [
          "Keep labels explicit and helper copy concise.",
          "Use textarea for plain multi-line entry before reaching for a richer editor or screen-specific note component.",
          "Let the field shell own validation messaging and required emphasis.",
        ],
        [
          "Do not treat textarea as a rich text editor or markdown surface.",
          "Do not build bespoke note-card controls when the shared multi-line contract is sufficient.",
          "Do not overload the control with screen-specific formatting helpers that belong outside the base primitive.",
        ],
      )}
    </div>
  );
}

export function renderRichTextEditorDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Editable foundation</CardTitle>
          <CardDescription>Rich text should feel closer to an editorial surface than a dressed-up textarea, while still staying inside a disciplined first-slice contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Editorial surface" stacked>
            <RichTextEditorPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readonly renderer</CardTitle>
          <CardDescription>Stored HTML must also have a simple shared rendering contract for summaries, readonly fields, and content blocks.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Sanitized HTML display" stacked>
            <RichTextReadonlyPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Rich text should still read like part of the shared form-entry family, not like an isolated product-specific editor.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-rich-text-editor-field-default">Default</FieldLabel>
                <RichTextEditor
                  defaultValue="<h3>Operator notes</h3><p>Operator notes can use <strong>emphasis</strong> and lists without reaching for a full document editor.</p>"
                  id="ui-lab-rich-text-editor-field-default"
                  placeholder="Write operator notes..."
                />
                <FieldHint>Keep the first slice intentionally small: emphasis, lists, links, undo, and redo.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-rich-text-editor-field-invalid">Invalid</FieldLabel>
                <RichTextEditor
                  defaultValue="<p>This example stays editable while the field shell carries the invalid state.</p>"
                  id="ui-lab-rich-text-editor-field-invalid"
                  invalid
                />
                <FieldError>Remove unsupported formatting before saving this field.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable first-slice reference for the shared rich-text editor surface.", [
        { name: "value / defaultValue", type: "string", notes: "HTML string contract for controlled and uncontrolled usage." },
        { name: "onChange", type: "(value: string) => void", notes: "Returns normalized HTML with empty content represented as an empty string." },
        { name: "disabled", type: "boolean", notes: "Disables editing while preserving the shared rich-text surface." },
        { name: "invalid", type: "boolean", notes: "Lets field-shell validation color and focus treatment stay consistent." },
        { name: "placeholder", type: "string", notes: "Provides first-slice empty-state guidance inside the editor body." },
        { name: "toolbarPreset", type: "\"basic\"", notes: "First slice keeps one toolbar preset until richer editor profiles are approved." },
      ])}

      {renderReferenceNotesCard(
        "Rich text should be a shared editor foundation, not a one-off screen-owned exception.",
        [
          "Use one editor primitive in `ui-kit` and prove it in `ui-lab` before wiring product flows.",
          "Store sanitized HTML as the first-slice persisted value shape.",
          "Keep the toolbar limited to the approved first-slice formatting set.",
        ],
        [
          "Prefer `Tiptap OSS` as the shared editor foundation.",
          "Ship a separate readonly renderer for stored HTML instead of keeping editor chrome mounted everywhere.",
          "Keep collaboration, embeds, images, and advanced document tooling out of the initial contract.",
        ],
        [
          "Do not replace rich text with textarea plus raw HTML entry.",
          "Do not let the shared editor define storage semantics on its own.",
          "Do not pull paid or cloud-coupled extensions into the first slice.",
        ],
      )}
    </div>
  );
}

export function renderCheckboxDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Checkbox stays compact, explicit, and useful for forms and bulk selection patterns.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <label className="ui-lab-page__inline-control">
              <Checkbox name="ui-lab-checkbox-unchecked" />
              <span>Unchecked</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Checkbox defaultChecked name="ui-lab-checkbox-checked" />
              <span>Checked</span>
            </label>
          </ShowcaseRow>
          <ShowcaseRow label="Advanced">
            <label className="ui-lab-page__inline-control">
              <Checkbox indeterminate name="ui-lab-checkbox-indeterminate" />
              <span>Indeterminate</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Checkbox defaultChecked disabled name="ui-lab-checkbox-disabled" />
              <span>Disabled</span>
            </label>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Checkbox often needs context copy next to it, not around it.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Consent" stacked>
            <Field>
              <label className="ui-lab-page__inline-control">
                <Checkbox defaultChecked name="ui-lab-checkbox-consent" />
                <span>Notify tenant owners about configuration changes</span>
              </label>
              <FieldHint>Useful where the control and its explanation must stay together.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Checkbox should stay explicit, compact, and closely coupled to its adjacent descriptive text.",
        [
          "The primitive is a checkbox control paired with nearby supporting text, often wrapped by a label.",
          "Indeterminate remains a first-class state for table and tree selection patterns.",
          "Field-level helper text can surround a checkbox group without changing the checkbox contract itself.",
        ],
        [
          "`defaultChecked`, `checked`, `indeterminate`, and `disabled` are the key stable state controls.",
          "Wrap checkbox with a text label when the hit target and explanation need to move together.",
          "Keep product-specific grouping logic outside the checkbox primitive itself.",
        ],
        [
          "Every checkbox needs a visible text label or an equivalent accessible naming relationship.",
          "Indeterminate state should still have clear surrounding copy so its meaning is not purely visual.",
          "Use checkbox for binary participation in a set, not for immediate on/off system settings better served by switch.",
        ],
      )}
    </div>
  );
}

export function renderSwitchDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Switch scale should stay balanced with form density and supporting copy.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Pill">
            <Switch aria-label="Small pill switch preview" defaultChecked name="ui-lab-switch-pill-sm" size="sm" />
            <Switch aria-label="Medium pill switch preview" defaultChecked name="ui-lab-switch-pill-md" size="md" />
            <Switch aria-label="Large pill switch preview" defaultChecked name="ui-lab-switch-pill-lg" size="lg" />
          </ShowcaseRow>
          <ShowcaseRow label="Square">
            <Switch
              aria-label="Small square switch preview"
              defaultChecked
              name="ui-lab-switch-square-sm"
              shape="square"
              size="sm"
            />
            <Switch
              aria-label="Medium square switch preview"
              defaultChecked
              name="ui-lab-switch-square-md"
              shape="square"
              size="md"
            />
            <Switch
              aria-label="Large square switch preview"
              defaultChecked
              name="ui-lab-switch-square-lg"
              shape="square"
              size="lg"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Boolean controls need both affordance clarity and disabled-state restraint.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <label className="ui-lab-page__inline-control">
              <Switch name="ui-lab-switch-default-off" />
              <span>Off</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Switch defaultChecked name="ui-lab-switch-default-on" />
              <span>On</span>
            </label>
          </ShowcaseRow>
          <ShowcaseRow label="Disabled">
            <label className="ui-lab-page__inline-control">
              <Switch disabled name="ui-lab-switch-disabled-off" />
              <span>Unavailable</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Switch defaultChecked disabled name="ui-lab-switch-disabled-on" />
              <span>Locked on</span>
            </label>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Switch documents the shared on/off control for immediate boolean settings where the state should read as enabled or disabled.",
        [
          "The stable anatomy is track, thumb, and adjacent descriptive label outside the control.",
          "Shape and size change density without changing the boolean meaning of the primitive.",
          "Switch stays small and composable rather than carrying field copy or workflow logic internally.",
        ],
        [
          "`size`, `shape`, `defaultChecked`, `checked`, and `disabled` define the current stable surface.",
          "Use external label text to explain the setting rather than putting prose inside the control.",
          "Keep domain-specific automation or side-effect logic outside the switch primitive.",
        ],
        [
          "Use switch where the user expects an immediate on/off setting, not checklist-style selection.",
          "Pair the control with visible text so the current state is understandable without color or motion alone.",
          "Disabled switches still need surrounding context that explains why the setting is unavailable.",
        ],
      )}
    </div>
  );
}

export function renderSliderDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Range states</CardTitle>
          <CardDescription>Slider should stay a calm single-value range control for measured adjustments, not a full chart or range-builder.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <div className="ui-lab-page__slider-stack">
              <SliderValueRow
                ariaLabel="Rollout threshold"
                defaultValue={35}
                label="Rollout threshold"
                name="ui-lab-slider-rollout-threshold"
              />
              <SliderValueRow
                ariaLabel="Signal sensitivity"
                defaultValue={60}
                label="Signal sensitivity"
                name="ui-lab-slider-signal-sensitivity"
              />
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Step and disabled" stacked>
            <div className="ui-lab-page__slider-stack">
              <SliderValueRow
                ariaLabel="Seat multiplier"
                defaultValue={4}
                label="Seat multiplier"
                max={10}
                min={0}
                name="ui-lab-slider-seat-multiplier"
                step={2}
              />
              <SliderValueRow
                ariaLabel="Locked value"
                defaultValue={70}
                disabled
                label="Locked value"
                name="ui-lab-slider-locked-value"
              />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Slider should still compose inside shared field structure when the adjustment needs label and helper text.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Field" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-slider-retention">Retention window</FieldLabel>
              <Slider defaultValue={45} id="ui-lab-slider-retention" max={90} min={0} step={5} />
              <FieldHint>Use slider for bounded continuous values that benefit from direct adjustment.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared single-value slider API used by bounded adjustments.", [
        { name: "value / defaultValue", type: "number", notes: "Controlled or uncontrolled current value for the single-thumb slider." },
        { name: "onValueChange", type: "(value: number) => void", notes: "Emits the resolved numeric value whenever the user changes the thumb position." },
        { name: "min / max / step", type: "number", notes: "Defines the numeric range and stepping behavior for the control." },
        { name: "disabled", type: "boolean", notes: "Suppresses interaction while preserving the same slider footprint and structure." },
      ])}

      {renderReferenceNotesCard(
        "Slider should stay a calm single-value adjustment primitive until a stronger need for multi-thumb range sliders exists.",
        [
          "The stable anatomy is one linear track plus one thumb for a bounded numeric value.",
          "Supporting copy and numeric interpretation belong outside the primitive so the slider itself stays generic.",
          "The current stable contract is intentionally single-value rather than a range-builder.",
        ],
        [
          "Use slider where direct bounded adjustment is clearer than free text entry or a select list.",
          "Keep numeric context nearby so the chosen value remains understandable.",
          "Treat multi-thumb or graph-like range editing as a separate future contract if the need becomes real.",
        ],
        [
          "The slider needs an accessible label because the track alone does not expose the meaning of the value.",
          "Do not rely only on position and color to communicate what the current value means.",
          "Step values and min/max bounds should remain explicit through nearby copy when they matter to interpretation.",
        ],
      )}

      {renderUsageReviewCard(
        "Slider works best for bounded single-value adjustments where users benefit from direct manipulation instead of text entry.",
        [
          "A setting has a finite numeric range and users can benefit from dragging to an approximate or stepped value.",
          "The control should make relative increase or decrease immediately visible.",
        ],
        [
          "Use slider for bounded measured adjustments with clear nearby labels and context.",
          "Keep the track single-purpose and the surrounding copy explicit about what is being changed.",
          "Prefer small step values or a select/input when exact precision matters more than direct manipulation.",
        ],
        [
          "Do not use slider for values where precision entry is more important than range scanning.",
          "Do not overload the shared primitive with multi-thumb, chart, or dashboard semantics prematurely.",
          "Do not hide the meaning of the current value behind position alone.",
        ],
      )}
    </div>
  );
}

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

export function renderRadioGroupDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Orientation and sizes</CardTitle>
          <CardDescription>Radio group should stay compact, explicit, and clearly separate from checkbox or select.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <RadioGroup>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem defaultChecked name="ui-lab-radio-density" value="balanced" />
                <span className="ui-lab-page__radio-copy">
                  <span className="ui-lab-page__radio-label">Balanced rollout</span>
                  <span className="ui-lab-page__radio-description">Default operational path for seeded tenant onboarding.</span>
                </span>
              </label>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem name="ui-lab-radio-density" value="strict" />
                <span className="ui-lab-page__radio-copy">
                  <span className="ui-lab-page__radio-label">Strict review</span>
                  <span className="ui-lab-page__radio-description">Requires explicit approval before plan or access changes are applied.</span>
                </span>
              </label>
            </RadioGroup>
          </ShowcaseRow>

          <ShowcaseRow label="Horizontal" stacked>
            <RadioGroup orientation="horizontal">
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem defaultChecked name="ui-lab-radio-size" size="sm" value="sm" />
                <span className="ui-lab-page__radio-label">Small</span>
              </label>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem name="ui-lab-radio-size" value="md" />
                <span className="ui-lab-page__radio-label">Medium</span>
              </label>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem name="ui-lab-radio-size" size="lg" value="lg" />
                <span className="ui-lab-page__radio-label">Large</span>
              </label>
            </RadioGroup>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Radio group should fit the same field shell and validation model used by the rest of the form layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Required" stacked>
            <Field required>
              <FieldLabel>Provisioning mode</FieldLabel>
              <RadioGroup>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem defaultChecked name="ui-lab-radio-provisioning" value="self-serve" />
                  <span className="ui-lab-page__radio-copy">
                    <span className="ui-lab-page__radio-label">Self-serve</span>
                    <span className="ui-lab-page__radio-description">Tenant teams can trigger provisioning without platform review.</span>
                  </span>
                </label>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem name="ui-lab-radio-provisioning" value="managed" />
                  <span className="ui-lab-page__radio-copy">
                    <span className="ui-lab-page__radio-label">Managed rollout</span>
                    <span className="ui-lab-page__radio-description">Platform operations owns rollout sequencing and recovery.</span>
                  </span>
                </label>
              </RadioGroup>
              <FieldHint>Use radio when the user should compare a small set of explicit options directly.</FieldHint>
            </Field>
          </ShowcaseRow>

          <ShowcaseRow label="Invalid" stacked>
            <Field invalid>
              <FieldLabel>Escalation policy</FieldLabel>
              <RadioGroup>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem invalid name="ui-lab-radio-escalation" value="email" />
                  <span className="ui-lab-page__radio-label">Email only</span>
                </label>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem invalid name="ui-lab-radio-escalation" value="pager" />
                  <span className="ui-lab-page__radio-label">Pager and email</span>
                </label>
              </RadioGroup>
              <FieldError>Select one escalation path before saving the workflow.</FieldError>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable single-choice reference for the shared radio-group contract.", [
        { name: "orientation", type: "\"vertical\" | \"horizontal\"", notes: "Controls layout density without changing the underlying selection contract." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts the radio control itself while leaving labels and descriptions compositional." },
        { name: "invalid", type: "boolean", notes: "Applies a visible invalid treatment when validation needs to surface on the control." },
        { name: "name / value / checked", type: "native radio props", notes: "Use native radio semantics so only one option stays selected in the same group." },
      ])}

      {renderReferenceNotesCard(
        "Radio group should stay the lightest single-choice primitive between select and checkbox.",
        [
          "The contract is a group wrapper plus individual radio items, with option labels and descriptions composed outside the input itself.",
          "Options may stay simple inline labels or grow into label-description rows without changing the primitive.",
          "Hint and error content belong to the surrounding field shell, not bespoke radio variants.",
        ],
        [
          "`orientation` belongs to the group; `size` and `invalid` belong to the radio item.",
          "Use native radio props such as `name`, `value`, `checked`, and `defaultChecked` for selection state.",
          "Keep richer comparison layouts outside `ui-kit` until a reusable option-card contract is approved.",
        ],
        [
          "Every radio in one choice set needs the same `name` so keyboard and screen-reader behavior stays correct.",
          "Wrap each radio in a label or connect it through `htmlFor` so the hit-area stays usable.",
          "Reserve radio for short, explicit option sets that benefit from direct comparison.",
        ],
      )}

      {renderUsageReviewCard(
        "Radio group works best for small explicit choices that should stay visible during comparison.",
        [
          "The user needs to pick exactly one option from a short list and benefits from seeing the options directly.",
          "Each option may need a short supporting description without hiding the alternatives.",
        ],
        [
          "Use radio when the choices are stable and should remain visible on the page.",
          "Keep copy concise and make one default option explicit when the product genuinely has a recommended path.",
          "Pair radio groups with field-level hint or error copy instead of embedding validation into each option row.",
        ],
        [
          "Do not replace large searchable option sets that belong in select or command-style surfaces.",
          "Do not turn each option into a bespoke card until a stable reusable card-choice contract exists.",
          "Do not mix many independent radio names in one compact row where keyboard focus becomes unclear.",
        ],
      )}
    </div>
  );
}

export function renderFieldDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Base layouts</CardTitle>
          <CardDescription>Field should keep two stable label placements: stacked by default and responsive inline where desktop can carry the label on the left.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-field-name">Tenant name</FieldLabel>
              <Input defaultValue="Aurora Commerce" id="ui-lab-field-name" />
              <FieldHint>Used across listings, detail views, and admin forms.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Read only" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-field-slug">Slug</FieldLabel>
              <Input defaultValue="aurora-commerce" id="ui-lab-field-slug" readOnly />
              <FieldHint>Read-only fields should still preserve the same label and helper structure.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Responsive inline" stacked>
            <Field layout="responsive-inline">
              <FieldLabel htmlFor="ui-lab-field-host-inline">Primary host</FieldLabel>
              <Input defaultValue="aurora.platform.local" id="ui-lab-field-host-inline" />
              <FieldHint>Desktop keeps the label on the left; mobile stacks the same field back above the control.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation</CardTitle>
          <CardDescription>Hint and error states should stay explicit and not rely on product-specific surrounding copy.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Hint" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-field-owner">Owner email</FieldLabel>
              <Input defaultValue="owner@platform.local" id="ui-lab-field-owner" />
              <FieldHint>Use helper text when the field needs setup guidance, not validation.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Error" stacked>
            <Field invalid>
              <FieldLabel htmlFor="ui-lab-field-webhook">Webhook URL</FieldLabel>
              <Input defaultValue="not-a-url" id="ui-lab-field-webhook" invalid />
              <FieldError>Enter a valid HTTPS endpoint.</FieldError>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Required accent" stacked>
            <FormGrid columns={1}>
              <Field required>
                <FieldLabel htmlFor="ui-lab-field-required-input">Tenant name</FieldLabel>
                <Input defaultValue="Aurora Commerce" id="ui-lab-field-required-input" required />
                <FieldHint>Input inherits the required accent from the field wrapper.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-field-required-select">Plan tier</FieldLabel>
                <Select defaultValue="growth" id="ui-lab-field-required-select" required>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Select uses the same required accent without needing a separate select-specific variant.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-field-required-textarea">Internal notes</FieldLabel>
                <Textarea
                  defaultValue="Required field styling should remain shared across base form controls."
                  id="ui-lab-field-required-textarea"
                  required
                  rows={3}
                />
                <FieldHint>Textarea follows the same required signal as the rest of the base field layer.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Field is the smallest reusable wrapper for label, control, and supporting copy across the shared form layer.",
        [
          "A field groups one label, one control slot, and optional hint or error messaging.",
          "The wrapper keeps spacing and message hierarchy stable across text, select, checkbox, and textarea controls.",
          "Two base layouts are allowed: default stacked labels and responsive inline labels that move left on desktop and return above on mobile.",
          "Read-only and invalid examples are expressed by combining field semantics with the child control state.",
        ],
        [
          "Use the `invalid` field state when the wrapper needs to reflect validation along with the child control.",
          "Use `required` on the field wrapper when the whole field should expose the shared required accent across base controls.",
          "Use `layout=\"responsive-inline\"` only when the form benefits from a left label on desktop without introducing a separate screen-specific layout shell.",
          "Choose `FieldHint` or `FieldError` based on whether the message is advisory or corrective.",
          "Keep field composition generic so workflow-specific copy remains outside the shared form contract.",
        ],
        [
          "Every field should expose a clear label-to-control relationship through `htmlFor` and matching control `id`.",
          "Helper and error text should stay concise so screen-reader output remains understandable.",
          "Do not rely on color changes alone to distinguish hint from validation states.",
        ],
      )}
    </div>
  );
}

export function renderFormShellDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Section composition</CardTitle>
          <CardDescription>Form shell should provide spacing, section rhythm, and safe composition without forcing one label placement across every form.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Single section" stacked>
            <FormShell>
              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Workspace settings</FormSectionTitle>
                  <FormSectionDescription>
                    Section titles and descriptions should stay calmer than page headers and only frame the local group.
                  </FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={2}>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-workspace">Workspace</FieldLabel>
                    <Input defaultValue="Aurora" id="ui-lab-formshell-workspace" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-plan">Plan</FieldLabel>
                    <Select defaultValue="growth" id="ui-lab-formshell-plan">
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="enterprise">Enterprise</option>
                    </Select>
                  </Field>
                </FormGrid>
              </FormSection>
            </FormShell>
          </ShowcaseRow>
          <ShowcaseRow label="Responsive inline labels" stacked>
            <FormShell>
              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Operator settings</FormSectionTitle>
                  <FormSectionDescription>
                    Shared form shell should support the desktop-left/mobile-top label pattern without a different shell primitive.
                  </FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={1}>
                  <Field layout="responsive-inline">
                    <FieldLabel htmlFor="ui-lab-formshell-inline-owner">Owner email</FieldLabel>
                    <Input defaultValue="owner@aurora.platform.local" id="ui-lab-formshell-inline-owner" />
                    <FieldHint>Use when wider desktop forms benefit from a calmer left column for labels.</FieldHint>
                  </Field>
                  <Field invalid layout="responsive-inline">
                    <FieldLabel htmlFor="ui-lab-formshell-inline-webhook">Webhook URL</FieldLabel>
                    <Input defaultValue="not-a-url" id="ui-lab-formshell-inline-webhook" invalid />
                    <FieldError>Enter a valid HTTPS endpoint.</FieldError>
                  </Field>
                </FormGrid>
              </FormSection>
            </FormShell>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-section layout</CardTitle>
          <CardDescription>Multi-section forms need clear rhythm and should still read well when one section becomes denser than another.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Two sections" stacked>
            <FormShell>
              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Identity</FormSectionTitle>
                  <FormSectionDescription>Core naming and addressing fields for the entity.</FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={2}>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-name">Tenant name</FieldLabel>
                    <Input defaultValue="Nova Labs" id="ui-lab-formshell-name" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-host">Host</FieldLabel>
                    <Input defaultValue="nova.platform.local" id="ui-lab-formshell-host" />
                  </Field>
                </FormGrid>
              </FormSection>

              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Behavior</FormSectionTitle>
                  <FormSectionDescription>Boolean and narrative settings should still live inside the same shell rhythm.</FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={1}>
                  <Field>
                    <label className="ui-lab-page__inline-control">
                      <Checkbox defaultChecked name="ui-lab-formshell-rollout-banner" />
                      <span>Expose rollout banner to tenant admins</span>
                    </label>
                    <FieldHint>Small control groups should still align with section spacing and section semantics.</FieldHint>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-notes">Notes</FieldLabel>
                    <Textarea
                      defaultValue="Form shell should organize the sections, not decide product-specific form behavior."
                      id="ui-lab-formshell-notes"
                      rows={3}
                    />
                  </Field>
                </FormGrid>
              </FormSection>
            </FormShell>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Form shell should document layout rhythm and section composition without hard-coding product workflow decisions.",
        [
          "The stable hierarchy is shell, section, section header, section copy, and field grid.",
          "Sections can hold mixed control types while preserving the same spacing and title rhythm.",
          "Form shell can host both stacked and responsive-inline fields without becoming a separate screen-specific layout system.",
          "The shell organizes form structure, not submit logic, side effects, or product-specific progression.",
        ],
        [
          "Use `FormSection`, `FormSectionHeader`, `FormSectionTitle`, `FormSectionDescription`, and `FormGrid` compositionally.",
          "Adjust density through field and grid choices instead of inventing new form-shell variants for each screen.",
          "Leave action bars and workflow sequencing outside the shared shell unless they become a proven cross-surface contract.",
        ],
        [
          "Keep section headings semantically ordered so form structure is navigable by assistive technology.",
          "Do not split related fields across distant sections if the reading flow becomes harder to follow.",
          "Ensure dense multi-column layouts still collapse into a readable order on smaller screens.",
        ],
      )}
    </div>
  );
}
