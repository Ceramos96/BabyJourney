# Little Sprout — Claude Code Project Instructions

Read this file completely before touching any code. It is the single source of truth for every decision in this project.

---

## Project Overview

**App name:** Little Sprout
**Baby:** Minh Khang (nickname: Khang) — DoB 26 Oct 2025, male
**Family:** Nhà Trần — Owner: Ba (Kha Trần), Ho Chi Minh City, Vietnam
**Platforms:** Web (Vercel) + Android + iOS (Capacitor, same codebase)
**Languages:** English (default) + Vietnamese (toggle)
**Stack:** React 18 + Vite + Tailwind CSS + React Router + Capacitor + Supabase

All personal values live in `src/config/app.config.js`. Never hardcode names, dates, or family data inside components.

---

## Architecture

```
src/
  config/
    app.config.js       ← single source of truth for all personal values
    navigation.js       ← screen + tab structure
  styles/
    tokens.css          ← all design tokens (extracted from mockup)
    globals.css         ← resets, base styles, Tailwind imports
  locales/
    en.json             ← English strings
    vi.json             ← Vietnamese strings
  components/
    ui/                 ← Button, Card, Input, Chip, Segmented, Modal, Toast
    layout/             ← AppShell, Sidebar, BottomTabBar, TopBar, FAB
    charts/             ← GrowthChart, WeeklyBarChart, SparkLine
    illustrations/      ← SproutIllo, LeafIllo, AcornIllo (SVG components)
  screens/
    Home/               ← Dashboard + Today timeline combined (Option A)
    Growth/
    Journal/            ← Photo journal + Milestones sub-tabs
    Health/             ← Notes + Allergies + Food tried + Vaccinations
    Family/             ← Member management (not in tab bar)
    QuickLog/           ← Bottom sheet (mobile) / Modal (web)
    Auth/               ← Login, invite acceptance
  hooks/
    useSupabase.js
    useImageCompress.js
    useHaptics.js
    usePlatform.js
  lib/
    supabase.js
    compress.js
    dates.js            ← age calculator, timezone-aware formatting
```

---

## Non-Negotiable Rules

1. **No hardcoded personal data.** Every name, date, or family value comes from `src/config/app.config.js`. Lint rule enforces this — any `.jsx` or `.js` file in `src/` containing the string "Minh Khang" or "Trần" is a build error.

2. **i18n on every string.** Use `useTranslation()` from react-i18next everywhere. No raw English or Vietnamese strings in JSX. Add both EN and VI keys to locale files before marking any screen complete.

3. **Photo compression before upload.** Every image passes through `src/lib/compress.js` before reaching Supabase Storage. Max 800KB / 1920px width. Browser-canvas method, no extra library.

4. **Row Level Security enforced at database level.** Never rely on UI-only permission checks. Every Supabase query is protected by RLS policies. Three roles: `owner` · `family` · `viewer`.

5. **Timezone.** All timestamps stored in UTC. All display formatting uses `Asia/Ho_Chi_Minh` timezone from `appConfig.family.timezone`.

6. **Tokens from CSS.** All colors, shadows, and radii come from `src/styles/tokens.css` CSS variables. Never hardcode hex values in components.

7. **Safe area insets on native.** All screens that have fixed top or bottom bars must use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` padding. Handled in `AppShell`.

---

## Design System

**Source of truth:** `src/styles/tokens.css` (extracted from Claude Design mockup)

### Typography
- Display / headings: **Fraunces** — `font-optical-sizing: auto; font-variation-settings: "opsz" 48, "SOFT" 50`
- Body / UI: **Nunito**
- Google Fonts import string (add to `index.html`):
  ```
  https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&display=swap
  ```

### Component Specs (match mockup exactly)

**Primary button** `.ls-btn-primary`
- Background: `--sage-700` · Color: white · Border-radius: 999px
- Height: 40px (inline) / 48px (`.lg` modifier in modals)
- Font: Nunito 700 14px · Padding: 0 18px
- Hover: `#5d6b44`

**Ghost button** `.ls-btn-ghost`
- Background: transparent · Color: `--sage-700` · Border-radius: 999px
- Height: 36px · Padding: 0 14px · Font: Nunito 700 14px
- Hover: `--sage-100` background

**Card** `.ls-card`
- Background: `#FBF8F2` (linen-50) · Border: 1px solid `--card-border` · Border-radius: 20px

