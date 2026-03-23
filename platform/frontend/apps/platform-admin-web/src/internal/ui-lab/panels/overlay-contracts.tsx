/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TableMetaCell,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@platform/ui-kit";

import {
  SidebarPreviewNav,
  ShowcaseRow,
  renderDoNotUseForCard,
  renderPropsApiCard,
  renderReferenceNotesCard,
  renderUsageReviewCard,
} from "../components/docs-cards";

export function renderDialogDocs(onDialogOpenChange: (open: boolean) => void) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Trigger patterns</CardTitle>
          <CardDescription>Dialogs should open from clear actions and keep the confirmation layer compact.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Actions">
            <Button onClick={() => onDialogOpenChange(true)}>Open dialog</Button>
            <Button onClick={() => onDialogOpenChange(true)} variant="outline">
              Secondary trigger
            </Button>
            <Button onClick={() => onDialogOpenChange(true)} variant="danger">
              Destructive trigger
            </Button>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Surface anatomy</CardTitle>
          <CardDescription>Header, body, footer, and close affordance form the reusable dialog contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <div className="ui-lab-page__showcase-row">
            <div className="ui-lab-page__showcase-row-label">Structure</div>
            <div className="ui-lab-page__note-card ui-lab-page__structure-card">
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Header</span>
                <p className="ui-lab-page__structure-copy">Title, description, and close affordance.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Body</span>
                <p className="ui-lab-page__structure-copy">Focused explanatory copy or confirmation context.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Footer</span>
                <p className="ui-lab-page__structure-copy">One secondary action and one primary action.</p>
              </div>
            </div>
          </div>
          <ShowcaseRow label="Notes" stacked>
            <p className="ui-lab-page__muted">
              Dialog and sheet are both documented now. Dialog stays the shorter blocking overlay,
              while sheet covers longer adjacent side work without turning into a route.
            </p>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable overlay reference for blocking dialog behavior and the shared composition points around it.", [
        { name: "open", type: "boolean", notes: "Controls whether the dialog surface is mounted and visible." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Single open-state callback used by overlay clicks, escape handling, and close affordances." },
        { name: "closeOnOverlay / closeOnEscape", type: "boolean", notes: "Optional behavior switches for backdrop click and escape-key dismissal." },
        { name: "DialogContent.showCloseButton", type: "boolean", notes: "Toggles the shared close affordance without changing the rest of the dialog structure." },
        { name: "header/body/footer composition", type: "DialogHeader | DialogBody | DialogFooter", notes: "Keep content structured through shared composition instead of screen-owned dialog wrappers." },
      ])}

      {renderReferenceNotesCard(
        "Dialog should document the blocking overlay contract as focused composition, not as a disguised screen builder.",
        [
          "The stable anatomy is overlay, panel, header, body, footer, and close affordance.",
          "Triggers stay external so the dialog content itself remains portable across surfaces.",
          "The body should support concise confirmation or edit context without expanding into a full page.",
        ],
        [
          "Treat dialog as a controlled or uncontrolled open-state overlay with composed header and action content.",
          "Keep trigger choice, action emphasis, and destructive tone explicit rather than inferred from surrounding layout.",
          "Limit the stable contract to focused content and closing behavior, not workflow-specific routing or form orchestration.",
        ],
        [
          "Dialog title, description, and actions should make sense when read in sequence by assistive technology.",
          "The initial focus path and escape/close behavior need to remain predictable across variants.",
          "Do not bury critical information only in visual tone or destructive styling.",
        ],
      )}

      {renderUsageReviewCard(
        "Dialog belongs to short blocking decisions, confirmations, or tightly scoped edits that need focused attention.",
        [
          "The user must confirm, cancel, or complete a short blocking task before continuing.",
          "A compact edit or confirmation flow needs stronger interruption than inline UI.",
        ],
        [
          "Keep the primary action explicit and the body concise.",
          "Limit the footer to one clear primary action plus one secondary path.",
          "Use dialog when the interruption is intentional and short-lived.",
        ],
        [
          "Do not place long forms or deep navigation inside dialog.",
          "Do not stack multiple blocking dialogs for a single workflow.",
          "Do not use dialog where a side sheet or page-level surface gives clearer room.",
        ],
      )}

      {renderDoNotUseForCard(
        "Dialog should stay out of scenarios where the user needs large, persistent, or branching workspace context.",
        [
          "Long forms, multi-step setup, or dense review flows that need sustained room and persistent surrounding context.",
          "Page-level navigation, route changes, or surfaces that should behave like a full screen instead of a blocking layer.",
          "Ambient secondary detail that can remain visible in a sheet, split panel, or inline surface without interrupting the user.",
        ],
      )}
    </div>
  );
}

