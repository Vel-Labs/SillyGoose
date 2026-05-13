# Demo Script

## Narration Spine

This is intentionally a silly site. The point is the primitive underneath it.

Login proves identity. Add User proves sensitive action approval. Tic-Tac-Toe proves multi-user participation with hardware-backed auth.

The workshop version would walk teams through setup, agent connection, Web2 action approval, and Web3 signer approval.

## Flow

1. Open the local Next URL, for example `http://localhost:3001`.
2. Show the Silly Goose Entertainment landing screen and say: "Flock around and Find out. Feathered strategy. Human-verified goose on the loose."
3. Connect and unlock the Ledger over USB, close Ledger Wallet/Ledger Live if it is holding the device, then click `Prepare Ledger Security Key app` to open the on-device Security Key app through DMK.
4. Register or sign in from the `Sign in with Ledger Security Key` panel and approve the browser WebAuthn prompt on the Ledger.
5. If the WebAuthn prompt fails during screen share, click `Local fallback` only to rehearse the UI and state clearly: "This fallback is not the Ledger signer acceptance path."
6. Open the dashboard and point to `Verified Goose Operator`.
7. Click `Add Intern Goose`; the app asks for a fresh WebAuthn approval separate from login.
8. Click `New Game`.
9. Copy or read out the `/join/<room-code>` path.
10. On the Player Two browser/device, open the join path, authenticate with that person's Ledger Security Key, and click `Join as Player Two`.
11. Play a full match and show the verified player badges.
12. Open `Play vs AI` and note that MiniMax is fallback-only unless local readiness is configured.

## Close

The pattern is app request, human approval, signer boundary. The demo is local and funny; the boundary model is serious.
