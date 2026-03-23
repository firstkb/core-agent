/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollectionEmptyState,
  CollectionLoadingState,
  EmptyState,
  ErrorState,
  GuidedEmptyState,
  LoadingState,
  ProgressBar,
  SearchEmptyState,
  Skeleton,
  SkeletonText,
  TableLoadingState,
  TopLoader,
  createTopLoaderController,
  type TopLoaderController,
} from "@platform/ui-kit";

import { CheckCircleIcon, InfoCircleIcon, WarningTriangleIcon } from "../components/icons";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../components/docs-cards";

function TopLoaderPreview() {
  const controllerRef = useRef<TopLoaderController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createTopLoaderController();
  }

  const controller = controllerRef.current;
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => () => controller.reset(), [controller]);

  function handleRestart() {
    controller.reset();
    controller.start();
  }

  return (
    <div className="ui-lab-page__stack">
      <TopLoader controller={controller} />
      <div className="ui-lab-page__inline-wrap">
        <Button onClick={() => controller.start()}>Start</Button>
        <Button onClick={() => controller.done()} variant="outline">Finish</Button>
        <Button onClick={handleRestart} variant="ghost">Restart</Button>
      </div>
      <p className="ui-lab-page__muted">
        Phase: {snapshot.phase} · Visual progress: {Math.round(snapshot.progress * 100)}%.
      </p>
      <p className="ui-lab-page__muted">
        The bar stays fixed to the top of the viewport so transport wrappers can reuse the same `start()` and `done()` calls around API work. In the raw controller, `reset()` still means an immediate hard stop.
      </p>
    </div>
  );
}

export function renderLoadingStatesDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Base and collection</CardTitle>
          <CardDescription>Loading patterns should communicate shape and density before real data arrives.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Base" stacked>
            <LoadingState
              description="Base loading state helps route and panel transitions when the final layout is still simple."
              title="Loading state"
            />
          </ShowcaseRow>
          <ShowcaseRow label="Collection" stacked>
            <CollectionLoadingState items={3} layout="grid" />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>List and table</CardTitle>
          <CardDescription>Richer data surfaces need loading placeholders that preserve the eventual reading rhythm.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="List" stacked>
            <CollectionLoadingState items={2} layout="list" />
          </ShowcaseRow>
          <ShowcaseRow label="Table" stacked>
            <TableLoadingState columns={5} rows={4} />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the reusable loading-state family used across routes, collections, and table surfaces.", [
        { name: "LoadingState.title / description", type: "ReactNode", notes: "Base loading state gives simple route or panel feedback when no richer placeholder grammar is required." },
        { name: "CollectionLoadingState.items", type: "number", notes: "Controls how many repeated loading placeholders are rendered for list or grid collections." },
        { name: "CollectionLoadingState.layout", type: "\"grid\" | \"list\"", notes: "Keeps repeated placeholders aligned with the eventual collection rhythm." },
        { name: "TableLoadingState.columns / rows", type: "number", notes: "Preserves table density and column expectations while data is pending." },
      ])}

      {renderReferenceNotesCard(
        "Loading-state approval now covers the base route-level state plus the reusable collection and table loading family.",
        [
          "The stable loading family is a simple base state plus collection and table-specific structured placeholders.",
          "Collection and table variants remain approved because they preserve layout rhythm without dragging in workflow-specific behavior.",
          "All loading variants should still read as temporary structure, not as new screen layouts.",
        ],
        [
          "Choose the lightest loading pattern that still preserves orientation for the user.",
          "Use collection and table placeholders where shape and density matter more than a generic loading message.",
          "Keep the family generic and compositional rather than turning loading surfaces into branded skeleton scenes.",
        ],
        [
          "Loading context should remain understandable even when placeholders are silent and non-interactive.",
          "Do not let shimmer or motion compete with the surrounding admin surface.",
          "Preserve structural order so users can anticipate where final content will appear.",
        ],
      )}

      {renderUsageReviewCard(
        "Loading states should preserve layout expectations so users can predict what will appear without waiting for a complete reflow.",
        [
          "A reusable route, collection, or table needs interim structure while data is still loading.",
          "The user benefits from seeing density and eventual layout shape before content arrives.",
        ],
        [
          "Use the simplest loading shape that still preserves the final reading rhythm.",
          "Keep collection and table placeholders structurally close to the eventual content layout.",
          "Prefer skeletons and shaped placeholders over generic spinners for richer surfaces.",
        ],
        [
          "Do not replace dense layouts with a single spinner if structure matters to orientation.",
          "Do not animate loading so heavily that it competes with the surrounding page.",
          "Do not introduce different placeholder grammars for similar surfaces without a reason.",
        ],
      )}
    </div>
  );
}

