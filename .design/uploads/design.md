# Isotope — Design System & UI/UX Specification

**Version:** 3.0 | For: UI generation via LLM | Stack: TanStack Start + Tailwind

---

## 1. Vision & Target Audience

### Core Purpose

Isotope is an AI-first job search operations platform. It automates the research, contact discovery, and email drafting pipeline so the user only needs to review, approve, and send. The mental model is a **calm daily ritual**, not a command centre — the user shows up each morning, sees exactly what needs attention, acts on it, and leaves feeling in control.

### User Persona

A software engineer actively job searching. Tech-savvy but not necessarily a power user. Values clarity over density. Spends 15–30 minutes per day inside the app. Will also show this product to non-engineer friends who job search — the UI must feel approachable, not intimidating.

### Tone & Mood

**Arc meets Sunsama.** Warm, calm, premium. Feels like a product someone designed with taste, not a team following a Figma template. Both light and dark modes are designed from scratch — dark mode is NOT an inverted light mode. It uses genuine warm-dark tones (stone/brown base), not grey or black.

The feeling in the first 3 seconds: "This feels calm and organised. I'm in control of my job search."

No harsh contrast. No cold greys. No decorative gradients. No marketing chrome. Every element is purposeful.

---

## 2. Visual Identity (Design Tokens)

### Vibe Reference

- **Light mode:** Arc browser sidebar warmth + Sunsama's calm task surface. Off-white, stone, warm neutral — never pure white.
- **Dark mode:** Warm stone-brown base (`#1C1917`), not black. Surfaces layer upward in warmth. Feels like a well-lit evening workspace, not a code editor.

### Wordmark

The app wordmark is **Isotope¹³** — the superscript `¹³` is a deliberate design element rendered in `--accent` colour. It is NOT a dot after the wordmark.

Four sizes for the `Wordmark` component:

| Size | Body text | Superscript |
| ---- | --------- | ----------- |
| `sm` | 15px 600  | 9px         |
| `md` | 17px 600  | 10px        |
| `lg` | 22px 600  | 11px        |
| `xl` | 28px 600  | 13px        |

Desktop sidebar uses `sm`. Auth hero uses `xl` (mobile) / `lg` (desktop).

### Font

**Primary font: Figtree** (Google Fonts). Use for all UI text — headings, labels, body, buttons, badges, metadata. Figtree is humanist, warm, approachable, and sharp at small sizes.

Import: `https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap`

**No monospace fonts anywhere in the UI.** Figtree only.

| Role                  | Size | Weight | Line Height | Notes                              |
| --------------------- | ---- | ------ | ----------- | ---------------------------------- |
| Page title            | 16px | 600    | 1.2         | Sidebar page name, topbar title    |
| Section heading       | 13px | 600    | 1.3         | Panel section labels, card headers |
| Table header          | 11px | 600    | 1           | Uppercase, 0.05em tracking         |
| Body / descriptions   | 13px | 400    | 1.65        | Table cells, panel content         |
| Draft / AI text       | 13px | 400    | 1.75        | Longer reading content             |
| Metadata / timestamps | 11px | 400    | 1           | Muted, secondary info              |
| Badge labels          | 11px | 600    | 1           | Sentence case (not ALL CAPS)       |
| Button labels         | 13px | 500    | 1           |                                    |
| Nav labels            | 13px | 500    | 1           |                                    |

### Color Tokens — Light Mode

| Token              | Hex       | Usage                                                              |
| ------------------ | --------- | ------------------------------------------------------------------ |
| `--bg`             | `#F7F5F2` | App background — warm off-white                                    |
| `--surface`        | `#FFFFFF` | Topbar, table header, panel                                        |
| `--surface-2`      | `#F2EFE9` | Hovered rows, secondary inputs                                     |
| `--sidebar`        | `#EFECE6` | Sidebar background                                                 |
| `--border`         | `#E2DDD6` | All borders, dividers                                              |
| `--border-strong`  | `#CCC7BF` | Emphasized borders on hover                                        |
| `--text-primary`   | `#1C1917` | All primary text                                                   |
| `--text-secondary` | `#78716C` | Secondary text, descriptions                                       |
| `--text-muted`     | `#A8A29E` | Timestamps, placeholders, metadata                                 |
| `--accent`         | `#2563EB` | Primary CTAs, active nav, focus rings — clean pure blue, no warmth |
| `--accent-hover`   | `#1D4ED8` | Hover on accent                                                    |
| `--accent-bg`      | `#EFF6FF` | Accent badge background                                            |
| `--accent-text`    | `#1E40AF` | Accent badge text                                                  |
| `--amber`          | `#D97706` | AI-generated content marker — exclusive use                        |
| `--amber-bg`       | `#FFFBEB` | AI research box background                                         |
| `--amber-border`   | `#FCD34D` | AI research box left border                                        |
| `--amber-text`     | `#92400E` | AI badge text                                                      |
| `--success`        | `#059669` | Replied, Closed, Strong Fit                                        |
| `--success-bg`     | `#ECFDF5` | Success badge bg                                                   |
| `--success-text`   | `#065F46` | Success badge text                                                 |
| `--sky`            | `#0284C7` | In Pipeline status                                                 |
| `--sky-bg`         | `#F0F9FF` | In Pipeline badge bg                                               |
| `--sky-text`       | `#075985` | In Pipeline badge text                                             |
| `--warning`        | `#D97706` | Conditional Fit, Re-Engage, low confidence                         |
| `--warning-bg`     | `#FFFBEB` | Warning badge bg                                                   |
| `--warning-text`   | `#92400E` | Warning badge text                                                 |
| `--danger`         | `#DC2626` | Failed, Dead, Disqualified, ethics flag                            |
| `--danger-bg`      | `#FEF2F2` | Danger badge bg                                                    |
| `--danger-text`    | `#991B1B` | Danger badge text                                                  |
| `--neutral-bg`     | `#F5F3EF` | Not Started, Dead badge bg                                         |
| `--neutral-text`   | `#57534E` | Not Started, Dead badge text                                       |

### Color Tokens — Dark Mode

Dark mode is designed independently. Do NOT invert light mode values.