export function renderAlertDialogDocs(onAlertDialogOpenChange: (open: boolean) => void) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Confirmation triggers</CardTitle>
          <CardDescription>Alert dialog should open only when the user is about to confirm a destructive or irreversible step.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Triggers">
            <Button onClick={() => onAlertDialogOpenChange(true)} variant="danger">
              Archive tenant
            </Button>
            <Button onClick={() => onAlertDialogOpenChange(true)} variant="outline">
              Confirm reset
            </Button>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structure</CardTitle>
          <CardDescription>Alert dialog should stay narrower and more explicit than a general dialog.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__note-list">
          <div className="ui-lab-page__note-card ui-lab-page__structure-card">
            <div className="ui-lab-page__structure-item">
              <span className="ui-lab-page__note-label">Header</span>
              <p className="ui-lab-page__structure-copy">Short destructive title and a concise consequence statement.</p>
            </div>
            <div className="ui-lab-page__structure-item">
              <span className="ui-lab-page__note-label">Body</span>
              <p className="ui-lab-page__structure-copy">One focused explanation of the irreversible or risky action.</p>
            </div>
            <div className="ui-lab-page__structure-item">
              <span className="ui-lab-page__note-label">Footer</span>
              <p className="ui-lab-page__structure-copy">One cancel path and one clearly emphasized confirm action.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the stricter confirmation overlay used for destructive or irreversible steps.", [
        { name: "open", type: "boolean", notes: "Controls whether the confirmation overlay is mounted and visible." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Single visibility callback shared by triggers, dismiss, action, and cancel behavior." },
        { name: "closeOnOverlay / closeOnEscape", type: "boolean", notes: "Optional dismissal controls for the blocking confirmation surface." },
        { name: "AlertDialogAction / AlertDialogCancel", type: "Button-based composition", notes: "Stable action slots keep confirmation buttons explicit and structured." },
        { name: "AlertDialogHeader / Body / Footer", type: "composition", notes: "Keep destructive confirmation anatomy consistent without screen-owned wrappers." },
      ])}

      {renderReferenceNotesCard(
        "Alert dialog should stay a compact confirmation overlay for destructive or irreversible intent, not a general-purpose editing surface.",
        [
          "The stable anatomy is an alertdialog surface with title, description, optional body content, and explicit cancel and confirm actions.",
          "Action emphasis should make the risky path obvious without relying only on color.",
          "Its wording should stay shorter and more consequence-oriented than a regular dialog.",
        ],
        [
          "Use alert dialog when the user must deliberately confirm a risky, destructive, or hard-to-undo action.",
          "Keep the body concise and focused on consequence, not on workflow branching.",
          "Use the shared action and cancel slots instead of custom footer wrappers with screen-specific language logic.",
        ],
        [
          "The title and description must explain the risk clearly for assistive technology and keyboard users.",
          "Cancel and confirm should remain explicit and reachable without relying on backdrop dismissal alone.",
          "Do not communicate severity only through red styling or destructive button color.",
        ],
      )}

      {renderUsageReviewCard(
        "Alert dialog belongs to destructive confirmations, irreversible resets, or risky actions that need one explicit pause before execution.",
        [
          "The user is about to archive, delete, revoke, reset, or otherwise trigger a hard-to-undo action.",
          "A compact confirmation pause is needed, but the surface should remain smaller and stricter than a general dialog.",
        ],
        [
          "Keep the copy short, explicit, and consequence-first.",
          "Use one clear confirm action and one clear cancel path.",
          "Prefer alert dialog over ad-hoc destructive popovers or menus when the action genuinely needs interruption.",
        ],
        [
          "Do not use alert dialog for long forms, settings review, or multi-step branching decisions.",
          "Do not hide routine non-destructive choices behind a destructive confirmation surface.",
          "Do not let alert dialog become a generic modal just because it already exists in the kit.",
        ],
      )}

      {renderDoNotUseForCard(
        "Alert dialog should stay out of scenarios that need exploration, editing room, or routine non-destructive choice.",
        [
          "General settings edit flows, form entry, or any interaction that needs sustained space and supporting context.",
          "Soft confirmations or informational notices that can stay inline, inside a drawer, or in a normal dialog.",
          "Branching workflow decisions that require preview, comparison, or more than one focused confirm step.",
        ],
      )}
    </div>
  );
}