export function renderErrorStatesDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Error state should stay generic and reusable without app-specific incident terminology.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Base" stacked>
            <ErrorState
              description="Something prevented the current view from loading. Try again or review the upstream connection."
              title="Something went wrong"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recovery actions</CardTitle>
          <CardDescription>Actions should remain minimal and recovery-oriented, not turn the state into a workflow screen.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Actions" stacked>
            <ErrorState
              actions={
                <div className="ui-lab-page__inline-wrap">
                  <Button>Retry</Button>
                  <Button variant="outline">View details</Button>
                </div>
              }
              description="Use actions sparingly and only when the next step is genuinely reusable across contexts."
              title="Recoverable error"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the reusable error-state contract used across routes, panels, and technical data surfaces.", [
        { name: "title / description", type: "ReactNode", notes: "Core copy explains what failed and what the user can do next." },
        { name: "actions", type: "ReactNode", notes: "Optional recovery actions stay small and generic rather than becoming a troubleshooting workflow shell." },
        { name: "native section props", type: "HTMLAttributes<HTMLElement>", notes: "Allow local labeling and layout without growing a domain-specific API." },
      ])}

      {renderReferenceNotesCard(
        "Error-state approval now covers the generic reusable recovery surface, not domain-specific incident handling.",
        [
          "The stable anatomy is a title, short explanation, and optional small recovery-action area.",
          "The contract stays generic so panels, routes, and collections can reuse the same recovery grammar.",
          "Error state should remain lighter than alert-dialog, drawer, or app-owned incident screens.",
        ],
        [
          "Use shared error state when a technical or data-backed surface fails and the same recovery pattern can repeat elsewhere.",
          "Keep actions small and reusable such as retry, refresh, or view details.",
          "Move detailed troubleshooting, logs, and domain-specific incident flow into app code instead of the primitive.",
        ],
        [
          "The failure message should remain understandable without relying on color or destructive tone alone.",
          "Optional actions should be reachable and clearly named without overwhelming the message.",
          "Do not turn the primitive into a screen-level troubleshooting template with many competing controls.",
        ],
      )}

      {renderUsageReviewCard(
        "Error states should stay recovery-oriented and generic enough to reuse across routes, panels, and collection surfaces.",
        [
          "A view or panel failed to load and the user needs a concise explanation plus a recovery path.",
          "The same failure pattern can repeat across multiple technical or data-backed surfaces.",
        ],
        [
          "Keep the message focused on what failed and what the user can try next.",
          "Use recovery actions only when they are generic and genuinely repeatable.",
          "Reserve stronger terminology for app-owned incidents outside the shared state layer.",
        ],
        [
          "Do not turn a shared error state into a domain-specific troubleshooting screen.",
          "Do not overload the state with many competing actions.",
          "Do not rely on vague copy that hides whether retrying is a realistic next step.",
        ],
      )}
    </div>
  );
}

