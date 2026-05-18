# Roadmap

This roadmap captures the Silly Goose Entertainment demo path after the first live two-player test.

The product direction is: keep Security Key sign-in as the approachable default, then let players add wallet proof, signed rivalry, $Bread value loops, verified messaging, and optional on-chain proof without making crypto mandatory for basic play.

## Current Product Baseline

- Ledger Security Key-compatible WebAuthn sign-in.
- Ledger DMK browser readiness path that can open the Security Key app before WebAuthn.
- Verified Tic-Tac-Toe rooms with host/invite/join flow, live room polling, rematch voting, AI fallback, and append-only outcomes.
- Player goose identity, Flockerroom/loadout groundwork, badges/cosmetics catalog, and achievement schema groundwork.
- Supabase schema for durable users, sessions, credentials, rooms, outcomes, stats, rivals, achievements, linked wallets, and audit entries.
- Hidden meeting roadmap page at `/roadmap`.

## Immediate Next Items

These are the next actionable implementation lanes.

1. **Security Key-first sign-in UX** ✅
   - Keep the primary lane as `Sign in with Security Key`.
   - Reword the sign-in surface so wallet linking is an optional second step, not a requirement.
   - Profile should show `Human Verified` as the base status.

## Active Next Queue

These are the implementation lanes now starting.

2. **Wallet Proof badge**
   - Add optional `Link Wallet` / `Add Wallet Proof` from Profile.
   - Use a signed ownership challenge and persist the result in the existing `linked_wallets` table.
   - Keep wallet proof separate from the WebAuthn account and do not replace Security Key identity.

3. **Signed rivalry challenge**
   - Add an off-chain EIP-712 typed challenge.
   - Store nonce, challenger, rival, room/game key, expiration, linked wallet, signature, and status in Supabase.
   - Use this as the first visible "signed intent" feature without requiring gas or chain writes.

4. **$Bread ledger**
   - Add off-chain Supabase balances and transaction history.
   - Support rewards, GG tips, friend transfers, challenge stake locks, and challenge stake releases.
   - Treat $Bread as non-redeemable demo/game value, not a bonded token or market asset.

5. **Achievement registry expansion**
   - Reuse the existing `achievements` and `user_achievements` schema.
   - Expand achievement categories for `game`, `social`, `bread`, `web3`, `streak`, `seasonal`, and `flockerroom`.
   - Use Flockerroom reward fields and progress JSON instead of creating a second achievement model.

6. **Verified messaging / signed pings**
   - Add a lightweight verified message or "ping" concept between players.
   - Start with in-app notifications backed by server records.
   - Later connect this to wallet-linked alerts or signed challenge notifications.

## Near Term / Post Demo

These features are strong follow-ups after the immediate demo flow is stable.

- **Ledger receive verification**
  - Let a linked wallet verify a receive address on-device.
  - Use it for GG tips, dev tips, and profile wallet proof.

- **GG tips**
  - Allow players to send $Bread tips after a match.
  - Add achievement hooks such as `Good Sport`, `GG Nod`, and `Let's Get This $Bread`.

- **People's Rival leaderboard**
  - Use `player_rivals`, outcomes, and $Bread activity to rank frequent rivals and community nemeses.
  - Add views for top players, top rivals, and most challenged players.

- **Achievement catalog pass**
  - Add quick wins, day-to-day achievements, social/rivalry achievements, web3 achievements, and long-horizon achievements.
  - Pair selected achievements with cosmetic rewards.

- **Wallet Proof UI in game room**
  - Show `Human Verified` and `Wallet Proof` as separate badges.
  - Avoid implying a wallet is required to play.

- **Receive/tip receipt trail**
  - Show app intent, wallet proof, optional on-device receive confirmation, and stored receipt state.

- **Additional games**
  - Add Battleship-style one-turn challenge, Connect 4, and other room-based games after the identity/value loops are stable.

## Future Features

These are compelling but should not block the demo.

- **On-chain achievements**
  - Optional low-cost mints for event, season, or milestone badges.
  - Prefer a low-cost chain or compressed/NFT-like primitive after the off-chain achievement loop is working.

- **Game wallet / smart account**
  - Add a scoped game wallet inspired by the ClearIntent account-abstraction boundary.
  - Keep parent wallet keys out of app state.
  - Treat this as a separate `Game Wallet` badge/status from `Wallet Proof`.

- **Clear Signing receipts**
  - Pair signed rivalry and wallet actions with clearer human-readable previews and stored receipt evidence.
  - Do not claim full wallet-rendered Clear Signing until tested against the actual wallet path.

- **Wallet-linked notifications**
  - Start with app/browser notifications.
  - Explore wallet or device-adjacent notifications only after the basic signed message model works.

- **On-device / touchscreen signer play**
  - Playing games directly on supported Ledger touchscreen models is a future custom device-app track.
  - Treat this as research and demo inspiration, not near-term web-app scope.

- **Real token or crypto wagering**
  - Not part of current scope.
  - Requires legal/compliance review, explicit jurisdiction handling, and a much larger security surface.

## Design Rules

- Security Key sign-in is the first-class entry point.
- Wallet linking is optional proof and unlocks extra features.
- $Bread is off-chain game value unless a later decision explicitly changes that.
- Signed rivalry and verified messaging should work off-chain first.
- Supabase remains persistence; server routes remain the authority boundary.
- Do not present future Ledger/device capabilities as already implemented.