export function renderDrawerDocs(onDrawerOpenChange: (open: boolean) => void) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>Drawer should stay a bottom overlay for mobile-first review, quick actions, and temporary navigation.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Triggers">
            <Button onClick={() => onDrawerOpenChange(true)}>Open drawer</Button>
            <Button onClick={() => onDrawerOpenChange(true)} variant="outline">
              Secondary trigger
            </Button>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structure</CardTitle>
          <CardDescription>Optional handle, header, body, and footer define the bottom-sheet contract without promoting product-specific navigation.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <div className="ui-lab-page__showcase-row">
            <div className="ui-lab-page__showcase-row-label">Contract</div>
            <div className="ui-lab-page__note-card ui-lab-page__structure-card">
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Handle</span>
                <p className="ui-lab-page__structure-copy">Optional visual marker for a bottom-sheet surface. Do not show it by default unless the product really supports drag-style behavior.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Header</span>
                <p className="ui-lab-page__structure-copy">Title, description, and close affordance for quick orientation.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Body</span>
                <p className="ui-lab-page__structure-copy">Short form, action list, or mobile review content with limited height.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Footer</span>
                <p className="ui-lab-page__structure-copy">Optional action rail when the temporary layer still needs an explicit confirm path.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared bottom-overlay API that drawer uses for mobile-first temporary surfaces.", [
        { name: "open", type: "boolean", notes: "Controls whether the drawer is mounted and visible." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Single visibility callback for triggers, backdrop click, escape, and close affordances." },
        { name: "closeOnOverlay / closeOnEscape", type: "boolean", notes: "Optional dismissal controls that keep the drawer behavior aligned with the other overlay primitives." },
        { name: "DrawerContent.showHandle", type: "boolean", notes: "Optional visual handle for teams that intentionally want a bottom-sheet marker. It should not imply drag support unless the product adds that behavior." },
        { name: "DrawerHeader / DrawerBody / DrawerFooter", type: "composition", notes: "Bottom-sheet content stays composed rather than receiving page-specific props." },
      ])}

      {renderReferenceNotesCard(
        "Drawer should document the shared bottom-sheet contract as a lightweight mobile overlay, not as a hidden app shell.",
        [
          "The stable anatomy is backdrop, bottom-sheet surface, optional handle, header, body, footer, and close affordance.",
          "Drawer reads as more temporary and mobile-first than sheet, while still allowing more room than a tooltip or popover.",
          "Its body should remain composition-friendly so short forms, mobile action lists, or review content can reuse the same shell.",
        ],
        [
          "The stable API centers on open-state control plus a small set of composition slots rather than workflow-specific variants.",
          "Use the shared drawer shell for temporary mobile surfaces before inventing route-specific bottom panels.",
          "Keep navigation-like content in app code even when the shell itself is stable enough for ui-kit.",
        ],
        [
          "The drawer title and description should explain the temporary surface clearly when focus moves into it.",
          "Dismissal behavior must stay predictable for overlay click, escape, and explicit close actions.",
          "Do not rely on drag behavior or gesture-only discovery as the only way to understand or close the surface.",
        ],
      )}

      {renderUsageReviewCard(
        "Drawer fits temporary bottom-up surfaces where mobile context matters but a full route would be too heavy.",
        [
          "A mobile-first surface needs more room than popover or tooltip, but does not warrant a full page or side sheet.",
          "The user needs a short action list, compact form, or contextual review layer that can slide up and close quickly.",
        ],
        [
          "Keep the body compact enough that the bottom-sheet nature remains obvious.",
          "Use drawer for temporary mobile review and quick settings rather than durable workspace context.",
          "Prefer a stable shared shell and leave app-specific navigation or orchestration outside the primitive.",
        ],
        [
          "Do not turn drawer into a disguised full-screen route with deep navigation and dense page chrome.",
          "Do not use drawer where side-by-side desktop room or persistent context is required.",
          "Do not add product-specific gesture logic to the primitive before the shared contract proves necessary.",
        ],
      )}

      {renderDoNotUseForCard(
        "Drawer should stay out of persistent app navigation and large long-form workflows.",
        [
          "Primary desktop navigation, permanent left rails, or any app shell that needs to stay mounted while users work.",
          "Large branching forms, long investigative detail flows, or review surfaces that need more durable context than a temporary bottom overlay.",
          "Page-level orchestration that should live in app code or routing rather than in a shared bottom-sheet primitive.",
        ],
      )}
    </div>
  );
}


export function renderSidebarDocs(onDrawerOpenChange: (open: boolean) => void) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Desktop navigation</CardTitle>
          <CardDescription>Sidebar should stay a generic nested navigation tree with reusable disclosure and active-state behavior.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__stack">
          <div className="ui-lab-page__inline-wrap">
            <Badge appearance="soft" variant="brand">
              UI Kit
            </Badge>
            <Badge appearance="soft" variant="success">
              Shared navigation tree
            </Badge>
          </div>
          <SidebarPreviewNav />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mobile relation</CardTitle>
          <CardDescription>The same sidebar tree should stay usable inside a left off-canvas mobile shell without changing its item contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__stack">
          <div className="ui-lab-page__sidebar-preview-mobile-callout">
            <p className="ui-lab-page__muted">
              Use the mobile preview to validate that the same shared tree still reads clearly when it slides in from the left on smaller screens.
            </p>
            <Button onClick={() => onDrawerOpenChange(true)} variant="outline">
              Open mobile nav preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared nested sidebar navigation contract.", [
        { name: "items", type: "SidebarNavItem[]", notes: "Nested navigation tree with labels, optional icons, optional meta, and recursive children." },
        { name: "activeItemId / defaultActiveItemId", type: "string", notes: "Controls or seeds the active leaf without making parent disclosure state implicit." },
        { name: "openItemIds / defaultOpenItemIds", type: "string[]", notes: "Controls or seeds which parent branches are expanded." },
        { name: "onActiveItemChange", type: "(itemId, item) => void", notes: "Emits whenever a leaf is selected so routing can stay app-owned." },
        { name: "onOpenItemIdsChange", type: "(itemIds) => void", notes: "Emits disclosure updates for teams that want controlled sidebar state." },
        { name: "disclosureMode", type: "\"single\" | \"multiple\"", notes: "Lets sibling branches behave like a classic sidebar accordion when only one section per level should stay open." },
        { name: "SidebarNavItem.collapsedLabel / expandedLabel", type: "string", notes: "Allows rows such as `More 4` to flip to `Less` without inventing special-case markup outside the shared tree." },
        { name: "compact", type: "boolean", notes: "Reduces padding slightly for tighter mobile or embedded shells without changing the hierarchy model." },
      ])}

      {renderReferenceNotesCard(
        "Sidebar should stay a reusable nested tree primitive while routing, search, and workflow-specific badges remain app-owned.",
        [
          "The stable anatomy is top-level rows, nested disclosure groups, active leaves, and an optional off-canvas mobile shell.",
          "Desktop and mobile should share the same tree language even when the shell treatment changes.",
          "Search, routing, workflow badges, and page chrome still belong to the app layer around the shared tree.",
        ],
        [
          "The stable API should be driven by generic items, active leaf state, and open branch keys rather than product-specific route names.",
          "Use one shared tree contract and keep shell-specific concerns like search or workspace switchers outside the primitive.",
          "Prefer composition with `Sheet` on mobile rather than adding a second navigation-only overlay primitive.",
        ],
        [
          "Every branch and leaf needs clear labels and visible active state without relying on shell context alone.",
          "Disclosure state should remain keyboard-friendly and predictable when nested groups are used.",
          "Do not assume hover-only affordances or icon-only meaning for primary navigation rows.",
        ],
      )}

      {renderUsageReviewCard(
        "Sidebar fits durable left-rail navigation where users need a stable tree of sections, groups, and deeper leaves.",
        [
          "The product needs a left navigation tree with nested disclosure and clearly visible active state.",
          "Mobile still needs access to the same hierarchy through a temporary left shell rather than a permanent rail.",
        ],
        [
          "Keep the tree generic and compositional even if the surrounding shell remains app-owned.",
          "Reuse the same item language on desktop and mobile so the hierarchy stays familiar.",
          "Validate deeper branches and `More` groupings before adding product-only rows and workflow controls.",
        ],
        [
          "Do not promote a whole application sidebar shell with search, tenants, notifications, and workspace switching as one primitive.",
          "Do not hard-code route labels or page-specific action areas into the shared component.",
          "Do not assume the same shell chrome belongs in desktop and mobile once the nav tree itself is stable.",
        ],
      )}

      {renderDoNotUseForCard(
        "Sidebar should stay a generic tree primitive instead of becoming a whole app shell.",
        [
          "Product-wide app shells that bundle navigation, search, tenant switching, and notifications into one unbreakable component.",
          "Workflow-specific control clusters that belong to page toolbars or local route chrome.",
          "Any API that requires product route names, tenancy language, or screen-owned orchestration logic.",
        ],
      )}
    </div>
  );
}