export function renderProgressDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Tones and completion</CardTitle>
          <CardDescription>Linear progress should stay readable across quiet status rows without becoming a dashboard-specific chart primitive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Tones" stacked>
            <div className="ui-lab-page__progress-stack">
              <div className="ui-lab-page__progress-row">
                <span className="ui-lab-page__progress-meta">Brand · 42%</span>
                <ProgressBar value={42} />
              </div>
              <div className="ui-lab-page__progress-row">
                <span className="ui-lab-page__progress-meta">Success · 84%</span>
                <ProgressBar tone="success" value={84} />
              </div>
              <div className="ui-lab-page__progress-row">
                <span className="ui-lab-page__progress-meta">Warning · 58%</span>
                <ProgressBar tone="warning" value={58} />
              </div>
              <div className="ui-lab-page__progress-row">
                <span className="ui-lab-page__progress-meta">Danger · 18%</span>
                <ProgressBar tone="danger" value={18} />
              </div>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status rows</CardTitle>
          <CardDescription>Progress should compose cleanly with supporting copy and not require a separate widget for every workflow.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Rows" stacked>
            <div className="ui-lab-page__progress-stack">
              <div className="ui-lab-page__progress-row">
                <div className="ui-lab-page__progress-copy">
                  <strong>Tenant onboarding rollout</strong>
                  <span className="ui-lab-page__muted">3 of 7 workspaces completed</span>
                </div>
                <ProgressBar tone="brand" value={43} />
              </div>
              <div className="ui-lab-page__progress-row">
                <div className="ui-lab-page__progress-copy">
                  <strong>Billing export job</strong>
                  <span className="ui-lab-page__muted">Awaiting final review and artifact sync</span>
                </div>
                <ProgressBar tone="neutral" value={67} />
              </div>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared linear progress API used by workflow completion and background task feedback.", [
        { name: "value", type: "number", notes: "Current measured progress value before normalization." },
        { name: "max", type: "number", notes: "Optional upper bound for progress normalization. Defaults to `100`." },
        { name: "tone", type: "\"brand\" | \"success\" | \"warning\" | \"danger\" | \"neutral\"", notes: "Controls semantic emphasis while preserving the same linear progress contract." },
        { name: "native div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Allows local layout and labeling without turning progress into a workflow widget." },
      ])}

      {renderReferenceNotesCard(
        "Progress should stay a calm linear feedback primitive, separate from charts, stats cards, and app-specific workflow wrappers.",
        [
          "The stable anatomy is track plus one filled indicator inside a bounded linear bar.",
          "Tone and normalized completion are the only core semantic levers in the current shared contract.",
          "Supporting labels and percentages belong outside the primitive so workflows can compose their own surrounding copy.",
        ],
        [
          "Use linear progress for completion, sync, upload, and rollout status where a direct left-to-right progression is clear.",
          "Keep progress bars generic and let surrounding content describe the task being measured.",
          "Treat radial and chart-like representations as separate future candidates until they are genuinely needed across surfaces.",
        ],
        [
          "Progress meaning should remain understandable through surrounding text, not color alone.",
          "Expose useful value context when the surrounding surface needs more than a visual bar.",
          "Do not hide important stalled or failed states behind a neutral-looking bar without clear copy.",
        ],
      )}

      {renderUsageReviewCard(
        "Progress fits linear completion and status feedback where users benefit from one direct measure of work done versus work remaining.",
        [
          "A background task, rollout, upload, or staged process has a clear completion value.",
          "The user needs quick completion feedback without opening a dedicated detail surface.",
        ],
        [
          "Pair the bar with concise task copy when the measured work is not obvious from the surrounding context.",
          "Keep the tone mapping consistent across comparable workflow states.",
          "Use the simplest linear bar before reaching for charts, rings, or custom dashboard widgets.",
        ],
        [
          "Do not use progress for qualitative states that are not truly measurable as completion.",
          "Do not overload the primitive with inline actions, labels, and multi-line metadata inside the bar itself.",
          "Do not treat dashboard-specific metrics cards as part of the base progress contract.",
        ],
      )}
    </div>
  );
}

