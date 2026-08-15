---
work_item: 004-ui-core-foundation
sequence: 004
slug: ui-core-foundation
---

# SPDD Analysis: UI Core Foundation

## Original Business Requirement

# Feature Specification: UI Core Foundation

**Feature Branch**: `004-ui-core-foundation`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "i want to create UI components under packages/ui/
as core UI for Reusable"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Shared primitives for everyday screens (Priority: P1)

A contributor building a member-facing or staff-facing screen uses a shared set
of core interface pieces — buttons, text fields, labels, cards, badges, tabs,
and dialogs — so the same action looks and behaves the same in both products.

**Why this priority**: Without a shared core, each app will invent its own
buttons, fields, and dialogs. That breaks the product-family look and doubles
maintenance. Everyday screens cannot ship consistently until this set exists.

**Independent Test**: Build a simple screen that uses only the core set (button,
field, card, badge, tabs, dialog) and confirm it is usable in both the member
app and the staff app without copying those pieces into either app.

**Acceptance Scenarios**:

1. **Given** a contributor needs a primary action, text input, and confirmation
   dialog on a screen, **When** they assemble the screen from the shared core,
   **Then** they do not create a one-off button, field, or dialog in the app.
2. **Given** the same core pieces appear in the member app and the staff app,
   **When** a person uses them, **Then** labels, spacing, and interaction
   (press, focus, disabled) match across both products.
3. **Given** a core piece is updated in the shared library, **When** both apps
   are next opened, **Then** both show the updated appearance and behavior
   without a separate copy of that piece in either app.

---

### User Story 2 - Forms, feedback, and waiting states stay consistent (Priority: P1)

A person filling in a form, waiting for content, or seeing a short confirmation
gets the same field layout, loading placeholder, and brief message pattern in
either product.

**Why this priority**: The constitution requires consistent error, loading,
empty, and form-validation messaging across apps. Those patterns are as
user-facing as buttons; shipping primitives without them would still produce
inconsistent products.

**Independent Test**: Complete a short form that shows a required-field message,
a loading placeholder, and a brief success or error message using only shared
pieces; repeat the same flow in the other app and confirm the patterns match.

**Acceptance Scenarios**:

1. **Given** a form with a required field left empty, **When** the person tries
   to continue, **Then** the field-level message uses the shared field pattern
   (not a custom message layout invented in the app).
2. **Given** content is still loading, **When** the screen is shown, **Then**
   the waiting state uses the shared placeholder pattern rather than a unique
   spinner or blank region per app.
3. **Given** an action succeeds or fails, **When** the product needs a brief
   non-blocking notice, **Then** it uses the shared notice pattern.

---

### User Story 3 - Domain screens compose primitives; they are not stored in the shared library (Priority: P1)

A contributor building an instrument card, recommendation result, or
consultation step composes those screens in the product that owns them, using
the shared core underneath. The shared library itself contains no Windwise
business concepts.

**Why this priority**: If domain screens live in the shared library, both apps
inherit product-specific UI they may not need, and the library stops being a
stable core. This boundary is what makes "reusable core UI" different from "all
UI in one package."

**Independent Test**: Review the shared library inventory: every piece is a
generic interface building block (for example button, card, dialog). No piece is
named or described in terms of instruments, recommendations, consultations,
providers, or other Windwise domain ideas.

**Acceptance Scenarios**:

1. **Given** a contributor needs an instrument or recommendation card, **When**
   they look in the shared library, **Then** they do not find a domain-named
   component; they compose a card (and related core pieces) in the owning app.
2. **Given** a new reusable pattern appears in one app (for example a repeated
   empty-state layout), **When** it is generic and needed by both products,
   **Then** it is promoted into the shared library as a domain-free primitive
   rather than copied.
3. **Given** a piece in the shared library, **When** its name and purpose are
   read, **Then** they make sense without knowing Windwise's catalog or
   recommendation rules.

---

### User Story 4 - Keyboard, contrast, and structure work for everyone (Priority: P2)