export function renderMenuDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Action groups</CardTitle>
          <CardDescription>Menu should support grouped actions, shortcuts, and destructive items without extra screen logic.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <Menu>
              <MenuTrigger>
                <Button variant="outline">Open actions</Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Tenant actions</MenuLabel>
                <MenuItem shortcut="⌘D">Duplicate</MenuItem>
                <MenuItem shortcut="⌘P">Pin for review</MenuItem>
                <MenuSeparator />
                <MenuItem shortcut="⌘⌫" tone="danger">
                  Remove
                </MenuItem>
              </MenuContent>
            </Menu>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placement</CardTitle>
          <CardDescription>Anchored placement must stay predictable regardless of trigger position.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="End align">
            <Menu align="end">
              <MenuTrigger>
                <Button variant="secondary">End aligned</Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem>Open detail</MenuItem>
                <MenuItem>Export row</MenuItem>
              </MenuContent>
            </Menu>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the anchored action-list API that stable menu surfaces may rely on.", [
        { name: "open / defaultOpen", type: "boolean", notes: "Support controlled or uncontrolled visibility without changing the composed menu structure." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Single visibility callback used for trigger toggling, outside click, and escape dismissal." },
        { name: "side / align / sideOffset", type: "Overlay positioning props", notes: "Control anchored placement while preserving the same menu item contract." },
        { name: "MenuTrigger / MenuContent", type: "composition", notes: "Keep trigger and content explicit so actions remain attached to a local anchor." },
        { name: "MenuLabel / MenuItem / MenuSeparator", type: "composition", notes: "Build grouped action lists without introducing app-owned menu wrappers." },
      ])}

      {renderReferenceNotesCard(
        "Menu should document the shared anchored action-list contract before any screen-specific row menus or bulk-action wrappers are layered on top.",
        [
          "The stable anatomy is trigger, anchored content surface, grouped items, separators, and optional section label.",
          "Menu items stay compact and action-oriented rather than becoming mini cards or forms.",
          "Alignment belongs to the shared contract so the same primitive can attach to row actions, toolbars, and small action clusters.",
        ],
        [
          "`align` and composed `MenuTrigger`, `MenuContent`, `MenuLabel`, `MenuItem`, and `MenuSeparator` make up the current stable API surface.",
          "Keep destructive treatment at the item level instead of inventing a separate destructive menu shell.",
          "Use the composed item model for shortcuts and grouped actions instead of screen-owned markup.",
        ],
        [
          "Menu triggers need an accessible name that explains what action group will open.",
          "Keyboard navigation and focus movement should remain predictable across grouped items and separators.",
          "Do not hide important action meaning only in tone or shortcut glyphs.",
        ],
      )}

      {renderUsageReviewCard(
        "Menu should stay a focused action list with clear grouping, not a hidden workflow surface.",
        [
          "The trigger needs a short anchored list of related actions for the current object or selection.",
          "Shortcuts, destructive items, or compact bulk actions need a shared list contract.",
        ],
        [
          "Group related items and separate destructive actions visibly.",
          "Keep item labels direct enough to scan in one pass.",
          "Anchor the menu close to the trigger and keep the list compact.",
        ],
        [
          "Do not hide multi-step forms or dense configuration inside menu content.",
          "Do not use menu when actions need long descriptions or comparison-heavy context.",
          "Do not overload a row-level menu with actions that belong in a page toolbar.",
        ],
      )}

      {renderDoNotUseForCard(
        "Menu should not become the place where whole workflows, dense review, or hidden page logic accumulate.",
        [
          "Multi-step input, filters, or settings that need validation, explanation, or durable editing context.",
          "Dense decision sets that require comparison, preview, or table-like scanning before the user can choose.",
          "Primary page-level commands that should stay visible in a toolbar, action rail, or persistent layout surface.",
        ],
      )}
    </div>
  );
}

