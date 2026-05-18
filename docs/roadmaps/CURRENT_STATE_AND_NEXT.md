# Current State and Next

This is the operational routing companion to the root `ROADMAP.md`.

## Current State

- The demo has a Security Key-first account flow using browser WebAuthn, with Ledger DMK used as a device readiness/app-open helper.
- Game rooms support verified host/join flow, live polling, rematch voting, AI fallback, room URLs, selected goose identity, and saved outcomes.
- Supabase schema support exists for durable accounts, credentials, sessions, rooms, outcomes, player stats, rivals, achievements, linked wallets, and audit entries.
- Achievement and Flockerroom schemas already provide the correct foundation for cosmetic rewards and progress tracking.
- The hidden `/roadmap` page is available for meeting walkthroughs.

## Completed Baseline

- `Sign in with Security Key` is the primary account path.
- The base account status is `Human Verified`.
- Wallet proof remains optional and additive.

## Immediate Next Action

Start the active next queue:

1. Add optional `Link Wallet` / `Wallet Proof` in Profile.
2. Persist wallet proof to the existing `linked_wallets` table through a signed ownership challenge.
3. Add UI copy that makes `Human Verified` and `Wallet Proof` separate statuses.
4. Follow with signed rivalry challenges, $Bread ledger work, achievement expansion, and verified messaging.

## Next Implementation Lanes

- Signed off-chain EIP-712 rivalry challenge.
- Off-chain `$Bread` ledger with balances, transfers, tips, and challenge stake locks.
- Expanded achievement registry using the existing `achievements` / `user_achievements` model.
- Verified messaging / signed pings as a web-based verified interaction proof.
- Ledger receive verification for profile proof, GG tips, and dev tips.

## Validation Before Advancing

For docs-only roadmap updates, inspect the rendered Markdown.

For implementation changes, run the relevant gates:

```bash
npm run typecheck
npm run build
npm run validate:contracts
```

Use `npm run validate:scaffold` only after scaffold metadata is intentionally refreshed; it currently reports scaffold-era drift in this productized app checkout.

## Do Not Start Yet

- Real-value wagering.
- Public token launch or bonded-token mechanics for `$Bread`.
- Custom Ledger touchscreen device app.
- On-chain achievements before the off-chain achievement and wallet-proof loop is stable.
- Wallet or device notification claims beyond what the implemented web app can actually prove.