| Token              | Hex       | Usage                                                            |
| ------------------ | --------- | ---------------------------------------------------------------- |
| `--bg`             | `#1C1917` | App background — warm stone-brown                                |
| `--surface`        | `#292524` | Topbar, table header, panel                                      |
| `--surface-2`      | `#211F1D` | Hovered rows                                                     |
| `--sidebar`        | `#231F1D` | Sidebar background                                               |
| `--border`         | `#3C3734` | All borders                                                      |
| `--border-strong`  | `#57534E` | Emphasized borders                                               |
| `--text-primary`   | `#FAF9F7` | All primary text                                                 |
| `--text-secondary` | `#A8A29E` | Secondary text                                                   |
| `--text-muted`     | `#57534E` | Timestamps, placeholders                                         |
| `--accent`         | `#60A5FA` | CTAs, active nav — lighter blue that works on dark warm surfaces |
| `--accent-hover`   | `#93C5FD` | Hover on accent                                                  |
| `--accent-bg`      | `#172554` | Accent badge background                                          |
| `--accent-text`    | `#BFDBFE` | Accent badge text                                                |
| `--amber`          | `#FCD34D` | AI-generated content — stays warm in dark mode                   |
| `--amber-bg`       | `#2A2010` | AI research box background                                       |
| `--amber-border`   | `#D97706` | AI research box left border                                      |
| `--amber-text`     | `#FDE68A` | AI badge text                                                    |
| `--success`        | `#34D399` | Replied, Closed, Strong Fit                                      |
| `--success-bg`     | `#052E1A` | Success badge bg                                                 |
| `--success-text`   | `#A7F3D0` | Success badge text                                               |
| `--sky`            | `#38BDF8` | In Pipeline                                                      |
| `--sky-bg`         | `#082030` | In Pipeline badge bg                                             |
| `--sky-text`       | `#BAE6FD` | In Pipeline badge text                                           |
| `--warning`        | `#FCD34D` | Conditional Fit, Re-Engage                                       |
| `--warning-bg`     | `#2A2010` | Warning badge bg                                                 |
| `--warning-text`   | `#FDE68A` | Warning badge text                                               |
| `--danger`         | `#F87171` | Failed, Dead, Disqualified                                       |
| `--danger-bg`      | `#2A1212` | Danger badge bg                                                  |
| `--danger-text`    | `#FCA5A5` | Danger badge text                                                |
| `--neutral-bg`     | `#292524` | Not Started, Dead badge bg                                       |
| `--neutral-text`   | `#A8A29E` | Not Started, Dead badge text                                     |

### Accent Colour Rule

`--accent` is **pure blue** (`#2563EB` light / `#60A5FA` dark). It is cool and clean — deliberately chosen to contrast against the warm neutral base without being harsh. It is used ONLY for: primary buttons, active nav state, focus rings, touch number labels, draft-ready badge, wordmark superscript.

**Amber is reserved exclusively for AI-generated content.** The AI research box, the sparkle icon on AI sections, the A/B variant pill, and all overnight-run output all use amber. This trains users to recognise: amber = machine output. No other element uses amber.

### Decorative Circles — System-Wide Brand Motif

Every major screen uses absolutely positioned decorative circles in the top-right corner. Typical values:

- Large circle: 100–240px diameter, `--accent` background, opacity 0.05–0.08
- Smaller ring: nearby, `border: 1.5px solid --accent`, opacity 0.10–0.14
- Optional third: smaller solid circle

These are `pointer-events: none`, purely decorative, and appear consistently across Today, Auth, Onboarding, Settings, and empty states.

### Layout & Spacing

- **Base unit:** 4px
- **Common spacings:** 4, 8, 12, 16, 24, 32, 48px
- **Grid:** Flexbox. Left sidebar (196px fixed) + main content area (fluid).
- **Border radius:** `8px` for cards, panels, inputs, buttons. `6px` for badges and chips. `50%` for avatars. Rounded enough to feel modern, not so rounded it looks like a consumer app.
- **Max content width:** 1280px, centred.
- **Table row height:** 50px.
- **Detail panel:** Right-side panel, **400px wide** on desktop. Part of the layout flow (not an overlay) on desktop. Full-screen drawer on mobile.
- **Sidebar nav active state:** Active item lifts to `--surface` background with `--border` border and `border-radius: 7px`. No left accent bar — the card lift is the indicator.

---

## 3. Component Specifications

### Buttons

| Variant      | Background  | Text               | Border          | Border Radius | Hover                 |
| ------------ | ----------- | ------------------ | --------------- | ------------- | --------------------- |
| Primary      | `--accent`  | `#fff`             | none            | 8px           | `--accent-hover`      |
| Secondary    | transparent | `--text-primary`   | 1px `--border`  | 8px           | `--surface-2` bg      |
| Ghost        | transparent | `--text-secondary` | none            | 8px           | `--text-primary` text |
| Danger ghost | transparent | `--danger`         | 1px transparent | 8px           | `--danger-bg` bg      |

All buttons: `height: 31px`, `padding: 0 13px`, `font: Figtree 13px 500`. No drop shadows.

Smaller variant (`sm`): `height: 25–28px`, same padding. Used in inline confirm rows and panel footers.

### Status Badges

- `height: 20px`, `padding: 0 7px`, `border-radius: 6px`, `font: Figtree 11px 600`
- Sentence case labels (not ALL CAPS)
- Never use colour alone — always pair with text

CSS badge class names (the CSS class `pipeline` maps to `--sky-*` tokens):

| Status            | Label          | CSS class  |
| ----------------- | -------------- | ---------- |
| Not Started       | Not started    | `neutral`  |
| Draft Ready       | Draft ready    | `accent`   |
| In Pipeline       | In pipeline    | `pipeline` |
| Replied           | Replied        | `success`  |
| Closed            | Closed         | `success`  |
| Dead              | Dead           | `neutral`  |
| Re-Engage         | Re-engage      | `warning`  |
| Failed            | Failed         | `danger`   |
| Waiting for Human | Needs review   | `warning`  |
| Accepted          | Accepted       | `success`  |
| Contacts Added    | Contacts added | `pipeline` |
| Applied           | Applied        | `pipeline` |
| Interviewing      | Interviewing   | `pipeline` |
| Offer             | Offer          | `success`  |