export function renderContextMenuDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Pointer-triggered actions</CardTitle>
          <CardDescription>Context menu should open from the pointer location and stay reserved for contextual actions on an existing surface.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Right click" stacked>
            <ContextMenu>
              <ContextMenuTrigger>
                <div className="ui-lab-page__context-target" role="button" tabIndex={0}>
                  <strong>Workspace row preview</strong>
                  <span className="ui-lab-page__muted">Right click or press Shift+F10 / Context Menu key to open actions.</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Row actions</ContextMenuLabel>
                <ContextMenuItem>Open detail</ContextMenuItem>
                <ContextMenuItem>Edit metadata</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem shortcut="R" tone="danger">
                  Remove from review
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contextual fit</CardTitle>
          <CardDescription>Use context menu when the surface already exists and the user needs local object actions, not a visible toolbar replacement.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Dense target" stacked>
            <ContextMenu>
              <ContextMenuTrigger>
                <div className="ui-lab-page__context-target ui-lab-page__context-target--compact" role="button" tabIndex={0}>
                  <TableMetaCell description="enterprise · 12m ago · 2 active signals" title="aurora" />
                  <Badge appearance="soft" variant="warning">
                    Review
                  </Badge>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Quick actions</ContextMenuLabel>
                <ContextMenuItem>Inspect signals</ContextMenuItem>
                <ContextMenuItem>Copy tenant slug</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem shortcut="E">Export row</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared pointer-anchored contextual action menu.", [
        { name: "open / defaultOpen", type: "boolean", notes: "Supports controlled or uncontrolled visibility when a surface needs to observe context-menu state." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Single visibility callback for right-click, keyboard open, outside click, and escape dismissal." },
        { name: "ContextMenuTrigger / ContextMenuContent", type: "composition", notes: "Keeps the trigger surface and contextual menu body explicit and product-owned." },
        { name: "ContextMenuLabel / ContextMenuItem / ContextMenuSeparator", type: "composition", notes: "Build grouped contextual actions without coupling the primitive to one table or card runtime." },
        { name: "shortcut / tone", type: "item props", notes: "Support compact keyboard hints and destructive emphasis without creating workflow-specific variants." },
      ])}

      {renderReferenceNotesCard(
        "Context menu should stay a contextual action-list primitive, not a substitute for visible primary actions or a hidden settings panel.",
        [
          "The stable anatomy is trigger surface, pointer-positioned menu content, grouped items, separators, and optional section label.",
          "Keyboard invocation remains part of the base contract so the primitive is not pointer-only.",
          "Visual item language should stay aligned with menu so only the trigger semantics differ.",
        ],
        [
          "Use context menu when actions belong to an existing object surface such as a row, card, or preview tile.",
          "Keep actions short and local to the target object instead of burying larger workflows in a right-click list.",
          "Preserve the same item rhythm and destructive treatment as the normal shared menu layer.",
        ],
        [
          "Do not make context menu the only way to reach important primary actions.",
          "Do not hide dense configuration, forms, or comparison-heavy content in a context menu.",
          "Ensure the trigger surface remains keyboard reachable and understandable without a pointer.",
        ],
      )}

      {renderUsageReviewCard(
        "Context menu works best for secondary, target-local actions where right-click or keyboard invocation is already a familiar interaction.",
        [
          "A row, tile, or preview surface needs a small set of contextual actions.",
          "Visible toolbar space is limited and the actions are genuinely secondary to the main surface.",
        ],
        [
          "Keep the action set short and object-specific.",
          "Offer keyboard access and preserve a readable trigger target.",
          "Use the same item wording and destructive treatment as the shared menu contract.",
        ],
        [
          "Do not force users to rely on right-click for critical workflows.",
          "Do not duplicate large toolbars or admin rails inside the context menu.",
          "Do not couple the primitive to table-specific row models or vendor grid APIs.",
        ],
      )}

      {renderDoNotUseForCard(
        "Context menu should not become the default place for core workflows just because the action list fits visually.",
        [
          "Primary actions that must stay obvious and visible in the surface without discovery friction.",
          "Complex edits, multi-step flows, or anything that requires validation and persistent context.",
          "App-specific grid orchestration where the menu would become a hidden control panel rather than a small contextual list.",
        ],
      )}
    </div>
  );
}