export function renderTopLoaderDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Manual transport control</CardTitle>
          <CardDescription>Top loader should behave like a restrained NProgress-style transport indicator, not like a determinate workflow progress bar.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Interactive" stacked>
            <TopLoaderPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Separation from progress</CardTitle>
          <CardDescription>Global network activity and measured task completion should stay separate so transport feedback does not dilute real workflow progress.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Use top loader for transport" stacked>
            <p className="ui-lab-page__muted">
              Use top loader when a request, route refresh, or global transport action needs quick page-level feedback without reflowing local content.
            </p>
          </ShowcaseRow>
          <ShowcaseRow label="Use progress bar for measured work" stacked>
            <div className="ui-lab-page__progress-row">
              <div className="ui-lab-page__progress-copy">
                <strong>Artifact upload</strong>
                <span className="ui-lab-page__muted">Measured completion should still use a determinate progress bar.</span>
              </div>
              <ProgressBar tone="brand" value={61} />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the review-stage top loader contract used for app-level transport activity.", [
        { name: "controller", type: "TopLoaderController", notes: "Caller-owned controller exposes `start()`, `done()`, `reset()`, `set()`, and `inc()` so transport wrappers can drive the bar without local prop drilling. In the lab, replay uses `reset()` plus `start()`." },
        { name: "tone", type: "\"brand\" | \"success\" | \"warning\" | \"danger\" | \"neutral\"", notes: "Keeps the same slim viewport bar while allowing semantic emphasis if a product surface later proves the need." },
        { name: "insetBlockStart / zIndex", type: "CSS length / number", notes: "Lets app shells offset the bar below trusted chrome such as fixed headers without rewriting the component." },
      ])}

      {renderReferenceNotesCard(
        "Top loader is a review-stage viewport activity indicator for transport work, separate from determinate content progress.",
        [
          "The contract is one thin fixed bar at the top of the viewport plus a caller-owned controller.",
          "The controller owns the NProgress-like lifecycle: start, trickle, finish, and reset.",
          "Measured upload or rollout completion should stay on `ProgressBar`, not migrate into the viewport loader.",
        ],
        [
          "Instantiate one controller near the app shell and let transport wrappers call `start()` and `done()` around shared API work.",
          "Use the viewport loader for short-lived global activity that should not re-layout the current page.",
          "Keep the bar visually restrained so it reads as system transport feedback rather than branded decoration.",
        ],
        [
          "Do not use top loader as the only feedback for long operations that need precise percentages or surrounding explanation.",
          "Do not stack multiple competing top loaders in the same viewport.",
          "Do not let local widget fetches trigger the global bar if they are background or silent activity.",
        ],
      )}

      {renderUsageReviewCard(
        "Top loader fits app-level transport activity where users need quick reassurance that work is happening, but not a full local loading placeholder.",
        [
          "A route refresh, global refetch, or shared API wrapper needs one compact feedback surface at the page level.",
          "The work is real enough to acknowledge, but not rich enough to justify a modal, skeleton, or determinate progress block.",
        ],
        [
          "Keep one shared controller close to the shell and reuse it across transport calls.",
          "Delay or suppress the loader for silent background requests so the viewport signal stays meaningful.",
          "Pair it with richer local states when an individual panel still needs structural loading context.",
        ],
        [
          "Do not treat top loader as a substitute for empty, loading, or error states inside real content surfaces.",
          "Do not use it for exact completion semantics such as file upload percentages.",
          "Do not wire it directly to every micro-interaction without a threshold or silence policy.",
        ],
      )}
    </div>
  );
}