**Fit Band Badges:**

| Band            | Label        | CSS class |
| --------------- | ------------ | --------- |
| Strong Fit      | Strong fit   | `success` |
| Conditional Fit | Conditional  | `warning` |
| Weak Fit        | Weak fit     | `neutral` |
| Disqualified    | Disqualified | `danger`  |

### A/B Variant Pill (`AbPill`)

Shared component. Rendered as `<span class="m-abpill">` with spark icon + "Variant A" or "Variant B" text. Uses amber colour (`--amber-text` on `--amber-bg`). `title` attribute shows the variable name (e.g. "Subject line"). Used in Contact panel header and table rows.

### Avatar Component

Two colour states, three sizes:

| State              | Background    | Text colour        |
| ------------------ | ------------- | ------------------ |
| `warm` (contacts)  | `--accent-bg` | `--accent-text`    |
| `cool` (companies) | `--surface-2` | `--text-secondary` |

Sizes: `sm` (24px), `md` (32px, default), `lg` (40px). Content: initials (first letter of each word, max 2 chars).

### Filter Chips

Used in filter bars above tables.

- `height: 28px`, `padding: 0 11px`, `border-radius: 7px`
- Background: `--bg`, Border: `1px solid --border`
- Font: Figtree 12px 500, colour: `--text-secondary`
- Trailing chevron icon

### Input Fields

- `height: 36px`, `padding: 0 12px`, `border-radius: 8px`
- Background: `--bg`, Border: `1px solid --border`
- On focus: border becomes `--accent`, no box shadow
- Placeholder: `--text-muted`
- Font: Figtree 13px 400

### AI Research Box

Used wherever AI-generated content appears. Amber-accented to signal machine output.

- Background: `--amber-bg`
- Border: `1px solid --border`, with `border-left: 3px solid --amber-border`
- Border radius: `0 8px 8px 0` (left side is flat against the accent bar)
- Font: Figtree 12px 400, colour: `--text-secondary`, line-height: 1.65
- Section label icon: `✦` sparkle in `--amber` colour

### Tables

- Background: `--bg`. No zebra striping.
- Row hover: `--surface-2`
- Active row (panel open): `--surface`
- Header row: `--surface` background, `--border` bottom border
- Column headers: Figtree 11px 600 uppercase, `--text-muted`
- Row height: 50px
- Clicking a row opens the Detail Panel
- `table-layout: fixed` — set explicit column widths to prevent overflow

### Detail Panel

- Width: **400px** on desktop, full-screen drawer on mobile
- **Height: always 100% of the viewport minus the topbar.** Use `height: 100%` with `overflow-y: auto` on the scrollable body section. Never let the panel shrink to fit its content.
- Background: `--surface`
- Left border: `1px solid --border`
- Internal section labels: Figtree 10px 600 uppercase, `--text-muted`, 0.06em tracking
- Sections separated by `1px solid --border` dividers
- Panel is part of the layout flow on desktop — it pushes the table, does not overlay it

**Panel header row** — always visible, never scrolls:

- Left: entity name + meta pills
- Right: two icon buttons — expand (`⛶`) and close (`✕`)
- Both ghost style: `background: transparent`, `border: none`, `color: --text-muted`. Hover: `color: --text-primary`.

**Fullscreen mode:**

When the user clicks the expand icon, the detail view navigates to a dedicated route occupying the full viewport (no sidebar, no table).

Routes: `/contacts/[id]` · `/companies/[id]` · `/jobs/[id]`

In fullscreen mode:

- `← Back to [Entity]` breadcrumb top-left: Figtree 13px 500, `--text-muted`, `ti-arrow-left` icon
- Clicking back navigates to `/[entity]?panel=[id]` to restore the panel
- Centred single-column layout, max-width 720px, 32px horizontal padding
- All same sections render in same order as the panel
- The expand icon becomes a compress icon; clicking returns to list + panel open
- Route is directly shareable — Clerk session middleware handles auth

**`?panel=[id]` URL param** restores the open panel when returning from fullscreen. All `/[entity]/[id]` routes are deep-linkable.

### Contact Detail Panel — 3-Tab Structure

The contact detail uses three tabs: **Draft** | **History** | **About**

Tab bar: `--surface` bg, `--border` bottom border. Active tab: `--accent` underline, `--text-primary`. Inactive: `--text-muted`. History tab shows unread-count badge (pipeline bg).

**Draft tab (content order):**

1. Section label: `✦ Touch {N} · {channel}` (left) + `Drafted {age} ago` (right-aligned span in `--text-muted`)
2. Subject line box: `--bg` bg, border, subject text 500 weight + "Copy" button top-right
3. Body box: `--bg` bg, border, draft text + "Copy body" button top-right
4. On desktop: "Copy subject + body" combined button below both boxes
5. On mobile: three copy buttons — "Copy subject", "Copy body", "Copy all"
6. **Context used in draft** section: amber AI box with Haiku research + user notes. Right-aligned "edit in About tab" link in `--text-muted`.
7. Conversation history preview (most recent 1–2 items)
8. A/B variant callout (standard callout, not amber): "Variant B · observation-based. [Subject description]. Win condition: a reply within 7 days."
9. **Panel footer** (never scrolls): "Mark as sent" primary + "Mark as replied" secondary + spacer + "Mark dead" danger ghost — danger on far right

**Re-engage state:** An amber banner callout appears ABOVE the tab bar (not inside the tab) when `status = Re-Engage`, showing the AI one-sentence recommendation and prior sequence log (Touch 1/2/3 dates + outcomes).

**History tab:**

- Thread summary bar at top: "N messages · 1 reply · Channel"
- Bubbles rendered as chat:
  - **Sent** (right-aligned): `border-radius: 16px 16px 4px 16px`, background `--accent-bg`, border `1px solid color-mix(in srgb, var(--accent) 25%, transparent)`, user avatar on right
  - **Received** (left-aligned): `border-radius: 16px 16px 16px 4px`, background `--surface`, border `1px solid --border`, contact avatar on left
  - Both: max-width 82%, padding 11px 14px, 13px/1.7, `white-space: pre-wrap`
  - Above each bubble: date label + channel icon, aligned to the same side as the bubble