export function renderHoverCardDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Profile preview</CardTitle>
          <CardDescription>Hover card should support richer preview content than tooltip while staying lighter than popover or dialog.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Preview" stacked>
            <HoverCard>
              <HoverCardTrigger>
                <Button variant="outline">Hover or focus preview</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="ui-lab-page__hover-card-stack">
                  <div className="ui-lab-page__hover-card-header">
                    <Avatar size="md">
                      <AvatarFallback tone="brand">AK</AvatarFallback>
                    </Avatar>
                    <div className="ui-lab-page__hover-card-copy">
                      <strong>Aurora Kent</strong>
                      <span className="ui-lab-page__muted">Platform Operations</span>
                    </div>
                  </div>
                  <p className="ui-lab-page__muted">
                    Owns rollout review, tenant activation checks, and escalation routing across shared admin surfaces.
                  </p>
                  <div className="ui-lab-page__inline-wrap">
                    <Badge appearance="soft" variant="brand">Owner</Badge>
                    <Badge appearance="soft" variant="success">Available</Badge>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placement</CardTitle>
          <CardDescription>Anchored placement should stay predictable for richer contextual cards attached to dense triggers.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Top end">
            <HoverCard align="end" side="top">
              <HoverCardTrigger>
                <Button variant="secondary">Top end</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="ui-lab-page__hover-card-stack">
                  <strong>Workspace summary</strong>
                  <p className="ui-lab-page__muted">Use hover card when the trigger needs a compact rich summary, not a menu or action list.</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the richer hover-or-focus preview overlay that sits between tooltip and popover.", [
        { name: "open / defaultOpen", type: "boolean", notes: "Support controlled or uncontrolled visibility for richer hover previews." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Exposes visibility changes without turning the primitive into a workflow surface." },
        { name: "openDelay / closeDelay", type: "number", notes: "Control preview timing so richer cards open and close more calmly than tooltips." },
        { name: "side / align / sideOffset", type: "overlay positioning props", notes: "Keep the preview anchored predictably relative to its trigger." },
        { name: "HoverCardTrigger / HoverCardContent", type: "composition", notes: "Trigger and richer preview body stay explicit and compositional." },
      ])}

      {renderReferenceNotesCard(
        "Hover card should stay a rich preview overlay for contextual identity and summary content, not a hidden workflow surface.",
        [
          "The stable anatomy is trigger plus an anchored richer preview card with more room than a tooltip.",
          "Hover card stays content-oriented, unlike menu, and lighter than a popover used for active settings or actions.",
          "The preview body should remain compact enough that the trigger relationship is still obvious.",
        ],
        [
          "Use hover card when the user benefits from richer context on hover or focus without committing to a click-driven surface.",
          "Keep content summary-oriented and compositional rather than interactive and form-heavy.",
          "Use delays to keep the preview calm and avoid tooltip-like flicker on dense surfaces.",
        ],
        [
          "The trigger still needs a clear accessible name and must make sense without relying on the preview alone.",
          "Do not hide essential instructions or required actions in a hover-only surface.",
          "Focus-triggered behavior should remain predictable for keyboard users, not only for pointer users.",
        ],
      )}

      {renderUsageReviewCard(
        "Hover card works best for richer contextual previews such as identity, summary, or metadata attached to one trigger.",
        [
          "A trigger needs more contextual information than tooltip can carry, but not enough action structure for popover or menu.",
          "The content should appear on hover or focus and disappear cleanly without becoming a blocking interaction.",
        ],
        [
          "Keep the content summary-oriented and compact.",
          "Use hover card for previews and supporting context, not for primary interaction.",
          "Prefer hover card when richer identity or metadata helps scanning around a trigger.",
        ],
        [
          "Do not put forms, menus, or multi-step actions into a hover card.",
          "Do not use hover card as the only place users can discover essential information.",
          "Do not let preview content grow until it behaves like a disguised popover or sheet.",
        ],
      )}

      {renderDoNotUseForCard(
        "Hover card should not absorb interaction-heavy or required content just because it can show more than tooltip.",
        [
          "Action menus, settings forms, or any interaction flow that should stay open and deliberate like a popover or dialog.",
          "Required instructions, validation, or important status that users must reliably access on touch and keyboard contexts.",
          "Large descriptive panels that detach from the trigger and behave more like a side sheet or mini page.",
        ],
      )}
    </div>
  );
}