**Input** `.ls-input`
- Height: 52px · Background: `--linen-100` · Border: 1px solid `--linen-200` · Border-radius: 14px
- Padding: 0 16px · Font-size: 14px
- Focus: border-color `--sage-500`, background `#FBF8F2`
- Placeholder: `--ink-400`
- Label always above input — never floating inside

**Chip** `.ls-chip`
- Background: `--sage-100` · Color: `--sage-700` · Padding: 4px 10px
- Border-radius: 8px · Font: Nunito 700 12px
- Allergy chips: background `--clay`, color white

**Segmented control** `.ls-seg`
- Container: `--linen-100` bg, 1px `--linen-200` border, 14px radius, 4px padding
- Active button: white bg, `--sage-700` text, subtle shadow
- Inactive: `--ink-600` text

### Motion
- Easing: `cubic-bezier(0.32, 0.72, 0, 1)` on all transitions
- State changes: 150ms · Layout shifts: 350ms · Celebrations: 600ms
- Sprout breathing: `scale(1.00) → scale(1.02) → scale(1.00)`, 6s ease-in-out infinite
- Respect `prefers-reduced-motion`: disable all animations, instant state changes

### Illustrations (SVG components in `src/components/illustrations/`)
- Style: single-weight line, `--sage-700` stroke, no fill, Herbarium field guide aesthetic
- SproutIllo: main hero — 3 unfurling leaves, root system
- LeafIllo: timeline dividers, note bullets
- AcornIllo: milestone cards
- All illustrations are `aria-hidden="true"`

---

## Navigation Structure

### Mobile (Capacitor — bottom tab bar, 5 slots)

```
[ Home ]  [ Growth ]  [ ⊕ FAB ]  [ Journal ]  [ Health ]
```

- **Home** — Dashboard + today's timeline (combined, Option A). Dashboard hero is above-fold; scrolling reveals the full chronological event log.
- **Growth** — Weight / Height / Head charts + history + inline add form
- **⊕ FAB** (center, 56px, sage-700) — Opens Quick Log bottom sheet
- **Journal** — Sub-tabs: Photos | Milestones
- **Health** — Sub-tabs: Notes | Allergies & Food | Vaccinations
- **Family** — NOT in tab bar. Accessible via avatar icon in top-right of Home screen header.

Tab bar: 83px tall, linen-50 background, 1px top border linen-200. Active tab: filled icon + sage-700 label + sage-100 pill background. Inactive: outline icon + ink-400 label. Safe area inset at bottom.

### Web (sidebar, 240px fixed left)

Sidebar items (top to bottom):
1. Baby avatar (48px) + "Minh Khang" Fraunces 16px + age Nunito 13px ink-400
2. Nav items: Home · Growth · Journal · Health & Notes
3. Divider
4. Family (at bottom of nav)
5. Bottom strip: EN/VI toggle · User avatar · Settings

Floating Quick Log button: fixed bottom-right, 56px, sage-700, `+` icon, `var(--shadow-lg)`. Opens a centered modal.

Top bar (main content area): page title Fraunces 24px + date ink-400 right-aligned.

---

## Screen Inventory

### Screen 1 — Home (combines Dashboard + Today timeline)

**Route:** `/` or `/home`
**Mobile tab:** Home (active)