- After thread if replied: success badge "Marked as replied" + timestamp + A/B win indicator

**About tab (content order):**

1. Identity card: name, designation, email (copy icon), phone (if present)
2. Contact channels card: email row (copy icon) + LinkedIn row (external link icon + "View profile")
3. Linked company card: company name + fit band badge + link
4. Sequence info card: Touch (N of 3), Channel, A/B pill, Source (Apollo · enriched date)
5. Notes textarea (freetext)
6. "Mark as dead" danger ghost button at bottom

### Inline Confirm Row (Mark as Sent)

When "Mark as sent" is clicked, the button row is replaced inline (no modal) with:

```
Did you send this to [Name]?   [Not yet]   [Yes, sent]
```

- Rendered as a small box: `background: --bg`, `border: 1px solid --border`, `border-radius: 8px`, `padding: 7px 11px`
- "Yes, sent" = primary button style, `height: 32px` (mobile), `height: 25px` (desktop)
- "Not yet" = secondary button style, same height

On mobile, after confirming: a separate callout appears: "Sequence advances on confirmation. Touch 2 will be drafted at 1:00 AM if you don't hear back in 7 days."

### Today Section Rows (Desktop)

Each row in a Today section:

- `display: flex; align-items: center; gap: 12px; padding: 12px 16px`
- Background `--surface`, `border-bottom: 1px solid --border`
- Last child: no border-bottom
- Hover: `--surface-2`
- Container: `--surface` bg, `1px solid --border`, `border-radius: 10px`, overflow hidden

Section headers: icon + UPPERCASE label (11px 600, 0.06em tracking) + count pill (18px × 18px, `border-radius: 9px`, `--surface-2` bg). Icon colour varies by tone: `--accent`, `--warning`, `--danger`, or `--text-muted`.

Stalled rows additionally show: "Mark as sent" secondary-sm + "Open" ghost-sm buttons + warning badge showing draft age.

### Mobile Chrome

- Status bar: `height: 32px`, time 9:41, centred dynamic island pill (22px circle, dark), signal + wifi + battery icons
- Nav bar pill: `height: 24px`, 108px × 4px pill, opacity 0.4
- `MShell` passes `data-theme` attribute (`light` or `dark`)
- **FAB** (floating action button): 56px circle, `--accent` background, white plus icon (22px). Present on Contacts, Companies, Jobs list screens.

### Icon Set

All icons are inline SVG (Tabler-style, 1.5 stroke, round line caps + joins). Accept `name`, `size` (default 16), `color` (default currentColor), `strokeWidth` (default 1.5).

Key icon names: `home`, `building`, `user`, `briefcase`, `settings`, `bell`, `arrowLeft`, `arrowRight`, `chevR/D/U/L`, `plus`, `minus`, `close`, `check`, `copy`, `retry`, `search`, `filter`, `more`, `mail`, `linkedin`, `warning`, `shield`, `external`, `edit`, `trash`, `send`, `archive`, `inbox`, `star`, `sparkle`, `clock`, `calendar`, `fire`, `flag`, `ok`, `cross`, `sun`, `moon`, `layers`, `spark`, `expand`, `github`, `google`, `paperclip`, `file`, `inbox_empty`, `info`, `drag`, `globe`.

The `spark` icon is a 4-point star shape — distinct from the generic `sparkle`.

---

## 4. Page-by-Page Specifications

### 4.1 Global Layout

```
┌────────────────────────────────────────────────────┐
│  SIDEBAR (196px)    │  MAIN CONTENT (fluid)         │
│                     │                               │
│  Isotope¹³          │  Topbar (title + CTAs)        │
│  ───────────        │  Filter bar                   │
│  Today              │                               │
│  Companies          │  Table         │ Detail Panel │
│  Contacts ← active  │                │  (400px)     │
│  Jobs               │                │              │
│  ─────── (divider)  │                │              │
│  Settings           │                │              │
│  ─────── (divider)  │                │              │
│  Avatar · Name      │                │              │
│  Email address      │                │              │
└────────────────────────────────────────────────────┘
```

**Sidebar structure:**

- Wordmark: `Isotope¹³` (sm size — 15px 600 body + 9px `--accent` superscript)
- Nav items (4): Today (home icon), Companies (building icon), Contacts (user icon), Jobs (briefcase icon)
- Divider
- Settings nav item (visually separated from main 4, below divider)
- Divider
- User block: avatar (initials, `--accent-bg` / `--accent-text`), name, email address in `--text-muted`

**Mobile:** Sidebar collapses to bottom tab bar (`MTabBar`) with 4 items: Today, Companies, Contacts, Jobs. Settings accessible from a gear icon in screen topbars.

**Route map:**

| Route                      | Layout                            | Notes                      |
| -------------------------- | --------------------------------- | -------------------------- |
| `/today`                   | Sidebar + 2-column content        | Primary landing page       |
| `/companies`               | Sidebar + table + optional panel  | Panel opens on row click   |
| `/companies?panel=[id]`    | Sidebar + table + panel open      | Panel pre-opened           |
| `/companies/[id]`          | Fullscreen detail                 | Expand icon navigates here |
| `/companies/[id]/contacts` | Company contacts subpage (mobile) | Apollo enrichment log      |
| `/contacts`                | Sidebar + table + optional panel  |                            |
| `/contacts?panel=[id]`     | Sidebar + table + panel open      |                            |
| `/contacts/[id]`           | Fullscreen detail                 |                            |
| `/jobs`                    | Sidebar + table + optional panel  |                            |
| `/jobs?panel=[id]`         | Sidebar + table + panel open      |                            |
| `/jobs/[id]`               | Fullscreen detail                 |                            |
| `/settings`                | Sidebar + 4-tab settings layout   |                            |

---

### 4.2 Auth

**Mobile layout:** Single column. Wordmark (lg), then form card.