export function renderPopoverDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Contextual content</CardTitle>
          <CardDescription>Popover should stay compact and informative, not turn into a hidden settings surface.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <Popover>
              <PopoverTrigger>
                <Button variant="outline">Preview popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="ui-lab-page__stack">
                  <strong>Plan summary</strong>
                  <p className="ui-lab-page__muted">
                    Enterprise plan with 3 active regions and 24 provisioned users.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placement</CardTitle>
          <CardDescription>Side and align variations must remain predictable for tight toolbars and detail surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Top / end">
            <Popover align="end" side="top">
              <PopoverTrigger>
                <Button variant="secondary">Top end</Button>
              </PopoverTrigger>
              <PopoverContent>
                <p className="ui-lab-page__muted">Compact contextual preview with alternative placement.</p>
              </PopoverContent>
            </Popover>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the anchored contextual-detail API used by the shared popover primitive.", [
        { name: "open / defaultOpen", type: "boolean", notes: "Allow controlled or uncontrolled visibility for lightweight contextual overlays." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Handles trigger toggling plus outside-click and escape dismissal." },
        { name: "side / align / sideOffset", type: "Overlay positioning props", notes: "Control where contextual content appears relative to its trigger." },
        { name: "PopoverTrigger / PopoverContent", type: "composition", notes: "Keep trigger and contextual body explicit instead of hiding anchor semantics in props." },
        { name: "children", type: "ReactNode", notes: "Popover content stays compositional so short summaries or contextual notes can be inserted directly." },
      ])}

      {renderReferenceNotesCard(
        "Popover should document a lightweight anchored content contract for short contextual detail, not a general-purpose container.",
        [
          "The stable anatomy is trigger, anchored content surface, and short contextual body content.",
          "Placement and alignment belong to the shared primitive so the same popover contract can be reused across dense surfaces.",
          "Popover content should remain compact enough that the trigger relationship stays visually obvious.",
        ],
        [
          "`side`, `align`, `PopoverTrigger`, and `PopoverContent` define the current stable shared API surface.",
          "Use composed content blocks inside the popover rather than adding screen-specific wrapper props.",
          "Keep the primitive focused on anchored context, not on workflow progression or large configuration sets.",
        ],
        [
          "The trigger needs an accessible name that still makes sense once the popover appears.",
          "Reading order should remain clear when the content opens near, not inside, the trigger's original layout.",
          "Do not hide essential content in a popover if the user may never hover or discover the trigger affordance.",
        ],
      )}

      {renderUsageReviewCard(
        "Popover is best for small contextual detail that stays close to its trigger and disappears cleanly.",
        [
          "A control needs a short read-only preview, explainer, or contextual summary.",
          "Supplemental detail should appear near the source without taking over the page.",
        ],
        [
          "Keep the body compact and directly tied to the trigger context.",
          "Use stable placement so the popover reads as anchored, not floating arbitrarily.",
          "Favor concise summaries over expanded settings panels.",
        ],
        [
          "Do not turn popover into a hidden configuration page or long form.",
          "Do not rely on popover for primary navigation or blocking decisions.",
          "Do not stack multiple popovers where a dialog or sheet would be clearer.",
        ],
      )}

      {renderDoNotUseForCard(
        "Popover should stay out of blocking, long-form, or navigation-heavy use cases.",
        [
          "Blocking confirmations, destructive decisions, or anything that should intentionally trap focus like a dialog.",
          "Long forms, stacked sections, or configuration panels that exceed quick contextual scanning.",
          "Navigation drawers, persistent inspectors, or disclosure regions users need to keep open while they work elsewhere.",
        ],
      )}
    </div>
  );
}

export function renderTooltipDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Hint layer</CardTitle>
          <CardDescription>Tooltip should stay terse and non-blocking, with clear placement for small hints.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Sides">
            <Tooltip side="top">
              <TooltipTrigger>
                <Button variant="ghost">Top</Button>
              </TooltipTrigger>
              <TooltipContent>Top hint</TooltipContent>
            </Tooltip>
            <Tooltip side="right">
              <TooltipTrigger>
                <Button variant="ghost">Right</Button>
              </TooltipTrigger>
              <TooltipContent>Right hint</TooltipContent>
            </Tooltip>
            <Tooltip side="bottom">
              <TooltipTrigger>
                <Button variant="ghost">Bottom</Button>
              </TooltipTrigger>
              <TooltipContent>Bottom hint</TooltipContent>
            </Tooltip>
            <Tooltip side="left">
              <TooltipTrigger>
                <Button variant="ghost">Left</Button>
              </TooltipTrigger>
              <TooltipContent>Left hint</TooltipContent>
            </Tooltip>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behavior</CardTitle>
          <CardDescription>Delay and disabled behavior should be visible in docs without introducing screen-specific copy.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Delayed">
            <Tooltip delay={180}>
              <TooltipTrigger>
                <Button variant="outline">Delayed hint</Button>
              </TooltipTrigger>
              <TooltipContent>Opens after a longer delay.</TooltipContent>
            </Tooltip>
          </ShowcaseRow>
          <ShowcaseRow label="Disabled">
            <Tooltip disabled>
              <TooltipTrigger>
                <Button variant="secondary">No tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>This should not render while disabled.</TooltipContent>
            </Tooltip>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared hint-layer API used by tooltip across dense controls and icon actions.", [
        { name: "open / defaultOpen", type: "boolean", notes: "Allow explicit control when needed, while still supporting delayed uncontrolled hints." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Exposes visibility changes for cases that need external coordination." },
        { name: "side / align / sideOffset", type: "Overlay positioning props", notes: "Keep hint placement consistent relative to the trigger." },
        { name: "delay / closeDelay / disabled", type: "timing + behavior props", notes: "Control hint timing and suppression without changing the trigger contract." },
        { name: "TooltipTrigger / TooltipContent", type: "composition", notes: "Keep trigger semantics explicit and tooltip text lightweight." },
      ])}

      {renderReferenceNotesCard(
        "Tooltip should document the smallest hint-layer contract in the shared overlay set, with minimal surface and no workflow semantics.",
        [
          "The stable anatomy is trigger plus short tooltip content rendered on a lightweight overlay surface.",
          "Placement and delay are part of the primitive because hint behavior needs consistency across dense controls.",
          "Tooltip remains purely supplemental and should not carry structural page content.",
        ],
        [
          "`side`, `delay`, `disabled`, `TooltipTrigger`, and `TooltipContent` form the current shared API surface.",
          "Keep tooltip content short and treat the trigger as the primary interface, not the overlay.",
          "Use disabled mode only to suppress the hint layer, not to explain broader product logic.",
        ],
        [
          "Tooltip must never be the sole source of essential instructions or validation meaning.",
          "Triggers still need a clear accessible name without relying on tooltip text to provide it.",
          "Do not assume hover-only discovery; keyboard and touch contexts should still retain understandable controls.",
        ],
      )}

      {renderUsageReviewCard(
        "Tooltip should remain a terse hint layer for dense controls, icons, and secondary clarification.",
        [
          "An icon-only control needs a short supplemental label or hint.",
          "Dense surfaces need quick clarification without adding visible copy everywhere.",
        ],
        [
          "Keep tooltip text short enough to read instantly.",
          "Use delayed behavior when immediate hover feedback would feel noisy.",
          "Treat tooltip copy as supplemental, not as the only source of meaning.",
        ],
        [
          "Do not put critical instructions or validation requirements only in a tooltip.",
          "Do not use tooltip for interactive content or multi-step actions.",
          "Do not repeat obvious visible labels that already explain the control.",
        ],
      )}

      {renderDoNotUseForCard(
        "Tooltip should not carry required meaning, interaction, or long-form explanation.",
        [
          "Required instructions, validation copy, or any content the user must read to complete the task successfully.",
          "Interactive controls, menus, links, or anything that needs focus movement and deliberate interaction inside the overlay.",
          "Paragraph-length explanation that belongs inline, in a popover, or in a larger review surface.",
        ],
      )}
    </div>
  );
}

