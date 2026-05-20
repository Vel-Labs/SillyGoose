import Link from "next/link";
import { Feather, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Attribution, StarRepoButton } from "./attribution";
import { GoosePortrait } from "./goose-portrait";

export async function BrandHeader() {
  const user = await getCurrentUser();

  return (
    <header className="app-width mx-auto flex w-full shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:min-h-[92px] sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        <GoosePortrait goose="captain" className="brand-goose-mark rounded-sm border-2 border-black bg-parchment" priority />
        <div>
          <div className="brush-title text-3xl leading-none">Silly Goose</div>
          <div className="wood-ribbon mt-1 px-3 py-1 text-xs">Entertainment</div>
        </div>
      </Link>
      <nav className="flex flex-wrap items-center gap-2 text-xs font-black uppercase">
        <Link className="wood-sign nav-wood-sign px-3 py-2" href="/dashboard" prefetch={false}>Arcade</Link>
        <Link className="wood-sign nav-wood-sign px-3 py-2" href="/leaderboard">Leaderboard</Link>
        <Link className="wood-sign nav-wood-sign px-3 py-2" href="/profile" prefetch={false}>Profile</Link>
        {user ? (
          <Link className="wood-sign nav-wood-sign px-3 py-2" href="/api/auth/sign-out">Sign out</Link>
        ) : (
          <Link className="wood-sign nav-wood-sign px-3 py-2" href="/login">Sign in</Link>
        )}
      </nav>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="paper-stage relative flex min-h-dvh">
      <div className="flex min-h-0 w-full flex-col">
        <BrandHeader />
        <div className="min-h-0 flex-1">
          {children}
        </div>
        <footer className="footer-strip mx-auto mb-3 mt-3 grid w-full grid-cols-1 items-center gap-3 px-4 py-2 text-[11px] sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="justify-self-start">
            <StarRepoButton />
          </div>
          <Attribution />
          <div className="flex items-center gap-2 justify-self-center text-xs font-black uppercase text-parchment/70 lg:justify-self-end">
            <ShieldCheck className="h-4 w-4 text-signal" />
            Human-verified
            <Feather className="h-4 w-4" />
          </div>
        </footer>
      </div>
    </main>
  );
}