**Desktop layout:** Split-panel — left brand panel + right form panel.

Left brand panel:

- Wordmark (lg)
- Tagline: "Find your exact match." (28px 600, max-width 460px)
- 3 bullet points:
  1. "No spam blasts. Every draft is reviewed."
  2. "3-stage research before any company enters your pipeline."
  3. "A/B testing built in — find what gets replies."
- Footer: `v1.7 · Secured by Clerk · Made for engineers in India` (12px muted, bottom of panel)
- Decorative circles in corner

Right form panel: Clerk-rendered form. SSO buttons are 2-column grid on desktop, stacked on mobile.

**SSO callback screen (`MobileSso`):**

- Wordmark (lg)
- 64px circle with check icon (32px, `--accent`)
- Heading: "Signing you in…"
- Sub: "Returning from Google. This will only take a moment."
- Animated 3-dot pulse loader: 3 circles, `pulse` keyframe, staggered 0.2s delays

---

### 4.3 Onboarding — Path Selection

Full-page, centred, no sidebar. Decorative circles in background.

**Desktop layout:** Two cards side by side + footer note.

**Quick Start card** (left):

- Label: "Recommended · 30 sec" (10px 600 uppercase, `--accent-text`)
- Icon: `arrowRight` in 44px × 44px `--accent` rounded square
- Defaults preview grid (2×2): Salary band | Locations | Required skills | A/B variant
- Primary CTA: "Quick start"

**Connected accounts block** (inside Quick Start card):
Three items, each with circular initial avatar, name, sub-label, and green dot + "Connected" text:

1. Google — user's email — Connected
2. Apollo — contact discovery, 500 credits available — Connected
3. Resend — digest email, default address — Connected

**Full Setup card** (right):

- Label: "~8 min"
- Icon: muted arrow in `--surface-2` square
- Secondary CTA: "Full setup"

**Footer note** (below both cards, centred, 12px muted):
"Either way, the fixed system prompts (email drafting, contact search) are already active — they apply to everyone identically and are not user-configurable."

**Mobile layout:** Full-bleed hero section + two stacked cards.

Hero:

- `--sidebar` background
- 3 decorative circles
- Wordmark (xl)
- h1: "Your job search, on autopilot." (26px 600, max-width 260px)
- Amber time strip: amber dot + "AI works 1:00 – 2:00 AM · digest at 8:00 AM"

Mobile Quick Start card: labeled "Recommended · 30 sec". No preview grid on mobile.
Mobile Full Setup card: labeled "~8 min".

---

### 4.4 Onboarding Wizard

3-step flow. Same form → generate → review → save pattern per step.

**Steps:** Company Research Framework → Job Search Framework → A/B Testing Configuration.
Each can be skipped (flagged incomplete, blocks AI jobs until completed).

**Mobile Step 1 — Company Research Framework:**

Live summary strip at top (3 stat boxes): Selected (accent), High priority (accent-text), Dealbreakers (danger-text).

Criteria list (scrollable): Each criterion card shows:

- Checkbox + criterion name
- "AI looks at:" label in amber uppercase 10px + signal examples (always visible below name)
- When selected: Low / Medium / High importance buttons appear
  - Low: `--surface-2` bg, `--border`, `--text-muted`
  - Medium: `--warning-bg`, warning border, `--warning-text`
  - High: `--accent-bg`, accent border, `--accent-text`
- When importance = High: Dealbreaker toggle appears (`--danger-bg`, danger border, danger-text, flag icon)

"Add your own criterion" row at bottom (centred, `--accent-text`).

**Mobile Step 1 Review screen:**
AI box shows generated framework text. Character count: "Generated framework · {N} chars". Accent-bg card: "Looks good. Save and continue." Footer: Back + Save & continue.

**Mobile Step 2 — Job Search Fields:**
Target role titles (tag input, 5 defaults), Hard-required skills (accent-bg chip input), Prioritised skills (list with High/Medium badges), Minimum salary (₹ + LPA), Experience range (two number inputs), Results cap per run (default 20), Recency window (3 buttons: 7 days / 14 days / 30 days).
Footer: Skip ghost + Generate framework primary.

**Mobile Step 3 — A/B Config Fields:**
Active variable (dropdown, 5 options: Subject line, Preview text, CTA copy/placement, Send time, Email body structure). Variant A card: "Question-based" with example subject in italic bg box. Variant B card: "Observation-based" with example. Assignment: radio "Alternate (A/B/A/B…)" — labelled "v1 only".
Footer: Skip ghost + Generate & finish primary.

**Desktop Step 1 — 4 form cards (full-width form + sticky right rail):**

1. Stage 1 Pre-filters: salary range grid, locations input
2. Stage 2 Ethics gate: tag chips for flags + "Add custom flag" dashed button
3. Stage 3 Scored criteria: drag handle, criterion name, weight stepper, auto no-go toggle, delete button (5-col grid layout)
4. Decision bands: Strong fit ≥ / Conditional fit ≥ two number inputs

Right rail (sticky amber AI box): 3 example paragraphs showing framework narrative.
Footer (sticky): Skip ghost + "Save & next: Job Search →" secondary + "Generate framework" primary (lg, spark icon).

**Quick Start confirmation screen (`MobileOnbQuick`):**

- Title: "You're set up." (26px 600)
- 80px circle with 38px check icon: `--accent-bg` bg + `2px solid color-mix(in srgb, var(--accent) 35%, transparent)` border
- Amber time indicator: "Next run: tonight · 1:00 AM IST"
- Callout: "Your frameworks are using defaults."
- "What runs overnight" card with 3 rows describing automated steps
- CTA: "Take me to Today" (full-width primary)

---

### 4.5 Today Page

Primary landing screen. No table — purely an action digest with daily context.

**Mobile layout:** Single column.

Mobile header is special: shows **Wordmark** (not page title), plus bell icon + settings icon. Decorative circles behind header.

Section order:

1. **Needs your input** — contacts held at Not Started, missing personalisation
2. **Needs attention** — Failed records with retry links
3. **Drafts ready** — Draft Ready contacts (stalled items shown inline with "STALLED" badge)
4. **Stalled drafts** — Draft Ready for 3+ days
5. **Companies to review** — Waiting for Human
6. **Jobs to review** — Waiting for Human
7. **Follow-ups due today** — In Pipeline, next touch today

