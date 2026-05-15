import { starterAchievementCatalog, starterCosmeticCatalog } from "../lib/goose-cosmetics";

function sqlString(value: string | null | undefined) {
  if (value == null) return "null";
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlTextArray(values: string[]) {
  return `array[${values.map(sqlString).join(", ")}]::text[]`;
}

const cosmeticRows = starterCosmeticCatalog.map((item) => `(
  ${sqlString(item.slug)},
  ${sqlString(item.name)},
  ${sqlString(item.category)},
  ${sqlString(item.rarity)},
  ${sqlString(item.assetPath)},
  ${sqlString(item.previewPath)},
  ${sqlString(item.headshotPath)},
  ${item.layerOrder},
  ${sqlTextArray(item.tags)},
  ${sqlString(item.unlockType)},
  ${sqlJson(item.unlockRuleJson)},
  ${item.isActive},
  ${item.isPremium},
  ${item.sortOrder}
)`);

const achievementRows = starterAchievementCatalog.map((achievement) => `(
  ${sqlString(achievement.slug)},
  ${sqlString(achievement.slug)},
  ${sqlString(achievement.name)},
  ${sqlString(achievement.description)},
  'game',
  ${sqlJson(achievement.ruleJson)},
  ${sqlJson(achievement.ruleJson)},
  ${achievement.points},
  true,
  ${sqlString(achievement.rewardCosmeticSlug)}
)`);

const sql = `-- Generated Flockerroom starter catalog seed.
-- Usage:
--   npm run seed:flockerroom:sql > /tmp/flockerroom-seed.sql
--   supabase db query --linked --file /tmp/flockerroom-seed.sql

with cosmetic_seed(slug, name, category, rarity, asset_path, preview_path, headshot_path, layer_order, tags, unlock_type, unlock_rule_json, is_active, is_premium, sort_order) as (
  values
${cosmeticRows.join(",\n")}
)
insert into silly_goose_entertainment.cosmetic_items (
  slug, name, category, rarity, asset_path, preview_path, headshot_path, layer_order, tags, unlock_type, unlock_rule_json, is_active, is_premium, sort_order
)
select slug, name, category, rarity, asset_path, preview_path, headshot_path, layer_order, tags, unlock_type, unlock_rule_json, is_active, is_premium, sort_order
from cosmetic_seed
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  rarity = excluded.rarity,
  asset_path = excluded.asset_path,
  preview_path = excluded.preview_path,
  headshot_path = excluded.headshot_path,
  layer_order = excluded.layer_order,
  tags = excluded.tags,
  unlock_type = excluded.unlock_type,
  unlock_rule_json = excluded.unlock_rule_json,
  is_active = excluded.is_active,
  is_premium = excluded.is_premium,
  sort_order = excluded.sort_order,
  updated_at = now();

with achievement_seed(id, code, name, description, category, criteria, rule_json, points, is_active, reward_cosmetic_slug) as (
  select seed.id, seed.code, seed.name, seed.description, seed.category, seed.criteria, seed.rule_json, seed.points, seed.is_active, seed.reward_cosmetic_slug
  from (
    values
${achievementRows.join(",\n")}
  ) as seed(id, code, name, description, category, criteria, rule_json, points, is_active, reward_cosmetic_slug)
)
insert into silly_goose_entertainment.achievements (
  id, code, name, description, category, criteria, rule_json, points, is_active, reward_cosmetic_item_id
)
select achievement_seed.id, achievement_seed.code, achievement_seed.name, achievement_seed.description, achievement_seed.category, achievement_seed.criteria, achievement_seed.rule_json, achievement_seed.points, achievement_seed.is_active, cosmetic_items.id
from achievement_seed
left join silly_goose_entertainment.cosmetic_items
  on cosmetic_items.slug = achievement_seed.reward_cosmetic_slug
on conflict (code) do update set
  id = excluded.id,
  code = excluded.code,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  criteria = excluded.criteria,
  rule_json = excluded.rule_json,
  points = excluded.points,
  is_active = excluded.is_active,
  reward_cosmetic_item_id = excluded.reward_cosmetic_item_id,
  updated_at = now();
`;

process.stdout.write(sql);
