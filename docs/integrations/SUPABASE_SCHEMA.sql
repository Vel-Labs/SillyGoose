-- Silly Goose Demo Supabase schema contract.
-- Apply this as a starting migration only after choosing a Supabase project.
-- The Next.js server owns writes through the existing WebAuthn/session routes.

create schema if not exists silly_goose_entertainment;

create table if not exists silly_goose_entertainment.demo_users (
  id text primary key,
  handle text not null unique,
  name text not null,
  verified_signer_type text not null default 'webauthn'
    check (verified_signer_type in ('webauthn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.passkey_credentials (
  id text primary key,
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  public_key jsonb not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_type text,
  backed_up boolean,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists silly_goose_entertainment.sessions (
  id text primary key,
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists silly_goose_entertainment.challenges (
  challenge_key text primary key,
  value text not null,
  user_id text references silly_goose_entertainment.demo_users(id) on delete cascade,
  purpose text not null check (purpose in ('register', 'login', 'admin', 'player2', 'wallet-proof')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists silly_goose_entertainment.user_profiles (
  user_id text primary key references silly_goose_entertainment.demo_users(id) on delete cascade,
  display_name text not null,
  favorite_goose text not null default 'jefe',
  avatar_goose text not null default 'jefe',
  title text,
  bio text,
  cosmetics jsonb not null default '{}'::jsonb,
  profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.game_rooms (
  id text primary key,
  game_key text not null default 'tictac' check (game_key in ('tictac')),
  board jsonb not null,
  turn text not null check (turn in ('X', 'O')),
  winner text check (winner in ('X', 'O', 'draw')),
  ai_mode boolean not null default false,
  rematch_votes text[] not null default '{}',
  completed_outcome_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.room_players (
  room_id text not null references silly_goose_entertainment.game_rooms(id) on delete cascade,
  mark text not null check (mark in ('X', 'O')),
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete restrict,
  goose text not null,
  verified_at timestamptz not null default now(),
  primary key (room_id, mark),
  unique (room_id, user_id)
);

create table if not exists silly_goose_entertainment.room_moves (
  id bigint generated always as identity primary key,
  room_id text not null references silly_goose_entertainment.game_rooms(id) on delete cascade,
  mark text not null check (mark in ('X', 'O')),
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete restrict,
  square_index integer not null check (square_index between 0 and 8),
  created_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.game_outcomes (
  id text primary key,
  room_id text not null references silly_goose_entertainment.game_rooms(id) on delete cascade,
  game_key text not null default 'tictac' check (game_key in ('tictac')),
  winner text not null check (winner in ('X', 'O', 'draw')),
  board jsonb not null,
  moves jsonb not null,
  players jsonb not null,
  ai_mode boolean not null default false,
  completed_at timestamptz not null default now()
);

alter table silly_goose_entertainment.game_rooms
  drop constraint if exists game_rooms_completed_outcome_id_fkey;

alter table silly_goose_entertainment.game_rooms
  add constraint game_rooms_completed_outcome_id_fkey
  foreign key (completed_outcome_id)
  references silly_goose_entertainment.game_outcomes(id)
  on delete set null;

create table if not exists silly_goose_entertainment.player_game_results (
  id bigint generated always as identity primary key,
  outcome_id text not null references silly_goose_entertainment.game_outcomes(id) on delete cascade,
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  opponent_user_id text references silly_goose_entertainment.demo_users(id) on delete set null,
  mark text not null check (mark in ('X', 'O')),
  result text not null check (result in ('win', 'loss', 'draw')),
  goose text not null,
  completed_at timestamptz not null,
  unique (outcome_id, user_id)
);

create table if not exists silly_goose_entertainment.player_stats (
  user_id text primary key references silly_goose_entertainment.demo_users(id) on delete cascade,
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  win_rate numeric(5, 2) not null default 0 check (win_rate >= 0 and win_rate <= 100),
  current_streak integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.player_rivals (
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  rival_user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  games_played integer not null default 0 check (games_played >= 0),
  user_wins integer not null default 0 check (user_wins >= 0),
  rival_wins integer not null default 0 check (rival_wins >= 0),
  draws integer not null default 0 check (draws >= 0),
  last_played_at timestamptz,
  primary key (user_id, rival_user_id),
  check (user_id <> rival_user_id)
);

create table if not exists silly_goose_entertainment.achievements (
  id text primary key,
  code text not null unique,
  name text not null,
  description text not null,
  category text not null default 'game',
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.user_achievements (
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  achievement_id text not null references silly_goose_entertainment.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unlock_context jsonb not null default '{}'::jsonb,
  primary key (user_id, achievement_id)
);

create table if not exists silly_goose_entertainment.linked_wallets (
  id text primary key,
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  chain text not null,
  address text not null,
  verified_at timestamptz not null default now(),
  last_signature_challenge text,
  status text not null default 'linked' check (status in ('linked', 'revoked')),
  created_at timestamptz not null default now(),
  unique (chain, address)
);

create table if not exists silly_goose_entertainment.signed_rivalry_challenges (
  id text primary key,
  nonce text not null unique,
  challenger_user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  rival_user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  room_id text references silly_goose_entertainment.game_rooms(id) on delete set null,
  game_key text not null default 'tictac' check (game_key in ('tictac')),
  linked_wallet_id text not null references silly_goose_entertainment.linked_wallets(id) on delete restrict,
  wallet_address text not null,
  signature text not null,
  typed_data jsonb not null default '{}'::jsonb,
  status text not null default 'signed' check (status in ('signed', 'accepted', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (challenger_user_id <> rival_user_id)
);

create table if not exists silly_goose_entertainment.bread_transactions (
  id text primary key,
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  counterparty_user_id text references silly_goose_entertainment.demo_users(id) on delete set null,
  amount integer not null check (amount <> 0),
  kind text not null check (kind in ('reward', 'gg_tip', 'friend_transfer', 'stake_lock', 'stake_release')),
  status text not null default 'posted' check (status in ('posted', 'locked', 'released')),
  memo text not null,
  challenge_id text references silly_goose_entertainment.signed_rivalry_challenges(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.verified_pings (
  id text primary key,
  from_user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  to_user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  message text not null,
  channel text not null default 'in_app' check (channel in ('in_app')),
  status text not null default 'sent' check (status in ('sent', 'read')),
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create table if not exists silly_goose_entertainment.dogfood_feedback (
  id text primary key,
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  route text not null,
  workflow text not null check (workflow in ('wallet-proof', 'signed-rivalry', 'bread-ledger', 'verified-ping', 'achievements', 'overall-dogfood')),
  expected text not null,
  actual text not null,
  severity text not null default 'note' check (severity in ('note', 'blocked', 'bug', 'polish')),
  service_mode text not null default 'local' check (service_mode in ('local', 'supabase', 'vercel')),
  viewport text not null,
  created_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.audit_entries (
  id text primary key,
  type text not null check (type in ('admin', 'game', 'auth', 'wallet')),
  message text not null,
  user_id text references silly_goose_entertainment.demo_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists passkey_credentials_user_id_idx
  on silly_goose_entertainment.passkey_credentials(user_id);
create index if not exists sessions_user_id_idx
  on silly_goose_entertainment.sessions(user_id);
create index if not exists challenges_user_id_purpose_idx
  on silly_goose_entertainment.challenges(user_id, purpose);
create index if not exists room_players_user_id_idx
  on silly_goose_entertainment.room_players(user_id);
create index if not exists room_moves_room_id_created_at_idx
  on silly_goose_entertainment.room_moves(room_id, created_at);
create index if not exists player_game_results_user_completed_idx
  on silly_goose_entertainment.player_game_results(user_id, completed_at desc);
create index if not exists player_rivals_user_games_idx
  on silly_goose_entertainment.player_rivals(user_id, games_played desc, last_played_at desc);
create index if not exists user_achievements_user_unlocked_idx
  on silly_goose_entertainment.user_achievements(user_id, unlocked_at desc);
create index if not exists linked_wallets_user_id_idx
  on silly_goose_entertainment.linked_wallets(user_id);
create index if not exists signed_rivalry_challenges_challenger_idx
  on silly_goose_entertainment.signed_rivalry_challenges(challenger_user_id, created_at desc);
create index if not exists signed_rivalry_challenges_rival_idx
  on silly_goose_entertainment.signed_rivalry_challenges(rival_user_id, created_at desc);
create index if not exists bread_transactions_user_created_idx
  on silly_goose_entertainment.bread_transactions(user_id, created_at desc);
create index if not exists verified_pings_recipient_created_idx
  on silly_goose_entertainment.verified_pings(to_user_id, created_at desc);
create index if not exists dogfood_feedback_user_created_idx
  on silly_goose_entertainment.dogfood_feedback(user_id, created_at desc);
create index if not exists audit_entries_created_at_idx
  on silly_goose_entertainment.audit_entries(created_at desc);

alter table silly_goose_entertainment.demo_users enable row level security;
alter table silly_goose_entertainment.passkey_credentials enable row level security;
alter table silly_goose_entertainment.sessions enable row level security;
alter table silly_goose_entertainment.challenges enable row level security;
alter table silly_goose_entertainment.user_profiles enable row level security;
alter table silly_goose_entertainment.game_rooms enable row level security;
alter table silly_goose_entertainment.room_players enable row level security;
alter table silly_goose_entertainment.room_moves enable row level security;
alter table silly_goose_entertainment.game_outcomes enable row level security;
alter table silly_goose_entertainment.player_game_results enable row level security;
alter table silly_goose_entertainment.player_stats enable row level security;
alter table silly_goose_entertainment.player_rivals enable row level security;
alter table silly_goose_entertainment.achievements enable row level security;
alter table silly_goose_entertainment.user_achievements enable row level security;
alter table silly_goose_entertainment.linked_wallets enable row level security;
alter table silly_goose_entertainment.signed_rivalry_challenges enable row level security;
alter table silly_goose_entertainment.bread_transactions enable row level security;
alter table silly_goose_entertainment.verified_pings enable row level security;
alter table silly_goose_entertainment.dogfood_feedback enable row level security;
alter table silly_goose_entertainment.audit_entries enable row level security;

grant usage on schema silly_goose_entertainment to service_role;
grant select, insert, update, delete on all tables in schema silly_goose_entertainment to service_role;
grant usage, select on all sequences in schema silly_goose_entertainment to service_role;

alter default privileges in schema silly_goose_entertainment
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema silly_goose_entertainment
  grant usage, select on sequences to service_role;

comment on schema silly_goose_entertainment is
  'Server-owned Silly Goose demo persistence. WebAuthn remains the identity boundary; wallet links are optional future scope.';
comment on table silly_goose_entertainment.passkey_credentials is
  'WebAuthn credential metadata. Never expose public_key, counters, challenges, or sessions directly to browser clients.';
comment on table silly_goose_entertainment.linked_wallets is
  'Optional wallet proof linkage. This does not replace the WebAuthn-rooted Silly Goose account.';
