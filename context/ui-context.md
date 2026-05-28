# UI Context — Isotope

## Theme

**Arc meets Sunsama.** Warm, calm, premium. Both light and dark modes are designed from scratch — dark is NOT an inverted light mode.

- **Light mode:** Off-white, stone, warm neutral. Arc browser sidebar warmth + Sunsama's calm task surface.
- **Dark mode:** Warm stone-brown base (`#1C1917`), not grey or black. Surfaces layer upward in warmth. Feels like a well-lit evening workspace, not a code editor.

No harsh contrast. No cold greys. No decorative gradients. No marketing chrome.

---

## Wordmark

The wordmark is **Isotope¹³** — the superscript `¹³` is a deliberate design element rendered in `text-primary` colour. It is NOT a dot after the wordmark.

| Size | Body text | Superscript | Where used                        |
| ---- | --------- | ----------- | --------------------------------- |
| `sm` | 15px 600  | 9px         | Desktop sidebar                   |
| `md` | 17px 600  | 10px        | —                                 |
| `lg` | 22px 600  | 11px        | Auth hero (desktop), SSO callback |
| `xl` | 28px 600  | 13px        | Auth hero (mobile), onboarding    |

---

## Font

**Primary font: Figtree Variable** — loaded via `@fontsource-variable/figtree` and mapped to `--font-sans`. Used for all UI text. **No monospace fonts anywhere in the UI.**

```css
font-family: "Figtree Variable", sans-serif;
```

| Role                  | Size | Weight | Line Height | Notes                        |
| --------------------- | ---- | ------ | ----------- | ---------------------------- |
| Page title            | 16px | 600    | 1.2         | Topbar title, sidebar page   |
| Section heading       | 13px | 600    | 1.3         | Panel labels, card headers   |
| Table header          | 11px | 600    | 1           | Uppercase, 0.05em tracking   |
| Body / descriptions   | 13px | 400    | 1.65        | Table cells, panel content   |
| Draft / AI text       | 13px | 400    | 1.75        | Longer reading content       |
| Metadata / timestamps | 11px | 400    | 1           | Muted, secondary info        |
| Panel section label   | 10px | 600    | 1           | Uppercase, 0.06em tracking   |
| Badge labels          | 11px | 600    | 1           | Sentence case (not ALL CAPS) |
| Button labels         | 13px | 500    | 1           |                              |
| Nav labels            | 13px | 500    | 1           |                              |

Utility classes: `text-xxs` = 11px/1, `text-xxxs` = 9px/1 (defined in `styles.css`).

---

## Colors

Token system uses **shadcn's semantic bridge** (`--background`, `--foreground`, `--primary`, `--border`, etc.) plus **extended scaffold tokens** for semantic states. All tokens are defined in `apps/web/src/styles.css` as oklch values with their hex equivalents in comments.

**NEVER use hardcoded hex values in components. NEVER invent token names. Check `styles.css` before writing any color class.**

### Tailwind class mapping (how to use tokens in JSX)

| Purpose              | Tailwind class               | CSS var resolves to  |
| -------------------- | ---------------------------- | -------------------- |
| Page background      | `bg-background`              | `--background`       |
| Card / panel surface | `bg-card`                    | `--card`             |
| Hovered rows         | `bg-(--surface-raised)`      | `--surface-raised`   |
| Sidebar background   | `bg-sidebar`                 | `--sidebar`          |
| Primary text         | `text-foreground`            | `--foreground`       |
| Secondary text       | `text-(--text-secondary)`    | `--text-secondary`   |
| Muted text           | `text-muted-foreground`      | `--muted-foreground` |
| Brand accent         | `text-primary`, `bg-primary` | `--primary`          |
| All borders          | `border-border`              | `--border`           |
| Destructive actions  | `text-destructive`           | `--destructive`      |

### Core tokens — Light / Dark