Footer text (centred, below all sections): "You're all caught up after these." — 12px 400, `--text-muted`, 24px top + 32px bottom padding.

**Desktop layout:** 2-column grid — `gridTemplateColumns: 1fr 320px`, gap 32px.

**Left column:** Greeting + all 7 action sections (each wrapped in `--surface` bordered card with 10px border-radius).

**Right column (sticky):** `position: sticky; top: 0; alignSelf: flex-start`.
Contains two cards:

1. **AI Activity Card** (amber-accented, top):
   - Background `--amber-bg`, border-left `3px solid --amber-border`
   - Shows overnight run stats: Drafts written, Companies researched, Contacts found, etc.
   - Spark icon in amber in header

2. **Pipeline Glance Card** (below, standard `--surface` card):
   - 4 counters: In conversation / Awaiting reply / Replied / Dead this week

**Desktop topbar** for Today page:

- Title: "Today" (left)
- Sub-title: date + time e.g. "Tuesday, May 20, 2026 · 8:14 AM IST" in `--text-muted`
- Right: notification bell with count badge + "Preview digest" button (inbox icon, secondary)

---

### 4.6 Companies Page

**Topbar:** "Companies" title + "Add company" primary button.
**Filter bar:** Status chip, Fit Band chip.
**Mobile chips (6 options):** All, Needs review, Strong fit, Accepted, Contacts added, Disqualified. Row count + "Sort: Updated" label right-aligned.
**Mobile grouped sections:** "Needs review (N)" + "In progress (N)". Each row shows: avatar, name (with optional `⚠` ethics warning icon inline after name), industry · size, fit badge, score as `{score}/{max}`.

**Desktop table columns (fixed widths):**

| Column   | Width | Content                                                                |
| -------- | ----- | ---------------------------------------------------------------------- |
| Company  | 28%   | Name (500) + ethics `⚠` icon inline if flagged + website (muted below) |
| Industry | 15%   | Muted text                                                             |
| Fit Band | 16%   | Fit band badge                                                         |
| Score    | 10%   | `{score}/{max}` primary, percentage muted below                        |
| Status   | 15%   | Status badge                                                           |
| Updated  | 8%    | Relative timestamp                                                     |

**There is NO separate Ethics column.** The ethics warning icon (`size=13`, `color=var(--warning)`) is inline in the Company name cell.

**Company Detail Panel — sections top to bottom:**

1. **Header:** Name (h2), website link, status badge.
   - Desktop footer buttons (3): Reject (danger) + Accept (secondary) + Accept · find contacts (primary)
   - Mobile footer buttons (2): Reject (danger) + Accept · find contacts (primary)

2. **User context field** — labelled "Your context for AI". Freetext textarea. Appears at top of panel body (above score), editable at any status.

3. **Score card:**
   - Large number: `{total}` (32px 600) + `/ {max}` (14px muted) + percentage right-aligned (colour-coded: success ≥80%, warning ≥60%, secondary otherwise)
   - Progress bar: height 6px, border-radius 3px, colour-coded fill
   - Threshold markers: `1px solid --border-strong` vertical lines at 60% and 80%, extending 3px above and below bar
   - Scale labels: "Weak | Conditional 60% | Strong 80%"
   - Fit band badge + percentage text below bar

4. **Pre-filter results** — Two pass/fail inline badges: "Salary" and "Location". Only show after Stage 1 has run.

5. **Ethics gate** — Only show after Stage 2. Badge: "Ethics: clear" or "Ethics: flagged". If flagged: danger callout box with AI notes.

6. **Scored criteria table** — criterion name + weight label (`w{N}`) + confidence (inline below name — amber dot + "Low confidence — limited signals" for low). Score stepper (minus/number/plus) if `Waiting for Human`; read-only otherwise. Desktop adds weighted contribution column: `{score × weight}` in 11px muted right-aligned.

7. **Fit band summary** — large fit band badge + "Score: X / max Y". Updates live as scores edited.

8. **AI research summary** — full narrative. Collapsible after 4 lines. Amber-accented AI research box.

9. **Linked contacts** — list with name, designation, status badge. "Add contact manually" button.

10. **Linked jobs** — list with title and status badge.

11. **Notes** — freetext textarea.

---

### 4.7 Company Contacts Subpage (Mobile)

Route: `/companies/[id]/contacts`

**Header:** Company name + "N people · N in pipeline" subheader. Plus icon for adding contacts manually.

**Apollo Enrichment Log card** (`--surface` bg, border, 10px radius):
5 metrics in a vertical list:

- Stubs returned: 5
- Skipped pre-dedup: 1
- Enriched: 4
- Dedup by LinkedIn URL: 2
- Apollo credits used: 4 (displayed in `--accent-text` 600)

Below: contact list rows matching the standard contacts list format.

---

### 4.8 Contacts Page

**Topbar:** "Contacts" title + "Add contact" primary button.
**Filter bar (desktop):** 4 chips — Status (default "Draft ready"), Company ("All"), Channel ("All"), Fit ("All bands"). Row count right-aligned.
**Mobile chips (7 options):** All, Draft ready, In pipeline, Needs input, Replied, Re-engage, Dead.
**Mobile grouped sections:** "Drafts ready · ready to send (N)" → "In pipeline (N)" → "Other (N)".

**Desktop table columns:**

| Column  | Width  | Content                                   |
| ------- | ------ | ----------------------------------------- |
| Name    | ~2fr   | Name (500), designation (muted below)     |
| Company | ~1.4fr | Company name (500) + fit band badge below |
| Touch   | 80px   | T1/T2/T3 in `--accent` colour             |
| Channel | 1fr    | Channel badge                             |
| Status  | 110px  | Status badge                              |
| Next    | 90px   | Next touch date (muted)                   |

**Contact Detail Panel** — 3-tab structure (see §3 for full tab spec).