export function renderAlertDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Appearances and tones</CardTitle>
          <CardDescription>Alert should stay generic enough for status messaging without turning into a product-specific banner system.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Soft" stacked>
            <Alert tone="brand">
              <AlertIcon>
                <InfoCircleIcon />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>Review recommended</AlertTitle>
                <AlertDescription>Plan deltas were detected during the last tenant sync and should be reviewed before approval.</AlertDescription>
              </AlertBody>
            </Alert>
            <Alert tone="success">
              <AlertIcon>
                <CheckCircleIcon />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>Sync completed</AlertTitle>
                <AlertDescription>All seeded tenant records finished their latest reconciliation without blocking issues.</AlertDescription>
              </AlertBody>
            </Alert>
            <Alert tone="warning">
              <AlertIcon>
                <WarningTriangleIcon />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>Rollout paused</AlertTitle>
                <AlertDescription>Two trial tenants still require owner confirmation before production activation can continue.</AlertDescription>
              </AlertBody>
            </Alert>
          </ShowcaseRow>

          <ShowcaseRow label="Outline and solid" stacked>
            <Alert appearance="outline" tone="info">
              <AlertIcon>
                <InfoCircleIcon />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>External dependency notice</AlertTitle>
                <AlertDescription>Webhook delivery is delayed upstream, but no local data was lost.</AlertDescription>
              </AlertBody>
            </Alert>
            <Alert appearance="solid" tone="danger">
              <AlertIcon>
                <WarningTriangleIcon />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>Action blocked</AlertTitle>
                <AlertDescription>Provisioning is blocked until environment credentials are rotated.</AlertDescription>
              </AlertBody>
            </Alert>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions and density</CardTitle>
          <CardDescription>Actions should stay optional and minimal so alert remains a feedback surface, not a workflow shell.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="With actions" stacked>
            <Alert tone="neutral">
              <AlertBody>
                <AlertTitle>Maintenance window scheduled</AlertTitle>
                <AlertDescription>UI Lab uses the shared alert contract here to validate optional actions and compact body rhythm.</AlertDescription>
              </AlertBody>
              <AlertActions>
                <Button size="sm" variant="outline">Dismiss</Button>
                <Button size="sm">Review</Button>
              </AlertActions>
            </Alert>
          </ShowcaseRow>

          <ShowcaseRow label="Small" stacked>
            <Alert size="sm" tone="warning">
              <AlertIcon>
                <WarningTriangleIcon />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>Review queued</AlertTitle>
                <AlertDescription>Saved as draft until owner confirmation arrives.</AlertDescription>
              </AlertBody>
            </Alert>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared alert contract before any app-owned banner or toast layer is introduced.", [
        { name: "tone", type: "\"neutral\" | \"brand\" | \"success\" | \"warning\" | \"danger\" | \"info\"", notes: "Maps semantic intent to shared color tokens instead of screen-specific classes." },
        { name: "appearance", type: "\"soft\" | \"outline\" | \"solid\"", notes: "Controls emphasis while keeping the same title, description, and action structure." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts density for tighter inline notices or roomier page-level messaging." },
        { name: "AlertIcon / AlertBody / AlertActions", type: "composition", notes: "Keeps icon, copy, and optional actions explicit and reusable." },
      ])}

      {renderReferenceNotesCard(
        "Alert should remain a lightweight feedback surface, not a disguised page section or modal substitute.",
        [
          "The contract is a root alert container plus optional icon, body, title, description, and actions.",
          "Actions are optional and should stay low-frequency so the message remains the primary content.",
          "Tone and appearance come from shared tokens rather than app-owned banner styling.",
        ],
        [
          "`tone`, `appearance`, and `size` cover the stable visual surface.",
          "Body copy should compose through `AlertTitle` and `AlertDescription` instead of raw custom spacing.",
          "Use `AlertActions` only when a small reusable next step belongs with the message.",
        ],
        [
          "Only add `role=\"alert\"` when the message is time-sensitive enough to need immediate announcement.",
          "Keep titles concise and descriptions readable in sequence for assistive technology.",
          "Do not hide critical actions inside a color-only surface without readable text.",
        ],
      )}

      {renderUsageReviewCard(
        "Alert works best for concise status messaging that needs to stay in flow with the surrounding surface.",
        [
          "The page or panel needs a visible feedback message that is more persistent than a tooltip but lighter than a dialog.",
          "A small generic next step may belong with the message, such as retry, dismiss, or review.",
        ],
        [
          "Keep the copy short and explicit about what happened or what needs attention.",
          "Use tone and appearance to scale emphasis before inventing a separate banner component.",
          "Reserve inline actions for one or two reusable follow-up steps.",
        ],
        [
          "Do not turn alert into a full workflow container with filters, forms, or rich comparison content.",
          "Do not use alert as a substitute for blocking confirmation or multi-step recovery.",
          "Do not stack many competing alerts in the same region without a clear priority order.",
        ],
      )}
    </div>
  );
}

