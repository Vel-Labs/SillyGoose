import { ShieldCheck } from "lucide-react";
import { AuthButton } from "./auth-button";

export function GooseLoginPanel({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  return (
    <section className="login-terminal parchment poster-border w-full max-w-md p-5">
      <div className="mb-3 text-center">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-sm border-4 border-black bg-signal text-ink">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-[1.65rem] font-black uppercase leading-[1.02] text-ink">Sign in with Ledger Security Key</h2>
        <p className="mt-2 text-xs font-black uppercase leading-snug text-ink/75">
          Ledger DMK prepares the device. Browser WebAuthn verifies the passkey.
        </p>
      </div>
      <AuthButton redirectTo={redirectTo} />
    </section>
  );
}