**Meta bar** (below header, above tabs — mobile):
Pill row: company link (accent, building icon) + fit band badge + status badge + A/B pill. Background `--surface`, `border-bottom: 1px solid --border`, padding 12px 16px, `flex-wrap: wrap`.

**Contact "Needs Input" state:**

- Callout: "Held at Not Started. AI ran personalisation search but didn't find public writing, talks, or shared context."
- AI search results card (`--surface-2` bg): 3 search queries, each with ✗ icon + "0 useful" count + "Haiku returned null." paragraph
- Personalisation textarea with field help: "Saving this triggers a new draft tonight at 1:00 AM."
- Footer: "Generate anyway" secondary (spark icon) + "Save context" primary

**Contact "Failed" state:**

- Failure log card: 3 timestamped entries with warning icon + error string (e.g., "Apollo people/match · 429 rate-limited")
- Field help: "After 3 failures, status moved to Failed."
- Footer: "View error log" ghost + "Retry now" primary (retry icon)

**Contact "Re-engage" state:**

- Amber banner above tab bar: AI one-sentence recommendation
- Prior sequence section: surface-2 card with Touch 1/2/3 dates + "no reply" + "Marked dead" date
- Footer: "Skip · don't send" secondary + "Send re-engage" primary

**New Contact Form fields:**
Full name*, Company* (search or add), Designation, Email, LinkedIn URL + "LinkedIn connection accepted" checkbox-style indicator, Personalisation context (freetext), Linked job (optional select).
Help text: "Manual contacts skip the Apollo search. AI will still run personalisation research on Claude Haiku before drafting."

**Mobile empty state:**
3 decorative circles, 72px user icon circle, "No contacts yet" h2 (18px 600), description, two buttons: "Open Companies" (primary, building icon) + "Add contact manually" (secondary).

---

### 4.9 Jobs Page

**Desktop topbar:** "Jobs" title + "Discover jobs" (spark icon, secondary) + "Add manually" (plus icon, secondary).
**Mobile:** Amber discover strip at top of list: "Find new jobs matching your framework" + "Discover" button (secondary-sm).
**Mobile chips (6 options):** All, Needs review (N), Accepted (N), Applied, AI suggested, Rejected.
**Mobile grouped sections:** Needs review (N) + In progress (N) + Rejected (N).

**Desktop table columns:**

| Column   | Width | Content                               |
| -------- | ----- | ------------------------------------- |
| Title    | 2fr   | Job title (500) + company muted below |
| Company  | 1.2fr | Company name                          |
| Location | 0.8fr | Location                              |
| Salary   | 120px | Salary range badge (neutral)          |
| Status   | 110px | Status badge                          |
| Added    | 80px  | Relative timestamp                    |

**Job Detail Panel:**

- Meta row: status badge + fit badge + source badge + salary badge (flex-wrap)
- 2×2 meta grid: Company, Location, Salary, Added
- Linked company card with fit band badge
- Full JD text in scrollable box (desktop truncated to 700 chars)
- Source link row (mobile only): tappable row with external URL + external icon + chevron
- Notes textarea
- Footer (if `Waiting for Human`): "Reject" danger + "Accept · add company" primary

**New Job Form fields:**
Title, Company (linked), Location, Salary, Source URL, Source selector (4 buttons: LinkedIn / Naukri / Manual / Other), Job description textarea.

---

### 4.10 Morning Digest Email

HTML email via Resend. Sent from `digest@isotope.work`.

- Background: `#F7F5F2`
- Max width: 600px, centred
- Avatar: dark green circle (`#4D7C0F`) with "Is" initials
- Wordmark in email body: "Isotope" + small coloured dot (`#4D7C0F`)
- Font: Figtree via Google Fonts, fallback Georgia/sans-serif
- Section headers: Figtree 11px 600 uppercase, `--text-muted`
- Each item: name, company, key detail, one deep-link button
- Deep links are plain app URLs — no signed tokens, no expiry. Clerk handles auth on load.
- Only sections with content are sent

**Section order (4 sections):**

1. **Needs your input** — contacts held at Not Started, missing personalisation
2. **Drafts ready** — Draft Ready contacts. Stalled items shown INLINE with "STALLED" badge + "Did you send it?" CTA in warning colours
3. **Companies to review** — Waiting for Human
4. **Needs attention** — Failed records with retry links

**CTA button styles (Gmail context — not app design tokens):**

- Non-stalled draft: green bg `#4D7C0F`, white text, 7px padding, border-radius 6
- Stalled draft: `#FDECE2` bg, `#C2410C` text
- Company review: `#F2EFE9` bg, `#4D7C0F` text
- Needs attention: `#FCE7EC` bg, `#9F1239` text

**Email footer links:** "Open app · Digest settings · Sent by Resend · [No expiry · Auth via Clerk / v1.7]"

---

### 4.11 Settings

4 tabs: **Frameworks** | **Analytics** | **Digest** | **Account**

**Desktop tab bar:** horizontal, 44px height, positioned below topbar. Left-aligned, active tab has `--accent` underline.

---

#### Frameworks Tab

3 framework cards (Company Research, Job Search, A/B Testing). Each card:

- Title + "Using defaults" amber badge (if seeded — card gets amber border `var(--amber-border)`) vs standard `--border`
- Description + tags (surface-2 pills: e.g. "3 versions", "8 criteria", "Max 135 pts")
- "View versions" ghost button + "Edit" secondary button
- Footer: "Updated {date} · v{N}" in 11px muted

**Defaults banner** (amber bg, if any framework is seeded):
"[Framework name] is still using defaults. Personalise it to improve results." + "Edit now" secondary-sm button. Decorative circles top-right.

**Fixed system prompts section** (below framework cards):
Listed with bullet dots, read-only. Header: "Fixed prompts — not user-configurable." Explanation: "These apply to all users identically. They are not user-configurable and do not appear in onboarding." The Email Drafting and Contact Search prompts appear here for reference — NOT for editing.

---

#### Analytics Tab

**Sufficient data state (≥20 contacts per variant):**