A person using a keyboard, a screen reader, or a high-contrast preference can
operate the core pieces: focus order is visible, controls have accessible names,
and text/background contrast meets the product's accessibility baseline.

**Why this priority**: Accessibility is required for any new or changed UI. It
is P2 only relative to establishing the primitive set itself; it is not optional
for release of those primitives.

**Independent Test**: Tab through a screen built only from core pieces; every
interactive control is reachable, shows focus, and can be activated from the
keyboard. Confirm each control has an accessible name and that default
text/background pairs meet the contrast baseline.

**Acceptance Scenarios**:

1. **Given** a screen built from core pieces, **When** a person uses only the
   keyboard, **Then** they can reach and operate every button, field, tab,
   dialog, and menu in a sensible order.
2. **Given** a dialog is open, **When** the person presses the standard dismiss
   control or equivalent keyboard action, **Then** the dialog closes and focus
   returns to a sensible place.
3. **Given** default appearance settings, **When** body text and primary
   controls are shown, **Then** contrast is sufficient to read and identify
   actions without relying on color alone for meaning (for example error vs
   success).

---

### Edge Cases

- What happens when a contributor needs a control that is not in the core set?
  They build it in the owning app first. If it is generic and needed by both
  products, it is promoted into the shared library; it is not duplicated.
- How does the system handle a domain-named piece accidentally added to the
  shared library? It is out of scope for the shared inventory and must be moved
  to the owning app (or rewritten as a domain-free primitive) before it is
  treated as core UI.
- What happens when an app applies local visual tweaks to a core piece? Small
  layout spacing around a piece is allowed. Changing the piece's own appearance
  or interaction in the app (a one-off "special button") is not; that change
  belongs in the shared library or is justified as a documented exception.
- How does the system handle missing labels on fields or icon-only buttons?
  Those uses are invalid for core pieces; every field and every icon-only action
  must have an accessible name (visible label or equivalent).
- What happens when both a brief notice and a blocking dialog could communicate
  the same outcome? Destructive or irreversible confirmations use a dialog;
  short status uses a non-blocking notice. Apps must not invent a third pattern
  for the same job.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The workspace MUST provide one shared core UI library that both
  the member-facing product and the staff-facing product consume for everyday
  interface pieces.
- **FR-002**: The core set MUST include, at minimum: button, text input,
  textarea, select, field (label + control + message), card, badge, tabs, and
  dialog.
- **FR-003**: The core set MUST also include shared patterns for: form field
  messages, loading placeholders, visual separators, and brief non-blocking
  notices.
- **FR-004**: Both products MUST be able to present the same core piece with
  matching default appearance and interaction (including disabled and focused
  states).
- **FR-005**: The shared library MUST NOT contain components whose names or
  behavior encode Windwise domain concepts (instruments, recommendations,
  consultations, providers, pricing tables, or equivalent).
- **FR-006**: Apps MUST NOT copy core pieces into the app in order to restyle or
  fork them; reuse happens through the shared library.
- **FR-007**: Contributors MUST be able to identify the approved core inventory
  (what is in, what is out) without guessing.
- **FR-008**: Every interactive core piece MUST be operable with a keyboard and
  MUST expose an accessible name.
- **FR-009**: Default text and primary-action contrast MUST meet the product's
  accessibility baseline; status MUST NOT rely on color alone.
- **FR-010**: A documented appearance mode (at least a default light appearance
  and a dark appearance) MUST apply consistently to core pieces in both
  products.
- **FR-011**: Shared visual baseline (type, color, spacing, radius) MUST come
  from the core library; apps MUST NOT ship a second, conflicting baseline for
  the same tokens.
- **FR-012**: Adding a new generic primitive to the core library MUST be
  possible without also adding it to each app as a duplicate.
- **FR-013**: Overlay pieces (dialog and equivalent) MUST trap focus while open
  and restore a sensible focus target when closed.
- **FR-014**: Core pieces used in forms MUST support a visible label, helper
  text, and an error message in a consistent layout.

### Key Entities

- **Core primitive**: A reusable, domain-free interface building block (for
  example button, field, dialog) with defined appearance, interaction, and
  accessibility expectations.