**Above the fold — Dashboard hero:**
- Status strip: contextual greeting ("Good morning, Ba 👋") + date, right side: EN/VI toggle
- Hero block: sage-100 radial gradient background, SproutIllo (breathing animation) centered right, left side: baby name Fraunces 28px + age "5 months · 28 days old" (age calculated live from appConfig.baby.dateOfBirth) + "Log something" primary button
- Vital stats row: 3 chips — Feeds today · Total sleep · Last diaper (data from today's Supabase logs)
- Smart suggestion card: context-aware (e.g. "Time for a feed?" if last feed > 2h ago) — tapping pre-fills Quick Log
- This Week mini bar chart: 7 columns Mon–Sun, feed volume per day, sage-500 bars, today's bar sage-700
- Coming Soon: next milestone preview card

**Below the fold — Today timeline (full log):**
- Section header: "TODAY" micro-caps + today's date
- Vertical timeline: time labels left rail (Fraunces tabular), event cards right
- Events grouped: Morning / Afternoon / Evening / Night — LeafIllo botanical divider between groups
- Each card: icon + type label + key metric + timestamp. Tap to expand (full detail + edit)
- Empty state: SproutIllo + "No entries yet. Tap + to log Khang's first moment."

**Supabase reads:** `daily_logs` (today, ordered by time) · `babies` (current baby profile)

---

### Screen 2 — Growth

**Route:** `/growth`
**Mobile tab:** Growth

- Page header: "Khang's Growth" + current stat row (weight · height · head)
- Tab bar: Weight | Height | Head Circumference
- Chart: soft-curve line, no grid lines, WHO percentile band as translucent sage-100 shape, sage-700 curve 2.5px, endpoint dots, tap/hover reveals Fraunces-numbered tooltip
- Inline add form (not a modal): Date · measurement value · Save button — compact row below chart
- History table: Date · Weight · Height · Head · Percentile — alternating linen-50/linen-100 rows

**Supabase reads/writes:** `growth_records`

---

### Screen 3 — Journal (Photos + Milestones)

**Route:** `/journal`
**Mobile tab:** Journal

Sub-tabs: **Photos** | **Milestones**

**Photos sub-tab:**
- Month/year selector (prev · "April 2026" Fraunces · next)
- "Upload photo" primary button (triggers compress → Supabase Storage upload)
- 3-column masonry grid — photo tiles with date overlay on hover
- Lightbox on tap: photo + editable caption + tags + Share + Delete
- Google Drive link embed: paste Drive URL → extract FILE_ID → display via `/thumbnail?id=FILE_ID&sz=w800` with lazy load + fallback error message

**Milestones sub-tab:**
- Grid of milestone cards (3 col web / 2 col mobile)
- Each card: AcornIllo + milestone name + date achieved or "Not yet" ink-400
- Completed: sage-100 bg + peach checkmark. Upcoming: linen-100 bg
- Tapping a completed milestone shows the celebration bloom (SproutIllo + peach radial glow)
- "+ Log a milestone" primary button → modal/sheet with milestone picker + date + note

**Milestone list:** First smile · Rolled over · First laugh · Sat unaided · First solid food · First word · Crawled · Pulled to stand · First steps

**Supabase reads/writes:** `photos` · `milestones`

---

### Screen 4 — Health & Notes

**Route:** `/health`
**Mobile tab:** Health

Sub-tabs: **Notes** | **Allergies & Food** | **Vaccinations**

**Notes sub-tab:**
- Vertical feed of note cards: date micro-caps + body text + tag chips
- "+ Add note" ghost button at bottom → inline form: text area + tags + Save
- Tags: free text + preset options (Allergy · Vaccination · Observation · Medication)

**Allergies & Food sub-tab:**
- Allergies watchlist at top: clay-colored chips with severity dots (mild/moderate/severe). "+ Track allergen" text link
- Food tried: sage-100 chip cloud. "+ Add food" text link
- Severity dots: mild = 1 dot, moderate = 2 dots, severe = 3 dots (never stars)

**Vaccinations sub-tab:**
- Checklist: name + due date + done/upcoming status
- Upcoming items: linen-100, unchecked. Done: sage-100, checked sage-700
- "+ Add vaccination" ghost button

**Supabase reads/writes:** `notes` · `allergens` · `foods_tried` · `vaccinations`

---

### Screen 5 — Family (Member Management)

**Route:** `/family`
**Mobile access:** Avatar icon top-right in Home header
**Web access:** Bottom of sidebar nav

- Page header: "Nhà Trần" Fraunces 28px + subtitle Nunito ink-600
- Members list: avatar (initials circle) + name + role badge (Owner/Family/Viewer) + last active
- Each row: "···" overflow → Change role | Remove
- Role badges: Owner = sage-700 fill white text; Family = sage-100 fill sage-700 text; Viewer = linen-200 fill ink-600 text
- "+ Invite someone" full-width dashed button (sage-300 border, 20px radius, 52px)
- Invite form: email input + Role segmented (Family / Viewer) + "Send Invite" button
- Pending invites section: email + role + "Resend" + "Cancel" per row

**Supabase reads/writes:** `user_profiles` (roles) · Supabase Auth invitations

---

### Quick Log (Sheet / Modal)

**Mobile:** Bottom sheet, slides up from bottom
**Web:** Centered modal, 480px wide, 20px radius, `--shadow-lg`

**Step 1 — Type selector:** 4 large buttons (80px tall each): Feed · Nap · Diaper · Note
**Step 2 — Detail form** (opens after type selection):
- Feed: Time (pre-filled now) · Amount (number + ml unit) · Type segmented (Breast / Formula / Solids) · Notes
- Nap: Start time · End time (or Duration) · Quality (segmented: Poor / Good / Great) · Notes
- Diaper: Time · Type (Wet / Dirty / Both) · Notes
- Note: Time · Text area · Tags
- Footer: Cancel (ghost) + Save (primary lg) buttons

All fields: ls-input style, labels above, 52px height.

**Supabase writes:** `daily_logs`

---

## Supabase Schema (Claude Code will create these tables)

```sql
-- Enable RLS on all tables

babies (
  id uuid primary key,
  owner_id uuid references auth.users,
  first_name text,
  full_name text,
  nickname text,
  date_of_birth date,
  gender text,
  blood_type text,
  avatar_url text,
  created_at timestamptz default now()
)

user_profiles (
  id uuid primary key references auth.users,
  baby_id uuid references babies,
  role text check (role in ('owner','family','viewer')),
  display_name text,
  avatar_url text,
  last_active_at timestamptz
)

daily_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  logged_by uuid references auth.users,
  type text check (type in ('feed','nap','diaper','note')),
  logged_at timestamptz not null,
  data jsonb,         -- flexible: {amount, unit, feed_type, duration, diaper_type, text, tags}
  created_at timestamptz default now()
)

growth_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  recorded_by uuid references auth.users,
  recorded_at date not null,
  weight_kg numeric(5,3),
  height_cm numeric(5,1),
  head_cm numeric(5,1),
  notes text,
  created_at timestamptz default now()
)

photos (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  uploaded_by uuid references auth.users,
  storage_path text,           -- Supabase Storage path
  drive_url text,              -- optional Google Drive embed URL
  caption text,
  tags text[],
  taken_at timestamptz,
  created_at timestamptz default now()
)

milestones (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  logged_by uuid references auth.users,
  type text,                   -- 'first_smile', 'rolled_over', etc.
  achieved_at date,
  note text,
  photo_id uuid references photos,
  created_at timestamptz default now()
)

notes (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  written_by uuid references auth.users,
  body text not null,
  tags text[],
  created_at timestamptz default now()
)

allergens (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  name text not null,
  severity text check (severity in ('mild','moderate','severe')),
  first_reaction_at date,
  notes text,
  created_at timestamptz default now()
)

foods_tried (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  name text not null,
  first_tried_at date,
  reaction text,
  created_at timestamptz default now()
)

vaccinations (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies,
  name text not null,
  due_at date,
  done_at date,
  notes text,
  created_at timestamptz default now()
)
```

---

## Development Workflow

### Starting a session
```
cd little-sprout
claude
```

### Day 1 foundation order (do not skip steps)
1. Scaffold: `npm create vite@latest . -- --template react`
2. Install: `npm install @supabase/supabase-js react-router-dom react-i18next i18next @capacitor/core @capacitor/cli`
3. Install Capacitor plugins: `@capacitor/android @capacitor/ios @capacitor/camera @capacitor/haptics @capacitor/push-notifications @capacitor/status-bar @capacitor/splash-screen`
4. Copy `src/styles/tokens.css` and `src/config/app.config.js` into place
5. Copy `src/locales/en.json` and `src/locales/vi.json` into place
6. Set up `src/lib/supabase.js` with env variables
7. Set up i18next with both locale files, localStorage persistence
8. Set up React Router with all routes
9. Set up Supabase Auth (invite-only — disable public sign-up in Supabase dashboard)
10. Create all Supabase tables + RLS policies
11. Set up `src/lib/compress.js` (browser-canvas compression)
12. Set up `AppShell` with platform detection (web vs native)
13. Confirm all foundations working → only then build screens

### Build order for screens
1. AppShell + BottomTabBar + Sidebar (layout foundations)
2. Auth / Login screen
3. Home screen (dashboard section first, timeline section second)
4. Quick Log sheet/modal
5. Growth screen
6. Journal screen (Photos sub-tab first, Milestones second)
7. Health screen (Notes first, then Allergies, then Vaccinations)
8. Family screen
9. PWA manifest + service worker
10. Capacitor Android build
11. Codemagic iOS build pipeline

### Saving progress
After each screen: "Save to GitHub with message 'Add [screen name] screen'"

### Deploying
"Deploy the current version to Vercel production."

---

## Environment Variables (.env — never commit this file)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
```

Add all three to Vercel Environment Variables dashboard before first deploy.

---

## Supabase Storage Structure

```
babies/{baby_id}/timeline/{year}/{month}/{filename}
babies/{baby_id}/milestones/{filename}
babies/{baby_id}/avatar/{filename}
```

All uploads: compress to max 800KB / 1920px before upload. Show file size after compression.