- Data table: Variant | Assigned | Replies | Rate (grid: `1fr 70px 60px 80px`)
- Visual bar chart: "A · Question" in `--accent`, "B · Observation" in `--amber`
- Confidence label: e.g. "moderate confidence" (inline text)
- Win condition card: separate section below chart
- **Switch active variable** section: radio list of 5 testable variables. Field help: "Historical results are retained when you switch. New contacts get the new variable; existing contacts keep theirs."

**Low data state (< 20 contacts per variant):**
"Not enough data yet. You need at least 20 contacts per variant."
Progress bars per variant (e.g. A: 8/20, B: 7/20) filled in `--border-strong`.

**There is no 20–50 "low confidence" tier.** The single threshold is 20 contacts per variant.

---

#### Digest Tab

- **Time selector:** Quick-select buttons for 7 AM / 8 AM / 9 AM + custom time input
- **Timezone:** Selector (default IST)
- **Delivery address:** User's email + green "Verified" badge. Explanation: "Digest goes to your registered Clerk email. All digest links are plain app URLs — no expiry, no signed tokens. Clerk handles auth on load."
- **Preview send button:** "Send preview now" secondary
- **Next digest callout:** `--success-bg` background, green border-left. Text: "Next digest: Tomorrow, [date], at [time] [tz]."

---

#### Account Tab

- **Profile card:** name, email, edit icon button, Username row, Member since row
- **Connected accounts:** Google (Connected) + GitHub (Not connected / Connect button)
- **Danger zone:** "Sign out of all devices" + "Delete account" — both secondary buttons with `color: var(--danger)`, `borderColor: var(--danger-bg)`

---

## 5. UX Patterns

### Loading States

Skeleton screens only — never spinners. Skeleton blocks use `--surface-2` colour. Tables show 5 skeleton rows.

### Empty States

One-line label in `--text-muted` (Figtree 13px) + relevant CTA button. No illustrations. Key screens (Contacts, Companies) have a larger decorated empty state: 3 decorative circles + large entity icon in circle + h2 (18px 600) + description + two action buttons.

### Error States

- Form fields: inline below the field in `--danger` colour
- API failures: top-of-panel banner with `--danger-bg` background + `--danger` border

### Responsive

- Desktop-first, 1280px+ primary target
- < 1024px: detail panel becomes full-screen drawer
- < 768px: sidebar → bottom tab bar (`MTabBar`); tables → card stacks; "Copy all" single button

### Transitions

- Detail panel: `transform: translateX(100%)` → `translateX(0)`, 200ms ease-out
- Inline confirm row: fade + slight scale, 150ms ease
- SSO callback: 3-dot pulse animation, staggered 0.2s delays
- No other motion

---

## 6. Key UX Constraints (Do Not Violate)

1. **"Mark as sent" never advances the sequence directly.** Always shows inline confirm row first. After confirming on mobile, show next-touch callout.
2. **Detail panel never navigates away.** Always an overlay on mobile, layout-integrated on desktop.
3. **Score steppers only appear when company status = `Waiting for Human`.** Read-only at all other statuses.
4. **"Generate anyway" only appears when both personalisation note fields are null.** Must carry a warning — never the primary action.
5. **Re-engage recommendation callout only appears when contact status = `Re-Engage`.** Shown above tab bar, not inside it.
6. **Fixed system prompts appear in Settings as read-only reference.** Not editable, not in onboarding, not as framework cards.
7. **A/B analytics UI hidden below 20 contacts per variant.** Single threshold — no 50-contact tier.
8. **Touch #, channel, and A/B variant are display-only.** Never editable by the user.
9. **Amber is reserved exclusively for AI-generated content.** No other UI element uses amber tones.
10. **Accent blue is reserved for actions and active states only.** Never used decoratively.
11. **Ethics flag is inline in the company name cell.** There is no separate Ethics table column.
12. **Company detail footer: mobile = 2 buttons, desktop = 3.** Mobile has Reject + "Accept · find contacts". Desktop adds standalone Accept between them.
13. **Wordmark is "Isotope¹³" with superscript in `--accent`.** Not "Trackr" and not a dot.
14. **Jobs topbar: "Discover jobs" (spark icon) + "Add manually".** Not "Find new jobs" + "Add job".
15. **Digest has 4 sections, not 7.** Stalled items are inline within Drafts ready. Jobs-to-review and follow-ups are in-app (Today screen) only.

---

## 7. Changelog from v2.0

### Corrections

- App name: `Isotope¹³` with accent superscript (was "Trackr"/"JobTracker" + dot)
- Navigation: 4 items — Today added as primary landing
- Contact detail: 3-tab panel replaces flat ordered section list
- Companies table: Ethics column removed — flag inline in name cell
- Score column: `{score}/{max}` + percentage (progress bar only in detail panel)
- Company detail footer: mobile=2 buttons, desktop=3
- Detail panel width: 400px (was 380–420px range)
- Jobs buttons: "Discover jobs" + "Add manually"
- Jobs table: Salary column added
- Settings: 4 tabs — Frameworks, Analytics, Digest, Account
- Fixed prompts: appear in Settings as read-only (NOT hidden entirely)
- A/B analytics: threshold = 20 contacts, no 50-contact tier
- Digest: 4 sections (stalled merged inline)
- UX constraint §5: re-engage banner is above tab bar
- UX constraint §6: fixed prompts appear in Settings, read-only

### New sections added

- §2 Wordmark spec (4 sizes, superscript detail)
- §2 Decorative Circles motif
- §3 A/B Variant Pill (`AbPill`) component
- §3 Avatar Component (warm/cool states, 3 sizes)
- §3 Contact Detail Panel 3-Tab Structure (Draft, History, About)
- §3 Today Section Rows (desktop row format, stalled buttons)
- §3 Mobile Chrome (status bar, FAB, `data-theme`)
- §3 Icon Set (full name list)
- §4.2 Auth (desktop split-panel, SSO callback screen)
- §4.3–§4.4 Onboarding (complete rewrite — mobile hero, connected accounts, all wizard steps)
- §4.5 Today Page (new primary landing screen, full spec)
- §4.7 Company Contacts Subpage (Apollo enrichment log)
- §4.10 Morning Digest Email (sender address, 4-section structure, CTA colours)
- §4.11 Settings (4-tab full spec)
