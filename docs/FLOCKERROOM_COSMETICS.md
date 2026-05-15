# Flockerroom Cosmetics

## Purpose

Flockerroom is the staged cosmetic identity system for Silly Goose Entertainment. It lets an authenticated user eventually keep a three-slot Personal Flock of saved goose loadouts while the existing stock goose system remains intact.

The current app still uses the existing Goose Builder, active goose local state, game-room player goose field, and profile fallback. Flockerroom is additive and can be hidden with `NEXT_PUBLIC_ENABLE_FLOCKERROOM=false`.

## Loadout Model

A goose loadout is:

```text
Base Variant + Hat + Eye Accessory + Bill Item + Held Item + Neck / Chest Accessory + Ribbon / Badge + Aura + Title + Honkline
```

The schema also includes optional `composite_asset_path` and `headshot_asset_path` fields so full-body and avatar renders can be cached later.

## Schema Overview

The additive SQL contract is in `docs/integrations/SUPABASE_FLOCKERROOM_SCHEMA.sql`.

It adds:

- `cosmetic_items`: base variants and cosmetic layers.
- `goose_loadouts`: up to three saved loadout slots per `demo_users` account.
- `user_cosmetic_unlocks`: per-user inventory/unlocks.
- additive columns on existing `achievements`: reward cosmetic, icon, rule JSON, points, active flag.
- additive `progress_json` on existing `user_achievements`.

The existing project uses `silly_goose_entertainment.demo_users(id text)` rather than Supabase Auth UUIDs, so Flockerroom references that existing identity key. User-owned writes should go through trusted server routes until a real Supabase Auth mapping exists.

## Asset Folders

Use the `goose-assets` storage bucket with these folders:

```text
goose-assets/
  bases/
  hats/
  eyes/
  bill-items/
  held-items/
  neck/
  badges/
  ribbons/
  auras/
  frames/
  backgrounds/
  composites/user-loadouts/
  headshots/user-loadouts/
```

The app expects final consumed assets to already be transparent. Source art may come from a solid background pipeline, but background removal should happen before upload.

## Layered Preview Renderer

The first client-side layered renderer lives in:

- `components/goose-layered-preview.tsx`
- `lib/goose-layer-resolver.ts`
- `lib/goose-layer-positions.ts`

It is currently used only inside `/flockerroom`. Dashboard, Profile, game rooms, and the existing Goose Builder continue to use the old stock goose system until the loadout bridge is explicitly enabled later.

### Standalone Assets Vs Bust Previews

The sprite processor emits two cosmetic asset forms:

```text
/goose-assets/hats/crown.png
/goose-assets/hats/crown-bust-preview.png
```

Use standalone assets such as `crown.png` for actual composition. Use `*-bust-preview.png` only for inventory thumbnails, picker cards, QA contact sheets, or static preview examples. Do not stack bust-preview assets into generated geese because those files already include a sample goose bust.

Base variants are different. They provide separate composition layers:

```text
/goose-assets/bases/classic/full.png
/goose-assets/bases/classic/bust.png
/goose-assets/bases/classic/wing-hold.png
/goose-assets/bases/classic/bill.png
```

`full.png` is the full-body base, `bust.png` is the profile base, `wing-hold.png` is drawn above held items, and `bill.png` is drawn at the top to cover eyewear or bill-item edges.

### Asset QA

Generate and audit local assets with:

```bash
npm run assets:process-goose-sprites
npm run assets:audit-goose-sprites
```

The audit validates expected files, dimensions, alpha, transparent corners, visible crop bounds, magenta remnants, and eye-accessory fragmentation heuristics. It writes `public/goose-assets/manifests/asset-audit-report.json`.

The eyes source sheet uses a clean 3x3 standalone grid plus a 3x3 bust-preview grid, but some item art crosses nominal grid gutters. `scripts/goose-sprite-config.ts` therefore uses explicit standalone eye crop overrides so picker thumbnails do not include neighboring item fragments.

### Semantic Layer Kinds

The renderer resolves catalog categories into semantic layer kinds before it renders. This keeps mouth-held items, hand-held props, masks, and decorative backdrops from being treated as interchangeable full-size overlays.

```text
base -> base_body
hat -> head_wear
eyes -> eye_wear
bill_item -> mouth_item
held_item -> hand_prop
neck -> neck_wear
aura -> aura_backdrop
base wing-hold -> holding_wing
base bill -> bill_mask
```

`asset_path` is the standalone layer candidate used by `GooseLayeredPreview`. `preview_path` is for picker/UI previews only. `headshot_path` is a profile/bust display candidate and should not be stacked as a cosmetic layer.