| Role            | Light value    | Dark value     | Tailwind class                                                           |
| --------------- | -------------- | -------------- | ------------------------------------------------------------------------ |
| Page background | `#F7F5F2`      | `#1C1917`      | `bg-background`                                                          |
| Card / surface  | `#FFFFFF`      | `#292524`      | `bg-card`                                                                |
| Hovered rows    | `#F2EFE9`      | `#211F1D`      | `bg-(--surface-raised)`                                                  |
| Sidebar         | `#EFECE6`      | `#231F1D`      | `bg-sidebar`                                                             |
| Border          | `#E2DDD6`      | `#3C3734`      | `border-border`                                                          |
| Border strong   | `#CCC7BF`      | `#57534E`      | `border-(--border-strong)` _(not in shadcn bridge — use `var()` inline)_ |
| Primary text    | `#1C1917`      | `#FAF9F7`      | `text-foreground`                                                        |
| Secondary text  | `#78716C`      | `#A8A29E`      | `text-(--text-secondary)`                                                |
| Muted text      | `#A8A29E`      | `#57534E`      | `text-muted-foreground`                                                  |
| Brand accent    | `#4D7C0F` moss | `#A3E635` lime | `text-primary` / `bg-primary`                                            |
| Destructive     | `#9F1239`      | `#FB7185`      | `text-destructive`                                                       |

### Extended semantic tokens (use via `var()` or `bg-(--token)` syntax)

**AI / machine-generated content** — amber, exclusive use. Amber = machine output. No other element uses amber tones.

| CSS var       | Light     | Dark      | Usage                      |
| ------------- | --------- | --------- | -------------------------- |
| `--ai`        | `#D97706` | `#FCD34D` | AI sparkle icon colour     |
| `--ai-bg`     | `#FFFBEB` | `#2A2010` | AI research box background |
| `--ai-border` | `#FCD34D` | `#D97706` | AI box left border accent  |
| `--ai-text`   | `#92400E` | `#FDE68A` | AI badge text              |

**Status colours:**

| CSS var           | Light             | Dark              | Usage                       |
| ----------------- | ----------------- | ----------------- | --------------------------- |
| `--success`       | `#059669`         | `#34D399`         | Replied, Closed, Strong Fit |
| `--success-bg`    | `#ECFDF5`         | `#052E1A`         | Success badge background    |
| `--success-text`  | `#065F46`         | `#A7F3D0`         | Success badge text          |
| `--warning`       | `#D97706`         | `#FCD34D`         | Conditional Fit, Re-Engage  |
| `--warning-bg`    | `#FFFBEB`         | `#2A2010`         | Warning badge background    |
| `--warning-text`  | `#92400E`         | `#FDE68A`         | Warning badge text          |
| `--pipeline`      | `#0284C7`         | `#38BDF8`         | In Pipeline, Applied, etc.  |
| `--pipeline-bg`   | `#F0F9FF`         | `#082030`         | Pipeline badge background   |
| `--pipeline-text` | `#075985`         | `#BAE6FD`         | Pipeline badge text         |
| `--danger`        | → `--destructive` | → `--destructive` | Alias — always in sync      |
| `--danger-bg`     | `#FEF2F2`         | `#2A1212`         | Danger badge background     |
| `--danger-text`   | `#991B1B`         | `#FCA5A5`         | Danger badge text           |

**Accent badge tokens** (used for `accent` CSS class — Draft Ready, Touch labels, wordmark superscript):

`--accent-bg` and `--accent-text` are referenced in components as CSS custom properties. **Note: these are not yet defined in `styles.css` — add them there before using in new components.**

**Neutral badge** (Not Started, Dead): `bg-(--surface-raised) text-(--text-secondary)`

### Colour rules (strict)

- **`--ai*` tokens are reserved exclusively for AI-generated content.** AI research boxes, sparkle icons, A/B variant pills, overnight-run output. No other element uses amber. Trains users: amber = machine output.
- **`--primary` is reserved for actions and active states only.** Primary buttons, active nav, focus ring (`--ring`), touch labels (T1/T2/T3), draft-ready badges, wordmark superscript. Never used decoratively.
- **shadcn's `--accent`** in this app = `--surface-raised` (ghost hover target). Do not confuse with the brand accent colour (`--primary`).

---

## Border Radius

The base radius is `--radius: 0.5rem` (8px). The scale is derived from it.

