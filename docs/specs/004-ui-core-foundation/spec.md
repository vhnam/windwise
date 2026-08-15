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
