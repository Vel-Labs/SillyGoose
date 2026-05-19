# Silly Goose Entertainment Ledger Demo

A local Next.js demo where every goose is verified.

The demo shows:

- Ledger Security Key-compatible WebAuthn registration/login through SimpleWebAuthn.
- A protected dashboard for a `Verified Goose Operator`.
- `Add Intern Goose` as a fresh WebAuthn action approval after login.
- `New Game` room creation with compact game-prefixed room codes, spectator URLs, and Player Two join URLs.
- `Verified Tic-Tac-Toe` with separate verified player presentation.
- `Play vs AI` as a clearly marked local fallback unless MiniMax readiness is configured.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next, usually `http://localhost:3000`. If that port is occupied, run `npm run dev -- -p 3001`.

Copy `.env.example` to `.env.local` and fill only the values needed for the demo mode you are running. The default local mode is file-backed and does not require Supabase. For a stable dogfood/demo account that survives server restarts, use the server-side Supabase adapter:

```bash
DEMO_STORE_ADAPTER=supabase
DEMO_SUPABASE_ENABLED=true
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SCHEMA=silly_goose_entertainment
SUPABASE_SECRET_KEY=sb_secret_...
```

WebAuthn credentials are origin-bound. For local development on port 3001, use `NEXT_PUBLIC_APP_ORIGIN=http://localhost:3001`, `WEBAUTHN_RP_ID=localhost`, and `WEBAUTHN_ORIGIN=http://localhost:3001`. For the Vercel demo, use the exact Vercel/custom-domain values in all three variables before registering that environment's Security Key credential.

## Ledger Sign-In And Friend Join

1. Connect and unlock the Ledger.
2. Make sure the Security Key app is installed on the signer. Use Ledger Wallet/Ledger Live for installation or firmware updates only.
3. Open the Security Key app manually, or click `Prepare Ledger Security Key app` so the browser can request WebHID access and DMK can open the on-device app for you.
4. Keep Ledger Wallet/Ledger Live closed while the browser is talking to the signer over WebHID.
5. Register or sign in with the browser WebAuthn prompt. The Ledger signs that FIDO2/WebAuthn challenge.
6. Click `New Game` from the dashboard.
7. Give Player Two the room code or `/join/<room-code>` path shown on the game page. Tic-tac-toe rooms use compact `tictac_<code>` IDs so future games can get their own URL namespace.
8. Player Two opens the join page, registers or signs in with their own Ledger Security Key credential, then clicks `Join as Player Two`.

The spectator link is `/game/<room-code>` for the same game-prefixed room. Completed matches are appended to the local store as immutable outcomes so the live board can be reset for rematches without losing training/evaluation data.

For another physical computer on the same network, use the `Network` URL printed by Next, for example `http://10.0.0.169:3001/join/<room-code>`. WebAuthn credentials are origin-bound, so a credential registered on `localhost` is different from one registered on the LAN host or a future HTTPS domain.

## Demo Fallback

Real WebAuthn requires a browser, local origin, and authenticator. If the live Security Key prompt fails or is canceled, the visible `Local fallback` button can unblock UI rehearsal only. It is not the acceptance path for the Ledger signer demo.

## Boundary

Ledger DMK prepares the physical device by connecting over browser WebHID and opening the Security Key app on the signer. It does not open or pair with the desktop Ledger Wallet/Ledger Live app. Credential operations are still verified by native browser WebAuthn through SimpleWebAuthn. This implementation does not use DMK as a credential verifier, wallet connector, transaction signer, Bluetooth pairing flow, or mainnet Web3 path.

MiniMax is checked through local environment readiness only. Without local credentials, the game uses a deterministic offline demo opponent.

Supabase should stay a server-side persistence adapter before it is exposed to the browser. See `docs/integrations/SUPABASE_INTEGRATION.md` for the recommended schema, env variables, and RLS boundary.