### Render Order

Full-body mode:

```text
aura_backdrop
base_body
neck_wear
head_wear
eye_wear
mouth_item
hand_prop
holding_wing
bill_mask
```

Bust/profile mode:

```text
aura_backdrop
base_body
neck_wear
head_wear
eye_wear
mouth_item
bill_mask
```

Held items are currently full-body only. They are intentionally omitted from bust/profile composition until the anchor rules are tuned enough to avoid clutter.

The bill mask is conditional/configurable. By default it renders only when eye wear or a mouth item is selected because it hides awkward edges around the beak. In the Flockerroom dev controls, it can be set to auto, forced, or off to inspect whether a specific item should use a different anchor instead of relying on the bill layer.

The holding wing is rendered only in full-body mode, after a hand prop has been selected. This keeps the object behind the wing so the grip reads as intentional rather than pasted over the body. It can also be toggled in dev controls for anchor tuning.

### Position Config

`lib/goose-anchors.ts` defines canonical percentage-based slots for each mode:

```text
aura
base
head
eyes
bill
mouth
neck
hand
wing
```

`lib/goose-layer-positions.ts` maps semantic layer kinds to those slots, then applies small per-item anchor offsets. This keeps tuning relative to stable goose anatomy instead of raw whole-preview coordinates.

Layer-to-anchor mapping:

```text
aura_backdrop -> aura
base_body -> base
head_wear -> head
eye_wear -> eyes
mouth_item -> mouth
neck_wear -> neck
hand_prop -> hand
holding_wing -> wing
bill_mask -> bill
```

Tuning strategy:

- auras stay behind the base and use reduced opacity so they frame rather than cover the goose
- bill items stay near the beak and are smaller than the first-pass proof assets
- held items sit lower/right of the torso and render below `wing-hold`
- neck and chest items are reduced so they read as clothing instead of replacing the torso
- per-item offsets use semantic keys such as `aura_backdrop:smoke`, `hand_prop:mace`, or `mouth_item:scroll`
- shared defaults remain conservative so new generated items are usable before hand tuning

Debug mode in `/flockerroom` shows layer order, selected base, x/y/width/opacity/z-index, and optional skipped layers. It is visible in development or when `NEXT_PUBLIC_DEBUG_GOOSE_LAYERS=true`. It also includes repeatable local preview presets: Clean, Royal, Cyber, Zombie, and Chaos Test. These presets do not grant unlocks or mutate Supabase.

### Visual Calibration

The developer-only calibrator lives at:

```text
/dev/goose-calibrator
```

It is available in development, or when `NEXT_PUBLIC_DEBUG_GOOSE_LAYERS=true`. It is not linked in production navigation.

The calibrator reuses `GooseLayeredPreview`, `resolveGooseLayers`, the starter catalog, and the same debug presets as `/flockerroom`. It can:

- switch between full and bust mode
- switch Clean, Royal, Cyber, Zombie, and Chaos Test presets
- select a resolved layer by semantic kind and anchor slot
- edit x, y, width, height, rotate, opacity, and z-index
- hide and show individual layers
- use arrow-key nudging, bracket z-index shortcuts, plus/minus width shortcuts, and `r` to reset the selected layer
- copy JSON or TypeScript export text
- import previously exported calibration JSON
- surface asset audit warnings for the selected layer

Exports are temporary calibration data. The browser does not write source config files. After a useful calibration pass, copy the exported values and apply them manually to `lib/goose-layer-positions.ts` or `lib/goose-anchors.ts`.

Current limitations:

- anchor positions are approximate and need tuning against the top used cosmetics
- the renderer uses absolutely positioned image layers, not canvas
- no cached composite PNGs or headshots are generated yet
- legacy catalog placeholders without generated PNGs are skipped in the renderer
- Supabase asset upload and active-loadout bridging are still future steps

Next step: bridge the active Flockerroom loadout into Profile behind `NEXT_PUBLIC_ENABLE_FLOCKERROOM`, while keeping dashboard and gameplay on the old stock goose system until profile rendering looks stable.

## Starter Catalog

The seedable TypeScript catalog lives in `lib/goose-cosmetics.ts`:

- `starterCosmeticCatalog`
- `starterAchievementCatalog`

Those arrays provide stable slugs, categories, rarity, tags, unlock rules, and placeholder storage paths. A later seeding script can upsert the arrays into `cosmetic_items` and `achievements`.

Generate seed SQL without applying it:

```bash
npm run seed:flockerroom:sql > /tmp/flockerroom-seed.sql
```

