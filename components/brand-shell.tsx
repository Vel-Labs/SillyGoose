import Link from "next/link";
import { Feather, ShieldCheck } from "lucide-react";
import { Attribution } from "./attribution";

export function BrandHeader() {
  return (
    <header className="app-width mx-auto flex h-[92px] w-full shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        <div className="goose-sprite h-12 w-12 overflow-hidden rounded-sm border-2 border-black bg-parchment" style={{ backgroundPosition: "66.666% 100%" }} />
        <div>
          <div className="brush-title text-3xl leading-none">Silly Goose</div>
          <div className="wood-ribbon mt-1 px-3 py-1 text-xs">Entertainment</div>
        </div>
      </Link>
      <nav className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-parchment/80">
        <Link className="rounded-sm border border-white/20 px-3 py-2 hover:text-signal" href="/dashboard">Dashboard</Link>
        <Link className="rounded-sm border border-white/20 px-3 py-2 hover:text-signal" href="/game/demo-room">Games</Link>
        <Link className="rounded-sm border border-white/20 px-3 py-2 hover:text-signal" href="/login">Sign in</Link>
      </nav>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="paper-stage relative flex h-dvh overflow-hidden">
      <div className="flex min-h-0 w-full flex-col">
      <BrandHeader />
      <div className="min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
      </div>
      <footer className="footer-strip pointer-events-none absolute bottom-3 left-1/2 z-20 hidden w-full -translate-x-1/2 items-center justify-between gap-4 px-4 text-[11px] sm:flex sm:px-6">
        <Attribution />
        <div className="flex items-center gap-2 text-xs font-black uppercase text-parchment/70">
          <ShieldCheck className="h-4 w-4 text-signal" />
          Human-verified
          <Feather className="h-4 w-4" />
        </div>
      </footer>
    </main>
  );
}