- **Shared visual baseline**: The common type, color, spacing, and radius
  decisions that all core primitives and both products use by default.
- **Product screen**: A member- or staff-facing view that _composes_ core
  primitives and may add domain-specific layout or copy. Domain screens are not
  themselves core primitives.
- **Appearance mode**: A named set of baseline colors (at least default and
  dark) applied across core primitives.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A contributor can assemble a standard form-plus-confirm screen
  (fields, primary action, dialog) for either product using only shared core
  pieces, with no new one-off control invented in the app, in a single sitting
  (under 30 minutes for someone already familiar with the workspace).
- **SC-002**: 100% of screens that use a button, field, card, badge, tabs, or
  dialog in either product use the shared core for those roles rather than an
  app-local substitute.
- **SC-003**: Side-by-side review of the same core pieces in both products shows
  matching default appearance and interaction for at least the P1 set (button,
  field, card, badge, tabs, dialog).
- **SC-004**: An inventory check of the shared library finds zero domain-named
  components (no instrument, recommendation, consultation, or provider-specific
  pieces).
- **SC-005**: Keyboard-only walkthrough of a screen built from core pieces
  completes all interactive actions (activate, type, open/close dialog, switch
  tabs) without a pointer, on the first attempt by a reviewer following a
  written script.
- **SC-006**: Default body text and primary-action contrast pass the product's
  stated contrast baseline in both appearance modes.
- **SC-007**: When a core primitive's default appearance changes in the shared
  library, both products reflect that change on next load without a second edit
  in either app.

## Assumptions

- The member-facing product and the staff-facing product are the only consumers
  of this core library for this work item. Additional apps are out of scope.
- "Core" for this work item is the P1 primitive set in FR-002 and FR-003. Extra
  generic pieces (for example tables, charts, navigation chrome, avatars, menus)
  may already exist or may be added later; they are not required to call this
  work item done, but if they live in the shared library they MUST still obey
  FR-005 through FR-011.
- Visual design follows the existing shared baseline already intended for both
  products rather than introducing a new brand system in this work item.
- Appearance modes are default (light) and dark. Per-user persistence of the
  choice may already exist; this work item only requires that core pieces
  respect the active mode.
- Accessibility baseline is WCAG 2.2 Level AA for contrast and for keyboard
  operation of the core set. Broader assistive-technology certification is out
  of scope.
- Domain screens (instrument cards, recommendation results, consultation steps)
  remain in the owning product. This work item does not specify those screens.
- Copy, tone of voice, and information architecture of product pages are out of
  scope.
- Implementation technology, component kit, and file layout are planning
  concerns; this specification defines the inventory, boundaries, and observable
  behavior only.
- The workspace already has a shared package location for reusable UI
  (`packages/ui`). This work item fills that role; it does not create a second
  shared UI home.
- Existing one-off controls in either app, if any, should be replaced by core
  pieces as those screens are touched; a full visual rewrite of every screen is
  not required in this work item.

### Supporting artifacts (read in full)

The folder `@docs/specs/004-ui-core-foundation/` also contained these files,
read completely and treated as approved planning context (not restated here so
the analysis stays usable; they remain the source of truth on disk):

- `plan.md` — gap-close plan, not a greenfield rewrite
- `research.md` — P1 vs extra vs domain; notice-host in both shells; tests
- `data-model.md` — primitive, baseline, appearance mode, product screen
- `contracts/ui-package-exports.md` — public surface and denylist
- `quickstart.md` — validation scenarios
- `checklists/requirements.md` — spec quality checklist (all items passed)

No existing SPDD analysis or prompt under this `work_item` was present.

---

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Shared UI library (`@windwise/ui`)**: The designated home for reusable,
  domain-free interface pieces. Both member and staff apps already depend on it
  through the workspace package link and already load its visual baseline and
  appearance wrapper in their document shells.
- **Core primitive**: Everyday building blocks already present in the shared
  library (button, field/label, inputs, select, card, badge, tabs, dialog,
  loading placeholder, separator, brief notice). Apps currently compose only a
  thin subset on home screens; there is no app-local component tree yet.
