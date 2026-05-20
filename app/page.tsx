import Link from "next/link";
import { Gamepad2, LogOut, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/brand-shell";
import { GooseLoginPanel } from "@/components/goose-login-panel";
import { GoosePortrait } from "@/components/goose-portrait";
import { HeroProofButtons } from "@/components/hero-proof-buttons";
import { HonkApprovedButton } from "@/components/honk-approved-button";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <PageShell>
      <section className="app-width mx-auto grid min-h-[calc(100dvh-150px)] w-full items-center gap-4 px-4 pb-4 pt-1 sm:px-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(380px,26vw)]">
        <div className="poster-border landing-poster relative hidden min-h-[500px] overflow-visible p-5 lg:block">
          <GoosePortrait goose="captain" className="hero-goose" priority imageClassName="hero-goose-image p-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_52%,rgba(0,0,0,.02)_0,rgba(0,0,0,.08)_16rem,rgba(8,8,7,.88)_36rem),linear-gradient(90deg,rgba(9,8,7,.2),rgba(9,8,7,.92)_66%)]" />
          <div className="relative z-10 flex h-full min-h-[450px] flex-col justify-between">
            <div className="hero-seal-row flex flex-nowrap justify-center gap-2">
              <span className="wood-sign px-3 py-2 text-[11px]">Human-verified</span>
              <HonkApprovedButton />
            </div>
            <div className="ml-[43%] flex min-h-[260px] max-w-[min(38vw,780px)] items-center">
              <div>
                <h1 className="brush-title text-[clamp(3.25rem,5vw,6.8rem)] leading-[.9] text-white">
                  <span className="block">Flock</span>
                  <span className="block">Around &amp;</span>
                  <span className="block text-ember">FIND OUT...</span>
                </h1>
                <p className="mt-3 max-w-md text-base font-black leading-snug text-parchment">
                  Human Verified goose on the loose.
                </p>
              </div>
            </div>
            <HeroProofButtons />
          </div>
        </div>
        <div className="flex min-h-[500px] flex-col justify-center gap-4">
          {user ? <SignedInHomePanel handle={user.handle} /> : <GooseLoginPanel />}
        </div>
      </section>
    </PageShell>
  );
}

function SignedInHomePanel({ handle }: { handle: string }) {
  return (
    <section className="login-terminal parchment poster-border w-full max-w-md p-5">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-sm border-4 border-black bg-signal text-ink">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-[1.65rem] font-black uppercase leading-[1.02] text-ink">Signed in as @{handle}</h2>
        <p className="mt-2 text-xs font-black uppercase leading-snug text-ink/75">
          Your Security Key session is still active.
        </p>
      </div>
      <div className="grid gap-2">
        <Link className="inline-flex min-h-11 flex-wrap items-center justify-center gap-2 rounded-sm border-2 border-black bg-signal px-4 py-2 text-center text-sm font-black uppercase text-ink transition hover:bg-[#ffc247]" href="/dashboard">
          <Gamepad2 className="h-4 w-4" /> Continue to arcade
        </Link>
        <Link className="inline-flex min-h-11 flex-wrap items-center justify-center gap-2 rounded-sm border-2 border-black bg-ember px-4 py-2 text-center text-sm font-black uppercase text-white transition hover:bg-[#e94430]" href="/api/auth/sign-out">
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
    </section>
  );
}