| Context               | Tailwind class / value | Approx px | Used for                       |
| --------------------- | ---------------------- | --------- | ------------------------------ |
| Badges, chips         | `rounded-md`           | ~6px      | Status badges, filter chips    |
| Sidebar active, chips | `rounded-lg` / `7px`   | 7–8px     | Sidebar nav active card        |
| Cards, panels, inputs | `rounded-lg`           | 8px       | Cards, panels, inputs, buttons |
| Onboarding cards      | `rounded-xl` / `12px`  | ~11–12px  | Onboarding path cards          |
| Decorative circles    | `rounded-full`         | 50%       | Avatars, decorative circles    |
| Pill elements         | `rounded-full`         | 999px     | Pill-shaped chips              |

---

## Component Library

shadcn/ui on top of Tailwind v4. Components live in `src/shadcn/ui/`. Use the shadcn CLI to add new components — never write them from scratch or modify files in `src/shadcn/ui/` directly. Extend via `className` only.

---

## Component Specifications

### Buttons

| Variant      | Background   | Text                      | Border          | Hover                     |
| ------------ | ------------ | ------------------------- | --------------- | ------------------------- |
| Primary      | `bg-primary` | `#fff`                    | none            | `--accent-hover` (darken) |
| Secondary    | transparent  | `text-foreground`         | `border-border` | `bg-(--surface-raised)`   |
| Ghost        | transparent  | `text-(--text-secondary)` | none            | `text-foreground`         |
| Danger ghost | transparent  | `text-destructive`        | transparent     | `bg-(--danger-bg)`        |

All buttons: `h-[31px]`, `px-[13px]`, `text-[13px] font-medium`, `rounded-lg`. No drop shadows.
Small variant (`sm`): `h-[25px]`, same padding. Used in inline confirm rows and panel footers.

### Status Badges

- `h-[20px]`, `px-[7px]`, `rounded-md`, `text-[11px] font-semibold`
- Sentence case labels — not ALL CAPS
- Never use colour alone — always pair with text label

The badge CSS class system used in `-StatusBadge.tsx`:

| CSS class  | Tailwind classes applied                        |
| ---------- | ----------------------------------------------- |
| `accent`   | `bg-(--accent-bg) text-(--accent-text)`         |
| `success`  | `bg-(--success-bg) text-(--success-text)`       |
| `warning`  | `bg-(--warning-bg) text-(--warning-text)`       |
| `pipeline` | `bg-(--pipeline-bg) text-(--pipeline-text)`     |
| `danger`   | `bg-(--danger-bg) text-(--danger-text)`         |
| `neutral`  | `bg-(--surface-raised) text-(--text-secondary)` |

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

### AI Research Box

Used wherever AI-generated content appears. Amber-accented to signal machine output.

- Background: `bg-(--ai-bg)`
- Border: `border border-border` + `border-l-[3px] border-l-(--ai-border)`
- Border radius: `rounded-r-lg` (left side flat against the accent bar)
- Font: 12px 400, `text-(--text-secondary)`, line-height 1.65
- Section label icon: `✦` sparkle in `text-(--ai)` colour

### Avatar Component

| State                   | Background              | Text                      |
| ----------------------- | ----------------------- | ------------------------- |
| `warm` (contacts/users) | `bg-(--accent-bg)`      | `text-(--accent-text)`    |
| `cool` (companies)      | `bg-(--surface-raised)` | `text-(--text-secondary)` |

Sizes: `sm` (24px), `md` (32px default), `lg` (40px). Content: initials (first letter of each word, max 2 chars).

### Filter Chips

- `h-[28px]`, `px-[11px]`, `rounded-[7px]`
- `bg-background border border-border`
- `text-[12px] font-medium text-(--text-secondary)`
- Trailing chevron icon

### Input Fields

- `h-9` (36px), `px-3`, `rounded-lg`
- `bg-background border border-border`
- Focus: `border-primary`, no box shadow
- Placeholder: `text-muted-foreground`, Font: 13px 400

### A/B Variant Pill (AbPill)

- `<span>` with spark icon + "Variant A" or "Variant B" text
- `bg-(--ai-bg) text-(--ai-text)` (amber — AI-generated context)
- `title` attribute shows the variable name (e.g. "Subject line")
- Used in Contact panel header and table rows

### Tables