- **Extra generic primitive**: Additional generic pieces already in the shared
  library (navigation chrome, tables, charts, menus, overlays, multi-step
  control, and similar). Allowed to remain; not required for this work item to
  be done. Must still stay domain-free.
- **Shared visual baseline**: One token and type system owned by the shared
  library. Apps consume it via the shared stylesheet; they do not currently
  redefine a competing root token set.
- **Appearance mode**: Light / dark / system choice applied across primitives
  through the existing shared appearance wrapper in both app shells.
- **Product screen**: Member and staff routes that _compose_ primitives. Today
  these are placeholder homes using a shared button only. Domain screens
  (instrument, recommendation, consultation) do not exist yet in either app.
- **Notice host**: The shared brief-notice pattern exists in the library. The
  staff shell already mounts the host; the member shell does not — so notices
  are not equally available in both products.
- **Contributor inventory guidance**: Package README already states the
  domain-free rule and names appropriate vs forbidden examples, but does not
  distinguish required core vs extra, and does not mention notices/loading as
  first-class inventory.

#### New Concepts Required

- **Governed inventory tiers (P1 / extra / forbidden)**: An explicit, checkable
  catalog of what “core” means for done, what may live in the library as extra,
  and what must never be added. Today this exists only as informal README
  examples plus the approved plan — not as an enforceable product rule in the
  library.
- **Shell contract for shared patterns**: A product-level rule that both apps
  must host the same notice (and related) patterns, not merely that the
  primitives exist in the library. New as a _requirement on both products_; the
  staff app already complies, the member app does not.
- **Promotion path**: The lifecycle “build generic pattern in an app → if both
  products need it, move it into the shared library.” Stated in the spec; not
  yet a documented contributor practice beyond the README’s domain warning.
- **Accessibility release bar for core UI**: Keyboard operation, accessible
  names, and contrast baseline as conditions for calling the core set done — not
  a separate product. The constitution already requires this; the library does
  not yet prove it.

#### Key Business Rules

- **One library, two products** (governs Shared UI library, Product screen):
  Everyday controls come from the shared library; apps compose, they do not
  fork.
- **Domain stays in the owning product** (governs Core primitive, Product
  screen): Instrument, recommendation, consultation, provider-as-catalog, and
  equivalent names/behaviors must not live in the shared library.
- **Generic extras are allowed but not “done”** (governs Extra generic
  primitive): Tables, charts, chrome, and similar may remain; they inherit
  domain-free and consistency rules.
- **Notice vs dialog** (governs Core primitive): Irreversible confirmations use
  a blocking overlay; short status uses a non-blocking notice; no third pattern.
- **Spacing vs restyle** (governs Product screen, Core primitive): Layout around
  a piece is allowed; changing the piece’s own look or interaction in the app is
  not, unless documented as an exception.
- **Accessible names are mandatory** (governs Core primitive): Fields and
  icon-only actions without an accessible name are invalid uses.
- **Appearance follows the shared baseline** (governs Appearance mode, Shared
  visual baseline): Both products use the same light/dark tokens; no second
  baseline.

## Strategic Approach

#### Solution Direction

Treat this as **contract lock-in and gap-close** on the existing shared UI
library, not a rebuild and not a new package. Keep the already-adopted visual
kit. Classify what is already there into required core vs extra vs forbidden.
Make the inventory discoverable. Prove the domain-free boundary and the
keyboard/field/dialog behaviors with tests. Align the member product shell with
the staff product so notices (and thus FR-003/FR-004) work in both. Do not add a
catalog site, preview app, or domain screens in this work item.

Data flow at a product level: contributor looks up inventory → composes a
product screen from the shared library → both products render the same defaults
because they share one baseline and one primitive source → people using either
product get matching interaction, including forms, waiting, and notices.

#### Key Design Decisions

- **Fill the existing shared library vs create a second design-system package**:
  A second home would split the baseline and violate “one library” → **keep
  `@windwise/ui`**.