Apply only after `SUPABASE_FLOCKERROOM_SCHEMA.sql` is present in the target database:

```bash
supabase db query --linked --file /tmp/flockerroom-seed.sql
```

## Unlock Model

Default and legacy cosmetics can appear unlocked immediately. Achievement, streak, event, purchase, and admin-grant cosmetics are represented now but should be granted by trusted server logic.

The current `/flockerroom` preview intentionally does not let browser users grant themselves locked cosmetics. It shows locked cosmetics as unavailable until the inventory adapter exists.

## Rollout Plan

1. Keep existing Goose Builder and active goose selection as the live gameplay/profile source.
2. Add Flockerroom as a safe preview route.
3. Seed `cosmetic_items` and achievements from the TypeScript catalogs.
4. Add server routes to create three starter loadout slots per authenticated user.
5. Prefer an active `goose_loadouts` row only when `NEXT_PUBLIC_ENABLE_FLOCKERROOM=true` and a loadout exists.
6. Map old selected geese to preset loadouts.
7. Flip dashboard/profile/game cards to the loadout system after asset and QA verification.
8. Remove old goose selection code only after the new path has receipts.

## Persistence Behavior

The Flockerroom UI calls local Next.js API routes first:

- `GET /api/flockerroom`
- `PATCH /api/flockerroom/loadout`
- `POST /api/flockerroom/loadout`

Those server routes use `lib/flockerroom-repository.ts`. If `DEMO_SUPABASE_ENABLED=true` or `DEMO_STORE_ADAPTER=supabase` and server-side Supabase environment values are present, the repository attempts Supabase REST calls against the configured `SUPABASE_SCHEMA`.

If Supabase is unavailable, credentials are missing, or Flockerroom tables have not been applied, the repository returns fallback data instead of throwing into the UI.

Fallback rules:

- catalog: `starterCosmeticCatalog`
- loadouts: three default local slots
- unlocks: default and legacy cosmetics only
- save: browser localStorage preview remains authoritative for the current browser
- set active: browser localStorage preview remains authoritative for the current browser

The UI displays quiet status text such as `Synced to Flockerroom`, `Using local preview mode`, or `Supabase unavailable, preview saved locally`.

The old stock goose system remains untouched. Dashboard, Profile, game rooms, and Goose Builder still use the existing active goose behavior until the loadout bridge is explicitly flipped later.

## Current Limitations

- `/flockerroom` stores preview edits in browser localStorage.
- Supabase persistence is optional and depends on `SUPABASE_FLOCKERROOM_SCHEMA.sql` plus seeded catalog rows.
- No image compositing or headshot generation exists yet.
- Missing asset paths are treated as future storage references and do not block rendering.
- Existing profile/dashboard/game surfaces still use the old active goose fallback.

## Applying SQL

Do not reset the database. Apply `docs/integrations/SUPABASE_FLOCKERROOM_SCHEMA.sql` only after the base schema contract is present:

```bash
supabase db query --linked --file docs/integrations/SUPABASE_FLOCKERROOM_SCHEMA.sql
```

Only run that command against a local/dev Supabase project or an explicitly approved linked project. This repo may be linked to a real hosted project, so check `.env.local`, `supabase/.temp/project-ref`, and the Supabase dashboard before applying.

After applying, generate and inspect the seed SQL:

```bash
npm run seed:flockerroom:sql > /tmp/flockerroom-seed.sql
```

Then seed only the same approved local/dev project:

```bash
supabase db query --linked --file /tmp/flockerroom-seed.sql
```

After applying and seeding, use server-side env only:

```text
DEMO_SUPABASE_ENABLED=true
DEMO_STORE_ADAPTER=supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_SCHEMA=silly_goose_entertainment
NEXT_PUBLIC_ENABLE_FLOCKERROOM=true
```

Do not put `SUPABASE_SECRET_KEY` in any `NEXT_PUBLIC_*` variable.

## Atomic Active Loadout RPC

`SUPABASE_FLOCKERROOM_SCHEMA.sql` defines `silly_goose_entertainment.set_active_goose_loadout(p_user_id text, p_loadout_id uuid)`.

The function:

- verifies the target loadout belongs to the supplied demo user id
- sets all of that user’s loadouts inactive
- activates the selected loadout
- returns the selected `goose_loadouts` row

It is `security invoker` and is intended for server-side service-role calls from `lib/flockerroom-repository.ts`. The repository attempts this RPC first and falls back to the older two-update flow only if the RPC is unavailable.

After applying, verify RLS and grants before any browser-side Supabase usage. The current recommended boundary is still server-side persistence only.