- Background: `bg-background`. No zebra striping.
- Row hover: `bg-(--surface-raised)`. Active row (panel open): `bg-sidebar`.
- Header row: `bg-card border-b border-border`.
- Column headers: `text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground`
- Row height: `h-12.5` (50px). `table-layout: fixed`. Grid columns set via inline `style`.

### Detail Panel

- Width: 400px on desktop (`w-[400px]`). Full-screen drawer on mobile.
- Height: 100% of viewport minus topbar. `overflow-y: auto` on scrollable body. Never shrinks to fit content.
- Background: `bg-card`, left border: `border-l border-border`
- Internal section labels: 10px 600 uppercase, 0.06em tracking, `text-muted-foreground`
- Sections separated by `border-b border-border`
- Panel header always visible, never scrolls: entity name + meta pills (left) + expand icon + close icon (right)
- Expand icon navigates to fullscreen route (`/[entity]/[id]`). Close icon closes panel.
- Layout-integrated on desktop (pushes table, does NOT overlay). Full-screen drawer on mobile.

### Decorative Circles (Brand Motif)

Absolutely positioned, top-right corner of major screens (Today, Auth, Onboarding, Settings, empty states):

- Large circle: 100–240px, `bg-primary opacity-[0.05]`
- Smaller ring: `border-[1.5px] border-primary opacity-[0.12]`
- Optional third: smaller solid circle
- `pointer-events-none`, purely decorative

### Sidebar Nav Active State

Active item: `bg-card border border-border rounded-lg`. No left accent bar — the card lift is the active indicator.
Inactive item: `border-transparent text-(--text-secondary) hover:text-foreground`.

---

## Layout & Spacing

- **Base unit:** 4px
- **Common spacings:** 4, 8, 12, 16, 24, 32, 48px (Tailwind scale)
- **Sidebar width:** `w-48` (196px, fixed, `shrink-0`)
- **Topbar height:** `h-13` (52px — defined as utility in `styles.css`)
- **Table row height:** 50px (`h-12.5`)
- **Detail panel:** `w-[400px]` on desktop. Full-screen drawer on mobile.
- **Max content width:** 1280px centred.

## Layout Patterns

- **Global desktop:** Fixed sidebar (196px) + fluid main. Sidebar has `border-r border-border`.
- **Table + panel:** `flex` row — table takes remaining space, panel is 400px. Panel pushes table, does not overlay.
- **Today desktop:** `grid` with `gridTemplateColumns: 1fr 320px`, gap 32px. Right column sticky.
- **Mobile:** Bottom tab bar (`MTabBar`) replaces sidebar for Today/Companies/Contacts/Jobs. Tables become card stacks. Detail panel becomes full-screen drawer. FAB (56px circle, `bg-primary`) on list screens.
- **`?panel=[id]` URL param** controls panel open state — panel state must always be derivable from the URL.

## Transitions

- Detail panel: `translate-x-full → translate-x-0`, 200ms ease-out
- Inline confirm row: fade + slight scale, 150ms ease
- SSO callback: 3-dot pulse, staggered 0.2s delays
- No other motion in the UI

---

## Icons

**`@phosphor-icons/react`** — the only icon library. Named exports like `GearSixIcon`, `MagnifyingGlassIcon`, `FunnelIcon`, `PlusIcon`, etc.

Props: `size` (number, default 16 inline / 18 for buttons), `weight` (`"regular"` | `"bold"` | `"fill"`, active states use `"bold"`).

Do NOT use inline SVG. Do NOT use Lucide or Tabler.

---

## Loading & Empty States

- **Loading:** Skeleton screens only — never spinners. Skeleton blocks: `bg-(--surface-raised)`. Tables show 5 skeleton rows.
- **Empty states (simple):** One-line label `text-(--text-secondary) text-[13px]` + relevant CTA button. No illustrations.
- **Empty states (key screens — Contacts, Companies):** 3 decorative circles + 72px entity icon circle + `text-[18px] font-semibold` h2 + description + two action buttons.
- **Error (form fields):** Inline below field in `text-destructive`.
- **Error (API failures):** Top-of-panel banner with `bg-(--danger-bg) border border-destructive`.
