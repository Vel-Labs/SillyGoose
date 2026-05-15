-- Silly Goose Flockerroom cosmetic/loadout schema contract.
-- Apply after docs/integrations/SUPABASE_SCHEMA.sql.
-- This is additive only: it does not replace the current selected-goose fields or game/profile tables.
-- The current app uses server-owned WebAuthn demo sessions, so user-owned writes should be enforced by server routes.

create extension if not exists pgcrypto;

create table if not exists silly_goose_entertainment.cosmetic_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null
    check (category in ('base', 'hat', 'eyes', 'bill_item', 'held_item', 'neck', 'badge', 'ribbon', 'aura', 'frame', 'background')),
  rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'event')),
  asset_path text,
  preview_path text,
  headshot_path text,
  layer_order integer not null default 0,
  tags text[] not null default '{}',
  unlock_type text not null default 'default'
    check (unlock_type in ('default', 'achievement', 'streak', 'purchase', 'admin_grant', 'event', 'legacy')),
  unlock_rule_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_premium boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists silly_goose_entertainment.goose_loadouts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  slot_index integer not null check (slot_index between 1 and 3),
  name text not null default 'Untitled Goose',
  title text,
  honkline text,
  base_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  hat_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  eyes_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  bill_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  held_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  neck_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  badge_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  ribbon_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  aura_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  frame_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  background_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  composite_asset_path text,
  headshot_asset_path text,
  is_active boolean not null default false,
  is_preset boolean not null default false,
  preset_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot_index)
);

create unique index if not exists goose_loadouts_one_active_per_user_idx
  on silly_goose_entertainment.goose_loadouts(user_id)
  where is_active = true;

create table if not exists silly_goose_entertainment.user_cosmetic_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references silly_goose_entertainment.demo_users(id) on delete cascade,
  cosmetic_item_id uuid not null references silly_goose_entertainment.cosmetic_items(id) on delete cascade,
  source text not null default 'default'
    check (source in ('default', 'achievement', 'streak', 'purchase', 'admin_grant', 'event', 'migration')),
  source_ref text,
  unlocked_at timestamptz not null default now(),
  unique (user_id, cosmetic_item_id)
);

alter table silly_goose_entertainment.achievements
  add column if not exists icon_path text,
  add column if not exists reward_cosmetic_item_id uuid references silly_goose_entertainment.cosmetic_items(id) on delete set null,
  add column if not exists rule_json jsonb not null default '{}'::jsonb,
  add column if not exists points integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table silly_goose_entertainment.user_achievements
  add column if not exists progress_json jsonb not null default '{}'::jsonb;

create index if not exists cosmetic_items_category_sort_idx
  on silly_goose_entertainment.cosmetic_items(category, sort_order, name)
  where is_active = true;
create index if not exists cosmetic_items_unlock_type_idx
  on silly_goose_entertainment.cosmetic_items(unlock_type);
create index if not exists goose_loadouts_user_active_idx
  on silly_goose_entertainment.goose_loadouts(user_id, is_active);
create index if not exists user_cosmetic_unlocks_user_unlocked_idx
  on silly_goose_entertainment.user_cosmetic_unlocks(user_id, unlocked_at desc);
create index if not exists achievements_active_points_idx
  on silly_goose_entertainment.achievements(is_active, points desc);

alter table silly_goose_entertainment.cosmetic_items enable row level security;
alter table silly_goose_entertainment.goose_loadouts enable row level security;
alter table silly_goose_entertainment.user_cosmetic_unlocks enable row level security;

grant usage on schema silly_goose_entertainment to anon, authenticated, service_role;
grant select on silly_goose_entertainment.cosmetic_items to anon, authenticated;
grant select on silly_goose_entertainment.achievements to anon, authenticated;
grant select, insert, update, delete on silly_goose_entertainment.cosmetic_items to service_role;
grant select, insert, update, delete on silly_goose_entertainment.goose_loadouts to service_role;
grant select, insert, update, delete on silly_goose_entertainment.user_cosmetic_unlocks to service_role;
grant select, insert, update, delete on silly_goose_entertainment.achievements to service_role;
grant select, insert, update, delete on silly_goose_entertainment.user_achievements to service_role;

create or replace function silly_goose_entertainment.set_active_goose_loadout(
  p_user_id text,
  p_loadout_id uuid
)
returns setof silly_goose_entertainment.goose_loadouts
language plpgsql
security invoker
set search_path = pg_catalog, silly_goose_entertainment
as $$
begin
  if not exists (
    select 1
    from silly_goose_entertainment.goose_loadouts
    where id = p_loadout_id
      and user_id = p_user_id
  ) then
    raise exception 'goose loadout % does not belong to user %', p_loadout_id, p_user_id
      using errcode = '42501';
  end if;

  update silly_goose_entertainment.goose_loadouts
  set is_active = false,
      updated_at = now()
  where user_id = p_user_id;

  return query
  update silly_goose_entertainment.goose_loadouts
  set is_active = true,
      updated_at = now()
  where id = p_loadout_id
    and user_id = p_user_id
  returning *;
end;
$$;

grant execute on function silly_goose_entertainment.set_active_goose_loadout(text, uuid) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'silly_goose_entertainment'
      and tablename = 'cosmetic_items'
      and policyname = 'Active cosmetics are readable'
  ) then
    create policy "Active cosmetics are readable"
      on silly_goose_entertainment.cosmetic_items
      for select
      to anon, authenticated
      using (is_active = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'silly_goose_entertainment'
      and tablename = 'achievements'
      and policyname = 'Active achievements are readable'
  ) then
    create policy "Active achievements are readable"
      on silly_goose_entertainment.achievements
      for select
      to anon, authenticated
      using (is_active = true);
  end if;
end $$;

comment on table silly_goose_entertainment.cosmetic_items is
  'Catalog of base variants and cosmetic layers. Paths point at already-transparent assets under the goose-assets storage bucket.';
comment on table silly_goose_entertainment.goose_loadouts is
  'Saved Personal Flock slots. This is staged beside the existing selected goose system and is not yet the gameplay/profile source of truth.';
comment on table silly_goose_entertainment.user_cosmetic_unlocks is
  'Per-user cosmetic ownership. Inserts should be made by trusted server logic or service role, not open client grants.';
comment on column silly_goose_entertainment.goose_loadouts.honkline is
  'User custom quote/tagline for a saved goose loadout.';
comment on column silly_goose_entertainment.goose_loadouts.composite_asset_path is
  'Optional cached full-body composite path generated from the loadout layers.';
comment on column silly_goose_entertainment.goose_loadouts.headshot_asset_path is
  'Optional cached avatar/headshot composite path generated from the loadout layers.';
comment on function silly_goose_entertainment.set_active_goose_loadout(text, uuid) is
  'Atomically activates one saved goose loadout for a demo user after verifying loadout ownership. Intended for server-side service role calls only.';
