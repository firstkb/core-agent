import {
  Badge,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeaderBody,
  CardTitle,
  CardToolbar,
  Checkbox,
  CollectionEmptyState,
  CollectionLoadingState,
  EmptyState,
  ErrorState,
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
  GuidedEmptyState,
  Input,
  LoadingState,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Pagination,
  Select,
  Skeleton,
  SkeletonText,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableLoadingState,
  TableMetaCell,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@platform/ui-kit";

import type { UiLabLeafId, UiLabLeafMeta } from "../model/leaf-meta";
import { demoRows, getStatusTone } from "../model/leaf-meta";
import { getLeafStatus } from "../model/status";
import {
  renderComingSoonPanel,
  renderInventoryPatternNotes,
  renderUsageReviewCard,
} from "../components/docs-cards";
import {
  renderAspectRatioDocs,
  renderButtonDocs,
  renderCheckboxDocs,
  renderComboboxDocs,
  renderDateFieldDocs,
  renderFieldDocs,
  renderFormShellDocs,
  renderInputDocs,
  renderInputOtpDocs,
  renderLabelDocs,
  renderRadioGroupDocs,
  renderScrollAreaDocs,
  renderSelectDocs,
  renderSliderDocs,
  renderSwitchDocs,
  renderTagInputDocs,
  renderTextareaDocs,
  renderToggleDocs,
  renderToggleGroupDocs,
} from "./form-controls";
import {
  renderCodeDocs,
  renderFoundationsLayoutGridDocs,
  renderFoundationsOverviewDocs,
  renderFoundationsSurfaceRulesDocs,
  renderFoundationsTokensDocs,
  renderKbdDocs,
} from "./foundations";
import {
  renderAccordionDocs,
  renderBreadcrumbDocs,
  renderCollapsibleDocs,
  renderLinkDocs,
  renderPaginationDocs,
  renderPageToolbarDocs,
  renderSecondaryTabsDocs,
  renderStepperDocs,
  renderTabsDocs,
} from "./navigation-primitives";
import {
  renderAlertDialogDocs,
  renderContextMenuDocs,
  renderDialogDocs,
  renderDrawerDocs,
  renderHoverCardDocs,
  renderMenuDocs,
  renderPopoverDocs,
  renderSheetDocs,
  renderSidebarDocs,
  renderTooltipDocs,
} from "./overlay-contracts";
import {
  renderAvatarDocs,
  renderBadgeDocs,
  renderCardDocs,
  renderEmptyStatesDocs,
  renderFilterChipDocs,
  renderRatingDocs,
  renderSeparatorDocs,
  renderStatusDocs,
  renderTableColumnHeaderDocs,
  renderTableColumnVisibilityDocs,
  renderTableDocs,
  renderTablePaginationBarDocs,
  renderTableStatesDocs,
} from "./data-display";
import {
  renderAlertDocs,
  renderErrorStatesDocs,
  renderLoadingStatesDocs,
  renderProgressDocs,
  renderSkeletonDocs,
  renderTopLoaderDocs,
} from "./states";
import {
  renderSummaryPillStripDocs,
  renderViewPresetBarDocs,
} from "./inventory";

export function renderPanel(
  activeItem: UiLabLeafMeta,
  onNavigateToLeaf: (id: UiLabLeafId) => void,
  onAlertDialogOpenChange: (open: boolean) => void,
  onDialogOpenChange: (open: boolean) => void,
  onDrawerOpenChange: (open: boolean) => void,
  onSheetOpenChange: (open: boolean) => void,
  onSidebarDrawerOpenChange: (open: boolean) => void,
  activePresetId: string,
  onPresetSelect: (presetId: string) => void,
  page: number,
  onPageChange: (pageValue: number) => void,
  activeStep: number,
  onStepChange: (step: number) => void,
  selectedDateValue: string,
  onDateValueChange: (value: string) => void,
  rangeStartDate: string,
  rangeEndDate: string,
  onRangeStartDateChange: (value: string) => void,
  onRangeEndDateChange: (value: string) => void,
  activeRangePresetId: string | null,
  onRangePresetSelect: (presetId: string) => void,
) {
  if (getLeafStatus(activeItem.id) === "coming") {
    return renderComingSoonPanel(activeItem);
  }

  switch (activeItem.panelId) {
    case "form-controls":
      if (activeItem.id === "button-doc") {
        return renderButtonDocs();
      }

      if (activeItem.id === "input-doc") {
        return renderInputDocs();
      }

      if (activeItem.id === "input-otp-doc") {
        return renderInputOtpDocs();
      }

      if (activeItem.id === "label-doc") {
        return renderLabelDocs();
      }

      if (activeItem.id === "date-field-doc") {
        return renderDateFieldDocs(
          selectedDateValue,
          onDateValueChange,
          rangeStartDate,
          rangeEndDate,
          onRangeStartDateChange,
          onRangeEndDateChange,
          activeRangePresetId,
          onRangePresetSelect,
        );
      }

      if (activeItem.id === "select-doc") {
        return renderSelectDocs();
      }

      if (activeItem.id === "combobox-doc") {
        return renderComboboxDocs();
      }

      if (activeItem.id === "textarea-doc") {
        return renderTextareaDocs();
      }

      if (activeItem.id === "tag-input-doc") {
        return renderTagInputDocs();
      }

      if (activeItem.id === "checkbox-doc") {
        return renderCheckboxDocs();
      }

      if (activeItem.id === "radio-group-doc") {
        return renderRadioGroupDocs();
      }

      if (activeItem.id === "switch-doc") {
        return renderSwitchDocs();
      }

      if (activeItem.id === "slider-doc") {
        return renderSliderDocs();
      }

      if (activeItem.id === "toggle-doc") {
        return renderToggleDocs();
      }

      if (activeItem.id === "toggle-group-doc") {
        return renderToggleGroupDocs();
      }

      if (activeItem.id === "field-doc") {
        return renderFieldDocs();
      }

      if (activeItem.id === "form-shell-doc") {
        return renderFormShellDocs();
      }

      return (
        <div className="ui-lab-page__panel-grid">
          <Card>
            <CardHeader>
              <CardTitle>Text entry</CardTitle>
              <CardDescription>{activeItem.label} branch uses the stable entry contract.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <Input
                aria-label="Tenant display name preview"
                defaultValue="Aurora Commerce"
                id="ui-lab-form-controls-overview-name"
                name="ui-lab-form-controls-overview-name"
                placeholder="Tenant display name"
              />
              <Select
                aria-label="Plan tier preview"
                defaultValue="growth"
                id="ui-lab-form-controls-overview-plan"
                name="ui-lab-form-controls-overview-plan"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
              <Textarea
                aria-label="Product copy preview"
                defaultValue="Product copy and validation rules stay app-owned until the contract is approved."
                id="ui-lab-form-controls-overview-copy"
                name="ui-lab-form-controls-overview-copy"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selection controls</CardTitle>
            <CardDescription>Checkbox and switch remain low-risk and transportable.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <label className="ui-lab-page__inline-control">
                <Checkbox defaultChecked name="ui-lab-form-controls-provisioning" />
                <span>Enable tenant provisioning</span>
              </label>
              <label className="ui-lab-page__inline-control">
                <Checkbox name="ui-lab-form-controls-plan-approval" />
                <span>Require approval for plan changes</span>
              </label>
              <label className="ui-lab-page__inline-control">
                <Switch defaultChecked name="ui-lab-form-controls-beta-sync" />
                <span>Expose beta sync indicators</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Field and form shell</CardTitle>
              <CardDescription>Stable layout contract for generic validation states.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormShell>
                <FormSection>
                  <FormSectionHeader>
                    <FormSectionTitle>Review settings</FormSectionTitle>
                    <FormSectionDescription>
                      Field and form-shell patterns stay generic and reusable.
                    </FormSectionDescription>
                  </FormSectionHeader>
                  <FormGrid columns={2}>
                    <Field>
                      <FieldLabel htmlFor="ui-lab-tenant-name">Tenant name</FieldLabel>
                      <Input defaultValue="Aurora Commerce" id="ui-lab-tenant-name" />
                      <FieldHint>Visible across list and detail surfaces.</FieldHint>
                    </Field>
                    <Field invalid>
                      <FieldLabel htmlFor="ui-lab-webhook">Webhook URL</FieldLabel>
                      <Input defaultValue="not-a-url" id="ui-lab-webhook" />
                      <FieldError>Enter a valid HTTPS endpoint.</FieldError>
                    </Field>
                  </FormGrid>
                </FormSection>
              </FormShell>
            </CardContent>
          </Card>
        </div>
      );
    case "overlay-contracts":
      if (activeItem.id === "alert-dialog-doc") {
        return renderAlertDialogDocs(onAlertDialogOpenChange);
      }

      if (activeItem.id === "menu-doc") {
        return renderMenuDocs();
      }

      if (activeItem.id === "context-menu-doc") {
        return renderContextMenuDocs();
      }

      if (activeItem.id === "hover-card-doc") {
        return renderHoverCardDocs();
      }

      if (activeItem.id === "popover-doc") {
        return renderPopoverDocs();
      }

      if (activeItem.id === "tooltip-doc") {
        return renderTooltipDocs();
      }

      if (activeItem.id === "dialog-doc") {
        return renderDialogDocs(onDialogOpenChange);
      }

      if (activeItem.id === "drawer-doc") {
        return renderDrawerDocs(onDrawerOpenChange);
      }

      if (activeItem.id === "sheet-doc") {
        return renderSheetDocs(onSheetOpenChange);
      }

      return (
        <div className="ui-lab-page__panel-grid">
          <Card>
            <CardHeader>
              <CardTitle>Menu and popover</CardTitle>
              <CardDescription>{activeItem.label} branch validates reusable overlay behavior.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <div className="ui-lab-page__inline-wrap">
                <Menu>
                  <MenuTrigger>
                    <Button variant="outline">Open menu</Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuLabel>Quick actions</MenuLabel>
                    <MenuItem>Duplicate block</MenuItem>
                    <MenuItem>Pin to review</MenuItem>
                    <MenuSeparator />
                    <MenuItem tone="danger">Remove from sandbox</MenuItem>
                  </MenuContent>
                </Menu>

                <Popover>
                  <PopoverTrigger>
                    <Button variant="secondary">Preview popover</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="ui-lab-page__stack">
                      <strong>Popover contract</strong>
                      <p className="ui-lab-page__muted">
                        Good for concise metadata, previews, and low-friction inline details.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tooltip and dialog</CardTitle>
              <CardDescription>Feedback and confirmation without domain coupling.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <div className="ui-lab-page__inline-wrap">
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost">Hover for hint</Button>
                  </TooltipTrigger>
                  <TooltipContent>Approved generic hint layer for stable UI kit usage.</TooltipContent>
                </Tooltip>

                <Button onClick={() => onDialogOpenChange(true)}>Open dialog</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    case "navigation-primitives":
      if (activeItem.id === "accordion-doc") {
        return renderAccordionDocs();
      }

      if (activeItem.id === "breadcrumb-doc") {
        return renderBreadcrumbDocs();
      }

      if (activeItem.id === "link-doc") {
        return renderLinkDocs();
      }

      if (activeItem.id === "page-toolbar-doc") {
        return renderPageToolbarDocs();
      }

      if (activeItem.id === "tabs-doc") {
        return renderTabsDocs();
      }

      if (activeItem.id === "pagination-doc") {
        return renderPaginationDocs(page, onPageChange);
      }

      if (activeItem.id === "collapsible-doc") {
        return renderCollapsibleDocs();
      }

      if (activeItem.id === "stepper-doc") {
        return renderStepperDocs(activeStep, onStepChange);
      }

      if (activeItem.id === "api-keys") {
        return renderSidebarDocs(onSidebarDrawerOpenChange);
      }

      if (activeItem.id === "secondary-tabs-doc") {
        return renderSecondaryTabsDocs();
      }

      return (
        <div className="ui-lab-page__panel-grid">
          <Card>
            <CardHeader>
              <CardTitle>Breadcrumb</CardTitle>
              <CardDescription>Context without tying the lab to admin shell chrome.</CardDescription>
            </CardHeader>
            <CardContent>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/root/ui-lab">UI Lab</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeItem.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabs and pagination</CardTitle>
              <CardDescription>Generic switching and list navigation contracts.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <Tabs defaultValue="stable">
                <TabsList>
                  <TabsTrigger badge="18" value="stable">
                    Stable
                  </TabsTrigger>
                  <TabsTrigger badge="9" value="provisional">
                    Provisional
                  </TabsTrigger>
                </TabsList>
                <TabsPanel value="stable">Approved components can move across surfaces safely.</TabsPanel>
                <TabsPanel value="provisional">Provisional patterns stay under review until clarified.</TabsPanel>
              </Tabs>

              <Pagination currentPage={page} onPageChange={onPageChange} totalPages={12} />
            </CardContent>
          </Card>
        </div>
      );
    case "data-display":
      if (activeItem.id === "aspect-ratio-doc") {
        return renderAspectRatioDocs();
      }

      if (activeItem.id === "avatar-doc") {
        return renderAvatarDocs();
      }

      if (activeItem.id === "rating-doc") {
        return renderRatingDocs();
      }

      if (activeItem.id === "card-doc") {
        return renderCardDocs();
      }

      if (activeItem.id === "filter-chip-doc") {
        return renderFilterChipDocs();
      }

      if (activeItem.id === "scroll-area-doc") {
        return renderScrollAreaDocs();
      }

      if (activeItem.id === "badge-doc") {
        return renderBadgeDocs();
      }

      if (activeItem.id === "status-doc") {
        return renderStatusDocs();
      }

      if (activeItem.id === "separator-doc") {
        return renderSeparatorDocs();
      }

      if (activeItem.id === "table-doc") {
        return renderTableDocs();
      }

      if (activeItem.id === "table-column-header-doc") {
        return renderTableColumnHeaderDocs();
      }

      if (activeItem.id === "table-pagination-bar-doc") {
        return renderTablePaginationBarDocs();
      }

      if (activeItem.id === "table-column-visibility-doc") {
        return renderTableColumnVisibilityDocs();
      }

      if (activeItem.id === "table-states-doc") {
        return renderTableStatesDocs();
      }

      return (
        <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
          <Card>
            <CardHeader>
              <CardTitle>Table contract</CardTitle>
              <CardDescription>Meta cells, badges, and dense content on one reusable surface.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__table-card">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Tenant</TableHeaderCell>
                    <TableHeaderCell>Plan</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {demoRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <TableMetaCell
                          description={row.note}
                          title={row.id.replace("tenant-", "").replace("-", " ")}
                        />
                      </TableCell>
                      <TableCell>{row.plan}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusTone(row.status)}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardToolbar>
                <CardHeaderBody>
                  <CardTitle>Card contract</CardTitle>
                  <CardDescription>Header body, toolbar, content, and footer should cover most reusable panel layouts.</CardDescription>
                </CardHeaderBody>
                <Button size="sm" variant="outline">
                  Toolbar action
                </Button>
              </CardToolbar>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <p className="ui-lab-page__card-footnote">
                Supporting surfaces should stay readable without inventing page-specific chrome inside every panel.
              </p>
              <div className="ui-lab-page__inline-wrap">
                <Skeleton height="4rem" width="4rem" />
                <SkeletonText lines={3} widths={["10rem", "14rem", "8rem"]} />
              </div>
            </CardContent>
            <CardFooter>
              <p className="ui-lab-page__card-footnote">Footer slots work best for summary context or low-frequency actions.</p>
              <Button size="sm">Save draft</Button>
            </CardFooter>
          </Card>
        </div>
      );
    case "states":
      if (activeItem.id === "alert-doc") {
        return renderAlertDocs();
      }

      if (activeItem.id === "progress-doc") {
        return renderProgressDocs();
      }

      if (activeItem.id === "top-loader-doc") {
        return renderTopLoaderDocs();
      }

      if (activeItem.id === "skeleton-doc") {
        return renderSkeletonDocs();
      }

      if (activeItem.id === "empty-states-doc") {
        return renderEmptyStatesDocs();
      }

      if (activeItem.id === "loading-states-doc") {
        return renderLoadingStatesDocs();
      }

      if (activeItem.id === "error-states-doc") {
        return renderErrorStatesDocs();
      }

      return (
        <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
          <EmptyState
            className="ui-lab-page__state-card"
            description="Use the base empty state when the screen only needs a title, short explanation, and one action."
            title="Base empty state"
          />
          <CollectionEmptyState
            className="ui-lab-page__state-card"
            description="Collection empty states work better when filters or counts need small highlights."
            highlights={[
              { id: "filters", label: "Filters", tone: "warning", value: "2 active" },
              { id: "scope", label: "Scope", tone: "brand", value: "Workspace" },
            ]}
            title="Collection empty state"
          />
          <LoadingState
            className="ui-lab-page__state-card"
            description="Base loading state helps route and panel transitions."
            title="Base loading state"
          />
          <ErrorState
            className="ui-lab-page__state-card"
            description="Generic error contracts stay reusable when they avoid domain-specific incident wording."
            title="Error state"
          />
          <CollectionLoadingState className="ui-lab-page__state-card" items={2} layout="list" />
          <TableLoadingState className="ui-lab-page__state-card ui-lab-page__state-card--wide" columns={4} rows={4} />
        </div>
      );
    case "foundations":
      if (activeItem.id === "dashboards-light-sidebar") {
        return renderFoundationsOverviewDocs();
      }

      if (activeItem.id === "activity") {
        return renderFoundationsTokensDocs();
      }

      if (activeItem.id === "network") {
        return renderFoundationsSurfaceRulesDocs();
      }

      if (activeItem.id === "layout-grid-doc") {
        return renderFoundationsLayoutGridDocs();
      }

      if (activeItem.id === "kbd-doc") {
        return renderKbdDocs();
      }

      if (activeItem.id === "code-doc") {
        return renderCodeDocs();
      }

      return renderFoundationsOverviewDocs();
    case "inventory":
      if (activeItem.id === "summary-pill-strip-doc") {
        return (
          <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
            {renderSummaryPillStripDocs()}
            {renderInventoryPatternNotes(
              "Summary pill strip",
              "Summary pill strip is still under review for density, tone mapping, and repeated usefulness.",
            )}
          </div>
        );
      }

      if (activeItem.id === "view-preset-bar-doc") {
        return (
          <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
            {renderViewPresetBarDocs(activePresetId, onPresetSelect)}
            {renderInventoryPatternNotes(
              "View preset bar",
              "View preset bar remains provisional until selection semantics and layout fit are proven across more than one surface.",
            )}
          </div>
        );
      }

      return (
        <div className="ui-lab-page__panel-grid">
          <Card>
            <CardHeader>
              <CardTitle>Inventory status</CardTitle>
              <CardDescription>Current ui-kit coverage for the canonical UI Lab sections.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <div className="ui-lab-page__inline-wrap">
                <Badge appearance="soft" variant="success">
                  Stable component families
                </Badge>
                <Badge appearance="soft" variant="brand">
                  Low-risk patterns
                </Badge>
                <Badge appearance="soft" variant="warning">
                  Provisional surfaces under review
                </Badge>
              </div>
              <GuidedEmptyState
                actions={
                  <Button onClick={() => onNavigateToLeaf("view-preset-bar-doc")} variant="outline">
                    Review next candidates
                  </Button>
                }
                description="The lab tracks what is already stable and what still needs product confirmation."
                steps={[
                  {
                    description: "Keep primitives and low-risk patterns inside ui-kit.",
                    id: "stable",
                    title: "Retain only stable contracts",
                  },
                  {
                    description: "Leave app-shaped layouts outside ui-kit until approved.",
                    id: "boundary",
                    title: "Protect package boundaries",
                  },
                  {
                    description: "Evaluate the next candidate elements in isolation here first.",
                    id: "next",
                    title: "Continue controlled expansion",
                  },
                ]}
                title="Lab review loop"
              />
            </CardContent>
          </Card>

          {renderUsageReviewCard(
            "Inventory Snapshot exists to review candidate patterns and package-boundary decisions before anything is promoted into stable shared UI kit contracts.",
            [
              "A pattern is useful enough to inspect, but still lacks enough reuse or API clarity for promotion.",
              "The team needs one place to compare candidate donor extractions against current package boundaries.",
            ],
            [
              "Use this section to separate stable contracts from provisional review material.",
              "Keep promotion decisions tied to repeated usage and clear API boundaries, not just visual success in one screen.",
              "Prefer isolated review pages here before product surfaces start depending on a candidate pattern.",
            ],
            [
              "Do not treat the inventory section as approval by default.",
              "Do not move layout-heavy or app-shaped constructs into ui-kit straight from this review area.",
              "Do not let provisional inventory become a dumping ground for unresolved product decisions.",
            ],
          )}
        </div>
      );
    case "overview":
    default:
      return (
        <div className="ui-lab-page__panel-grid">
          <Card>
            <CardHeader>
              <CardTitle>Why this route is separate</CardTitle>
              <CardDescription>The lab should not inherit product navigation or shell decisions.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <div className="ui-lab-page__inline-wrap">
                <Badge appearance="soft" variant="success">
                  Standalone route
                </Badge>
                <Badge appearance="soft" variant="brand">
                  Component docs
                </Badge>
                <Badge appearance="soft" variant="neutral">
                  No app-shell dependency
                </Badge>
              </div>
              <p className="ui-lab-page__muted">
                This route is for inspecting stable and candidate UI contracts in isolation before they move into
                product screens.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current focus</CardTitle>
              <CardDescription>Stable inventory and the next safe extraction targets.</CardDescription>
            </CardHeader>
            <CardContent className="ui-lab-page__stack">
              <p className="ui-lab-page__muted">
                Current safe candidates remain primitives such as table, menu, switch, popover, tooltip,
                breadcrumb, tabs, pagination, and richer loading states.
              </p>
              <div className="ui-lab-page__inline-wrap">
                <Button onClick={() => onNavigateToLeaf("button-doc")}>Review components</Button>
                <Button onClick={() => onNavigateToLeaf("activity")} variant="outline">
                  Inspect tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
}
