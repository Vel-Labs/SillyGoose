# Supabase Integration

Supabase should be connected to this demo as a persistence adapter first, not as the primary identity provider.

The live demo proof is still Ledger Security Key-compatible WebAuthn through SimpleWebAuthn. Supabase can make accounts, profiles, passkey metadata, sessions, challenges, rooms, moves, outcomes, stats, rivals, achievements, and audit entries durable across restarts, but the application should continue to verify game actions through the server routes and the existing WebAuthn session boundary.

The copyable schema contract lives in `SUPABASE_SCHEMA.sql`. Treat it as the database source of truth when wiring Supabase.

## Recommended Connection Shape

1. Keep `DEMO_STORE_ADAPTER=local` as the default for rehearsal and offline screen share.
2. Add `DEMO_STORE_ADAPTER=supabase` only after the Supabase schema and adapter are implemented.
3. Use Supabase from Next.js Route Handlers and Server Components for the first pass.
4. Store privileged Supabase keys only in server-only environment variables.
5. Expose `NEXT_PUBLIC_SUPABASE_*` only when adding an intentional browser feature such as Realtime spectators or public read-only state.

This preserves the current trust boundary: browser WebAuthn proves the player, local HTTP-only session cookies bind the player to the app, and server routes decide whether that player can create a room, join as Player Two, or make a move.

## Tables To Model

Start with the current `data/demo-store.json` shape and map it directly:

- `demo_users`: `id`, `handle`, `name`, `verified_signer_type`, `created_at`, `updated_at`
- `passkey_credentials`: `id`, `user_id`, `public_key`, `counter`, `transports`, `device_type`, `backed_up`, `created_at`, `last_used_at`
- `sessions`: `id`, `user_id`, `created_at`, `expires_at`
- `challenges`: `challenge_key`, `value`, `user_id`, `purpose`, `created_at`, `expires_at`
- `user_profiles`: `user_id`, `display_name`, `favorite_goose`, `avatar_goose`, `title`, `bio`, `cosmetics`, `profile_visibility`, `created_at`, `updated_at`
- `game_rooms`: `id`, `game_key`, `board`, `turn`, `winner`, `ai_mode`, `completed_outcome_id`, `created_at`, `updated_at`
- `room_players`: `room_id`, `mark`, `user_id`, `goose`, `verified_at`
- `room_moves`: `room_id`, `mark`, `square_index`, `created_at`
- `game_outcomes`: `id`, `room_id`, `game_key`, `winner`, `board`, `moves`, `players`, `ai_mode`, `completed_at`
- `player_game_results`: `outcome_id`, `user_id`, `opponent_user_id`, `mark`, `result`, `goose`, `completed_at`
- `player_stats`: `user_id`, `games_played`, `wins`, `losses`, `draws`, `win_rate`, `current_streak`, `updated_at`
- `player_rivals`: `user_id`, `rival_user_id`, `games_played`, `user_wins`, `rival_wins`, `draws`, `last_played_at`
- `achievements`: `id`, `code`, `name`, `description`, `category`, `criteria`, `created_at`
- `user_achievements`: `user_id`, `achievement_id`, `unlocked_at`, `unlock_context`
- `linked_wallets`: `id`, `user_id`, `chain`, `address`, `verified_at`, `last_signature_challenge`, `status`, `created_at`
- `audit_entries`: `id`, `type`, `message`, `user_id`, `created_at`

Use normal relational columns for identities and ownership, and JSON only where the game state is naturally compact, such as the nine-cell board snapshot or the append-only outcome payload used for later AI training/evaluation.

### Product Model

`Register` creates a Silly Goose account. It does not create a wallet account.

The account is rooted in `demo_users`, verified by one or more `passkey_credentials`, and rendered through `user_profiles`. Game history flows from `game_outcomes` into `player_game_results`, then into the cached `player_stats` and `player_rivals` summaries. Achievements are product metadata in `achievements` and user unlock records in `user_achievements`.

`linked_wallets` is intentionally future scope. It allows an account to attach a wallet signature later without replacing the WebAuthn-rooted profile, stats, rivals, or achievements.

## Security Rules

Enable RLS on every table in any exposed schema.

For the first adapter pass, do not grant direct `anon` or `authenticated` table access. Let the Next.js server use `SUPABASE_SECRET_KEY` and enforce authorization in the existing route handlers. That is acceptable here because the app already has a custom WebAuthn identity/session system and the secret key never belongs in browser code.

If the browser later reads Supabase directly, add narrow RLS policies for the exact read surface. For example, a spectator view can expose room state without exposing passkey credentials, challenges, session rows, or secret-bearing audit data.

Never put `SUPABASE_SECRET_KEY`, `service_role`, or `sb_secret_*` values in `NEXT_PUBLIC_*` variables.

Supabase's 2026 Data API behavior is moving toward explicit table grants for new tables. Keep grants and RLS together in migrations: `grant` controls whether an API role can touch an object at all; RLS controls which rows that granted role can access.

## Environment

Use `.env.example` as the fill-in contract. The minimum server-side Supabase values are:

```text
DEMO_SUPABASE_ENABLED=true
DEMO_STORE_ADAPTER=supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_SCHEMA=silly_goose_entertainment
SUPABASE_SECRET_KEY=sb_secret_...
```

For local migrations or direct SQL, also fill:

```text
SUPABASE_DB_URL=postgresql://...
```

Only fill these browser values when a client-side Supabase feature exists:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_BROWSER_ENABLED=true
```

## Implementation Path

1. Add `@supabase/supabase-js` for a server-side database client. Add `@supabase/ssr` only if Supabase Auth/cookie helpers become part of the app; the current WebAuthn flow does not require Supabase Auth.
2. Create a `lib/store` adapter boundary with the existing JSON implementation and a Supabase implementation behind the same methods.
3. Move `lib/auth/store.ts` callers to the adapter boundary without changing route behavior.
4. Create SQL migrations for the tables above, with RLS enabled from the start.
5. Run the existing room and WebAuthn route checks against both `local` and `supabase` adapter modes before changing the demo default.

Supabase's current Next.js guidance uses `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser-safe clients, and the newer `sb_publishable_*` / `sb_secret_*` key family is preferred over legacy `anon` / `service_role` keys. The secret key is server-only and bypasses RLS, so it must be paired with application-level authorization checks.
