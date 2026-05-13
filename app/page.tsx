import Link from "next/link";
import { LockKeyhole, ShieldCheck, Star } from "lucide-react";
import { PageShell } from "@/components/brand-shell";
import { GooseLoginPanel } from "@/components/goose-login-panel";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <PageShell>
      <section className="app-width mx-auto grid h-full w-full gap-5 px-4 pb-8 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,26vw)]">
        <div className="poster-border landing-poster relative hidden h-full min-h-0 overflow-hidden p-5 sm:p-7 lg:block">
          <div className="hero-goose goose-sprite" style={{ backgroundPosition: "66.666% 100%" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_52%,rgba(0,0,0,.02)_0,rgba(0,0,0,.08)_16rem,rgba(8,8,7,.88)_36rem),linear-gradient(90deg,rgba(9,8,7,.2),rgba(9,8,7,.92)_66%)]" />
          <div className="relative z-10 flex h-full min-h-0 flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <span className="wood-sign px-4 py-2 text-xs">Human-verified</span>
                <span className="wood-sign px-4 py-2 text-xs">Honk approved</span>
              </div>
              <nav className="flex flex-wrap gap-2 text-xs font-black uppercase text-parchment/80">
                <Link className="nav-chip" href="/">About</Link>
                <Link className="nav-chip" href="/dashboard">Our Geese</Link>
                <Link className="nav-chip" href="/game/demo-room">Games</Link>
              </nav>
            </div>
            <div className="ml-[43%] max-w-[min(38vw,780px)]">
              <h1 className="brush-title text-[clamp(3.5rem,5.25vw,7.4rem)] leading-[.92] text-white">
                <span className="block">Flock Around</span>
                <span className="block">And</span>
                <span className="block text-ember">Find Out..</span>
              </h1>
              <p className="mt-4 max-w-md text-lg font-black leading-snug text-parchment">
                Human Verified goose on the loose.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Hardware-backed", LockKeyhole],
                ["Local demo", ShieldCheck],
                ["Real goose energy", Star]
              ].map(([label, Icon]) => (
                <div key={String(label)} className="rough-panel rounded-sm p-3 text-sm font-black uppercase">
                  <Icon className="mb-2 h-5 w-5 text-signal" />
                  {String(label)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-col justify-center gap-4">
          <GooseLoginPanel />
          <div className="dark-card hidden p-4 text-center sm:block">
            <p className="mb-3 text-xs font-black uppercase text-parchment/70">New to the flock?</p>
            <Link href="/login">
              <Button variant="danger" className="w-full">Register with Security Key</Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
