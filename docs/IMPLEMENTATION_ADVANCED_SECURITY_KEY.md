# Implementation: Advanced Security Key

The credential boundary is browser-native WebAuthn with Ledger Security Key as the authenticator.

Ledger DMK is used as a device preparation layer. In this local app, `lib/auth/ledger-dmk.ts` checks whether the browser exposes WebHID, discovers/connects the Ledger through `@ledgerhq/device-transport-kit-web-hid`, and sends `OpenAppCommand({ appName: "Security Key" })` before the WebAuthn ceremony.

`Prepare Ledger Security Key app` does not open the desktop Ledger Wallet/Ledger Live app and does not pair over Bluetooth. Ledger Wallet/Ledger Live is only needed beforehand if the Security Key app is missing or the signer firmware needs an update. During the browser demo, the signer should be connected over USB, unlocked, and available to the browser's WebHID chooser.

The actual credential creation and authentication remain browser WebAuthn calls through SimpleWebAuthn. The Ledger signs the FIDO2/WebAuthn challenge after the Security Key app is open.

This demo does not use DMK to verify passkeys, replace `navigator.credentials.create()`, replace `navigator.credentials.get()`, sign transactions, connect a wallet, or open mainnet flows.

The friend flow is:

1. Host authenticates with a Ledger Security Key credential.
2. Host clicks `New Game`, creating a local room.
3. Host shares `/join/<room-code>`.
4. Player Two authenticates with a different Ledger Security Key credential.
5. Player Two joins the room from the join page.