export function renderSheetDocs(onSheetOpenChange: (open: boolean) => void) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>Sheet should open as a side surface, not as a disguised full-screen page.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Triggers">
            <Button onClick={() => onSheetOpenChange(true)}>Open sheet</Button>
            <Button onClick={() => onSheetOpenChange(true)} variant="outline">
              Secondary trigger
            </Button>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structure</CardTitle>
          <CardDescription>Header, body, footer, and wider content capacity distinguish sheet from dialog.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <div className="ui-lab-page__showcase-row">
            <div className="ui-lab-page__showcase-row-label">Contract</div>
            <div className="ui-lab-page__note-card ui-lab-page__structure-card">
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Header</span>
                <p className="ui-lab-page__structure-copy">Title, description, and close affordance.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Body</span>
                <p className="ui-lab-page__structure-copy">Form, detail view, or stepped content with more vertical room.</p>
              </div>
              <div className="ui-lab-page__structure-item">
                <span className="ui-lab-page__note-label">Footer</span>
                <p className="ui-lab-page__structure-copy">Optional action rail for review, save, or close.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the side-surface overlay API that shared sheet workflows should rely on.", [
        { name: "open", type: "boolean", notes: "Controls whether the sheet surface is mounted and visible." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Single visibility callback for trigger actions, close button, overlay click, and escape handling." },
        { name: "side", type: "\"left\" | \"right\"", notes: "Defines which edge the sheet enters from without changing the sheet contract itself." },
        { name: "closeOnOverlay / closeOnEscape", type: "boolean", notes: "Optional dismissal controls for overlay click and escape-key behavior." },
        { name: "SheetContent.showCloseButton", type: "boolean", notes: "Allows the shared close affordance to be hidden while preserving the same shell composition." },
      ])}

      {renderReferenceNotesCard(
        "Sheet should document the side-surface overlay contract as reusable composition for longer adjacent workflows.",
        [
          "The stable anatomy is trigger, side overlay surface, header, body, optional footer, and close affordance.",
          "Sheet keeps more vertical room than dialog while still reading as an adjacent overlay rather than a page replacement.",
          "Its internal content should stay compositional so forms or detail views can be inserted without changing the shell contract.",
        ],
        [
          "The stable API centers on open-state control plus composed trigger and content regions rather than workflow-specific props.",
          "Use the shared sheet shell for review, edit, or detail flows that need more space than dialog but less than a dedicated route.",
          "Keep action rails and form content inside the sheet body/footer composition rather than inventing one-off sheet variants.",
        ],
        [
          "Focus handling and close behavior need to stay predictable because sheet interrupts the current page context without replacing it.",
          "Header copy should clearly identify what changed when the side surface opened.",
          "Do not rely on layout position alone to communicate that the user is still inside the same page context.",
        ],
      )}

      {renderUsageReviewCard(
        "Sheet fits longer side-oriented review, edit, and detail flows that need more room than dialog without replacing the full page.",
        [
          "A task needs a persistent side surface for review, editing, or contextual detail.",
          "The flow benefits from more vertical space but should stay anchored to the current page context.",
        ],
        [
          "Use sheet for form-heavy or detail-heavy side work that remains adjacent to the page.",
          "Keep close and save actions predictable across the footer or surface edges.",
          "Treat sheet as a side workflow, not as a disguised full page.",
        ],
        [
          "Do not use sheet for a one-line confirmation better served by dialog.",
          "Do not overload sheet with unrelated navigation branches.",
          "Do not open sheet from vague triggers that make the side surface feel disconnected.",
        ],
      )}

      {renderDoNotUseForCard(
        "Sheet should not be the default answer for tiny confirmations or for replacing primary application structure.",
        [
          "One-click confirmations or tiny blocking interrupts that are clearer and lighter as a dialog.",
          "Primary app navigation, permanent sidebar structure, or any layout meant to stay persistently visible as chrome.",
          "Broad workflow branching where users need multiple parallel surfaces or a full route with durable context and navigation.",
        ],
      )}
    </div>
  );
}
