import { ShieldCheck } from "lucide-react";
import { AuthButton } from "./auth-button";

export function GooseLoginPanel({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  return (
    <section className="login-terminal parchment poster-border w-full max-w-md p-4 sm:p-5">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-sm border-4 border-black bg-signal text-ink">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-black uppercase leading-[1.05] text-ink">Sign in with Ledger Security Key</h2>
        <p className="mt-3 text-sm font-black uppercase leading-snug text-ink/75">
          No passwords. No bots. Just proof you are human.
        </p>
      </div>
      <AuthButton redirectTo={redirectTo} />
    </section>
  );
}
