# Implementation: Simple Auth

The local demo uses `@simplewebauthn/browser` for browser prompts and `@simplewebauthn/server` for challenge generation and assertion verification.

Local data is stored in `data/demo-store.json` at runtime. This keeps the demo inspectable and easy to reset without introducing a production auth provider.

Implemented routes:

- `/api/webauthn/register/options`
- `/api/webauthn/register/verify`
- `/api/webauthn/login/options`
- `/api/webauthn/login/verify`
- `/api/webauthn/demo-session`

Session state uses a local HTTP-only cookie. This is enough for screen-share reliability and should not be described as production IAM.
