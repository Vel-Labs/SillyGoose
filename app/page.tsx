import { PageShell } from "@/components/brand-shell";
import { GooseLoginPanel } from "@/components/goose-login-panel";
import { GoosePortrait } from "@/components/goose-portrait";
import { HeroProofButtons } from "@/components/hero-proof-buttons";
import { HonkApprovedButton } from "@/components/honk-approved-button";

export default function HomePage() {
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
          <GooseLoginPanel />
        </div>
      </section>
    </PageShell>
  );
}
