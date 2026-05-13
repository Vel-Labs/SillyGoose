import { LockKeyhole, ShieldCheck, Star } from "lucide-react";
import { PageShell } from "@/components/brand-shell";
import { GooseLoginPanel } from "@/components/goose-login-panel";
import { GoosePortrait } from "@/components/goose-portrait";

export default function HomePage() {
  return (
    <PageShell>
      <section className="app-width mx-auto grid min-h-[calc(100dvh-150px)] w-full gap-4 px-4 pb-4 pt-1 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,26vw)]">
        <div className="poster-border landing-poster relative hidden min-h-[540px] overflow-hidden p-4 sm:p-5 lg:block">
          <GoosePortrait goose="captain" className="hero-goose" priority imageClassName="p-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_52%,rgba(0,0,0,.02)_0,rgba(0,0,0,.08)_16rem,rgba(8,8,7,.88)_36rem),linear-gradient(90deg,rgba(9,8,7,.2),rgba(9,8,7,.92)_66%)]" />
          <div className="relative z-10 flex h-full min-h-[500px] flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <span className="wood-sign px-4 py-2 text-xs">Human-verified</span>
                <span className="wood-sign px-4 py-2 text-xs">Honk approved</span>
              </div>
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
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["Hardware-backed", LockKeyhole],
                ["Local demo", ShieldCheck],
                ["Real goose energy", Star]
              ].map(([label, Icon]) => (
                <div key={String(label)} className="rough-panel rounded-sm p-2 text-xs font-black uppercase">
                  <Icon className="mb-1 h-4 w-4 text-signal" />
                  {String(label)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-h-[560px] flex-col justify-center gap-4">
          <GooseLoginPanel />
        </div>
      </section>
    </PageShell>
  );
}