- **Keep the current visual kit vs replace it**: Spec assumes the existing
  baseline; a kit swap is a new brand system out of scope → **keep the current
  kit**; apps consume only the shared library, never the kit internals.
- **Required core vs promote all extras to required**: Spec bounds “done” to
  FR-002/FR-003; extras already exist and are generic → **P1 = required; extras
  stay, not required**.
- **Treat the generic multi-step control as domain vs extra**: It is a generic
  control, unused by apps, not a Windwise consultation flow → **keep as extra;
  do not treat the name as domain**.
- **Document inventory in the package README vs add a Storybook/preview route**:
  SC-001 is contributor speed, not a new app → **README inventory table; no new
  workspace member**.
- **Notice host in both shells vs library-only**: Library existence is not
  enough if the member app has no host → **both product shells must mount the
  shared notice host**.
- **Prove a11y with package tests plus a manual contrast/keyboard script vs
  visual-regression infrastructure**: Constitution requires tests; full
  screenshot grids and AT certification are out of spec → **inventory +
  golden-path behavior tests in the UI package; contrast and full keyboard
  script remain quickstart/review checks**.
- **Changeset impact**: Tests and README-only work do not bump the UI package;
  member-shell notice wiring is shipped app behavior → **patch the member app if
  that wiring ships; minor the UI package only if its public surface or
  primitive behavior changes**.

#### Alternatives Considered

- **Per-app primitives extracted later**: Rejected — constitution forbids
  duplicating shared UI; that is the failure mode this work item exists to
  prevent.
- **Hand-rolled primitives**: Rejected — would re-implement overlay focus and
  keyboard behavior the current kit already supplies, with extra bundle and
  maintenance cost.
- **Delete unused extras (including the generic multi-step control)**: Optional
  cleanup, not required; deleting for name-similarity to “consultation” would
  confuse a generic control with domain UI.
- **Preview route or Storybook for SC-001**: Rejected — extra product/tooling
  surface not in the spec; README + tests are proportional.
- **App-local banners instead of the shared notice**: Rejected — a third status
  pattern, forbidden by the spec edge case.
- **Full visual rewrite of existing screens**: Out of scope per assumptions;
  replace one-offs as screens are touched. Today there are no app-local control
  forks to rewrite.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Empty states**: User Story 2’s rationale (and the constitution) mention
  empty-state consistency; FR-003 lists field messages, loading placeholders,
  separators, and notices — **not** empty states. Promotion of a generic
  empty-state pattern is described in US3.2 but is not required for done. **SPEC
  GAP**: whether a shared empty-state primitive is in this work item or deferred
  until a product screen needs it.
- **“Provider” in the denylist**: FR-005 / SC-004 forbid provider-specific
  pieces (catalog/pricing sense). The library already uses “provider” in the
  appearance-wrapper and overlay-host sense. A naive name check can false-fail.
  The denylist must mean **Windwise product provider**, not React context hosts.
- **Menus in US4 vs P1 inventory**: Keyboard story mentions “menu”; P1 does not
  require menus (dropdown is extra). Scope of the keyboard walkthrough for
  _this_ work item should be P1 overlays (dialog) plus extra menus only if they
  remain in the library and are exercised — not a requirement to promote menus
  to P1.
- **SC-002 enforcement**: “100% of screens use the shared core” is currently
  true because homes only use the shared button and there is no app component
  folder. There is no automated guard against a future app-local button. Review
  plus optional lint is a later concern; this work item can document the rule
  without a new linter unless REASONS Canvas chooses one.
- **Contrast proof**: SC-006 is measurable; the approved plan treats automated
  contrast math as optional and a manual AA spot-check as sufficient. That is a
  coverage gap for automation, not for the requirement itself.

#### Edge Cases

- **className restyles**: Apps can pass extra classes into shared primitives and
  silently fork appearance while still “using” the library. The spec allows
  spacing around a piece, not a special button. Needs a contributor rule (and
  review), not only an inventory test.