export function renderSkeletonDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Skeleton should stay shape-driven and quiet, so loading surfaces feel like placeholders rather than temporary layout changes.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Block">
            <Skeleton height="4.5rem" width="14rem" />
            <Skeleton height="4.5rem" width="10rem" />
          </ShowcaseRow>
          <ShowcaseRow label="Circle">
            <Skeleton height="3rem" variant="circle" width="3rem" />
            <Skeleton height="4rem" variant="circle" width="4rem" />
          </ShowcaseRow>
          <ShowcaseRow label="Text" stacked>
            <SkeletonText lines={4} widths={["14rem", "18rem", "12rem", "9rem"]} />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grouped placeholders</CardTitle>
          <CardDescription>Grouped skeleton usage should mimic layout rhythm without introducing a special-purpose loading card component.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Identity row" stacked>
            <div className="ui-lab-page__inline-wrap">
              <Skeleton height="3rem" variant="circle" width="3rem" />
              <SkeletonText lines={2} widths={["9rem", "12rem"]} />
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Card body" stacked>
            <div className="ui-lab-page__stack">
              <Skeleton height="1rem" width="8rem" />
              <SkeletonText lines={3} widths={["16rem", "20rem", "11rem"]} />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared loading-placeholder API used across cards, lists, and detail surfaces.", [
        { name: "variant", type: "\"block\" | \"text\" | \"circle\"", notes: "Switches placeholder shape without changing the base skeleton contract." },
        { name: "width / height", type: "CSSProperties sizing values", notes: "Let each placeholder match the intended layout footprint explicitly." },
        { name: "SkeletonText.lines", type: "number", notes: "Defines the number of generated text lines for grouped content placeholders." },
        { name: "SkeletonText.widths", type: "Array<CSSProperties[\"width\"]>", notes: "Optional per-line widths to make grouped loading text feel more natural." },
      ])}

      {renderReferenceNotesCard(
        "Skeleton should document the shared placeholder anatomy as small composable shapes, not as a screen-specific loading layout.",
        [
          "The stable anatomy is a base skeleton block plus text-line grouping through `SkeletonText`.",
          "Shape is controlled through `variant`, while size comes from explicit width and height values.",
          "Grouped placeholders should mimic layout rhythm without committing to one product screen structure.",
        ],
        [
          "`variant`, `width`, and `height` define the base primitive, while `SkeletonText` adds grouped text-line behavior.",
          "Compose multiple skeleton shapes to mirror cards, rows, or identity clusters instead of inventing fixed loading shells.",
          "Keep the shared primitive quiet and neutral so it can sit inside many different surfaces.",
        ],
        [
          "Skeleton must not become the only source of meaning; loading regions still need surrounding context and labels.",
          "Avoid flashing or highly animated placeholder behavior that would distract operators in dense admin screens.",
          "Keep placeholder order close to the final content structure so assistive and visual expectations stay aligned.",
        ],
      )}

      {renderUsageReviewCard(
        "Skeleton is appropriate when the final layout is already known and a temporary placeholder should preserve spatial rhythm while data loads.",
        [
          "The surface knows its eventual content structure but data is still pending.",
          "Operators benefit from seeing where content will land instead of a blank panel or spinner-only state.",
        ],
        [
          "Match placeholder shape and size to the final layout as closely as practical.",
          "Use grouped text lines or circles to hint at identity and content hierarchy without over-designing the loading state.",
          "Keep placeholder styling subdued so it supports, rather than dominates, the surface.",
        ],
        [
          "Do not use skeleton when the content structure itself is still unknown or highly variable.",
          "Do not replace every loading state with skeleton if a simpler loading message communicates better.",
          "Do not create fixed product-specific loading cards when shared skeleton composition is enough.",
        ],
      )}
    </div>
  );
}