- **Member vs staff shell extras**: Staff already wraps extra overlay context
  the member app does not. Notices are in P1 (must align). Extra overlay context
  is not P1; aligning it is optional unless a P1 flow needs it.
- **Promotion without a second consumer**: US3.2 says promote when _both_
  products need a pattern. A generic empty state used in only one app should
  stay in that app — avoid premature promotion.
- **Missing labels**: Invalid use is a consumer-app defect, not a missing
  primitive. Tests should show the valid pattern; they cannot fully prevent
  misuse in future screens.

#### Technical Risks

- **Test gap vs constitution**: Shared UI tests today only prove a class-name
  helper and that the stylesheet file is non-empty. Keyboard, field error,
  dialog dismiss, and domain-denylist are unproven. Mitigation: add inventory
  and golden-path tests in the UI package; keep new test libraries test-only so
  they never ship in app bundles.
- **Notice host missing in the member app**: Contributors cannot honor FR-003 in
  the member product until the shell mounts the shared notice host. Mitigation:
  shell parity with staff for that host only.
- **False domain positives**: Over-broad denylist matching “provider” or
  “questionnaire”. Mitigation: denylist targets Windwise domain names
  (`InstrumentCard`, consultation-as-product, catalog provider), not generic or
  host names.
- **No execution-flow index for UI**: Code intelligence currently reports no
  execution flows for this area; analysis is grounded in package/app files, not
  a call graph. REASONS Canvas should not assume a richer graph than exists.
- **New test-only dependencies**: Adding a DOM test environment is justified but
  is still a catalog change; must stay off the production dependency list
  (constitution performance).

#### Acceptance Criteria Coverage

| AC#   | Description                                                                 | Addressable? | Gaps/Notes                                                                                                            |
| ----- | --------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| US1.1 | Assemble primary action, input, dialog from shared core; no app-local forks | Yes          | P1 pieces exist; README must list import paths so this is discoverable (FR-007 / SC-001)                              |
| US1.2 | Same pieces match across member and staff products                          | Yes          | Shared source + baseline already; both apps already consume the shared button                                         |
| US1.3 | Updating a core piece updates both products without copies                  | Yes          | Workspace package link + shared stylesheet; quickstart already describes this check                                   |
| US2.1 | Required-field message uses shared field pattern                            | Yes          | Field label/description/error exist in the library; not yet used on product screens or covered by tests               |
| US2.2 | Loading uses shared placeholder, not per-app spinner                        | Yes          | Loading placeholder exists; no product screen uses it yet                                                             |
| US2.3 | Brief success/error uses shared notice                                      | Partial      | Notice primitive exists; staff shell hosts it; **member shell does not**                                              |
| US3.1 | No domain-named instrument/recommendation card in the shared library        | Yes          | Current inventory is generic; needs an automated denylist so it stays true                                            |
| US3.2 | Generic repeated pattern is promoted, not copied                            | Partial      | Rule is stated; empty-state example is not in P1; promotion path not documented beyond a short README warning         |
| US3.3 | Shared pieces make sense without catalog/recommendation knowledge           | Yes          | Current names are generic; `questionnaire` is generic multi-step, not consultation — document that                    |
| US4.1 | Keyboard reaches and operates button, field, tab, dialog, menu              | Partial      | Kit supplies keyboard behavior; **no package tests or written walkthrough script yet**; “menu” is extra not P1        |
| US4.2 | Dialog dismiss restores sensible focus                                      | Partial      | Overlay kit is expected to do this; **unproven in-repo**                                                              |
| US4.3 | Contrast sufficient; status not color-alone                                 | Partial      | Light/dark tokens exist; notices already pair status with icons; **AA not measured**; no contrast checklist in README |

**Coverage summary**: 7 of 12 acceptance scenarios are addressable with the
current library plus documentation/tests; 5 are partial because of member-app
notice-host gap, unproven keyboard/focus/contrast, and an underspecified
empty-state/promotion story.

Open questions / risks to carry into REASONS Canvas: empty-state in/out of
scope; denylist wording for “provider”; SC-002/SC-006 enforcement level;
className-as-fork; member notice host (resolved in plan — implement).
