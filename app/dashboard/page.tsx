import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2, Coins, Home, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { AdminAddUserCard } from "@/components/admin-add-user-card";
import { PageShell } from "@/components/brand-shell";
import { GamePrepCard } from "@/components/game-prep-card";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await readStore();
  const audits = store.audits.slice(0, 4);

  return (
    <PageShell>
      <section className="app-width mx-auto h-full w-full px-4 pb-8 sm:px-6">
        <div className="poster-border dashboard-frame grid h-full min-h-0 gap-4 p-4 lg:grid-cols-[180px_1fr]">
          <aside className="dark-card flex flex-col gap-3 p-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="goose-sprite h-12 w-12 overflow-hidden rounded-sm border-2 border-black bg-parchment" style={{ backgroundPosition: "66.666% 100%" }} />
              <div>
                <div className="brush-title text-xl leading-none">Silly Goose</div>
                <div className="text-[10px] font-black uppercase text-signal">Entertainment</div>
              </div>
            </div>
            {[
              ["Dashboard", Home],
              ["My Profile", UserRound],
              ["My Geese", ShieldCheck],
              ["Games", LockKeyhole]
            ].map(([label, Icon], index) => (
              <div key={String(label)} className={`sidebar-row ${index === 0 ? "sidebar-row-active" : ""}`}>
                <Icon className="h-4 w-4" />
                {String(label)}
              </div>
            ))}
            <div className="mt-auto parchment rotate-[-3deg] p-3 text-center text-ink">
              <div className="brush-title text-2xl text-ink [text-shadow:1px_1px_0_#f4a51c]">Honk</div>
              <div className="text-[10px] font-black uppercase">If you surrender</div>
            </div>
          </aside>
          <div className="min-h-0 space-y-3 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-parchment/65">Welcome back,</p>
                <h1 className="brush-title text-4xl text-white xl:text-5xl">Verified Goose.</h1>
              </div>
              <div className="dark-card flex items-center gap-3 px-4 py-3 text-xs font-black uppercase text-parchment">
                <Coins className="h-5 w-5 text-signal" />
                Flock cred
                <span className="text-signal">1,337 honks</span>
              </div>
            </div>
            <section className="poster-border parchment relative overflow-hidden p-4">
              <Image src="/reference-art/game-loading-screen.png" alt="" width={1672} height={941} className="absolute inset-0 h-full w-full object-cover opacity-20" />
              <div className="relative grid items-center gap-4 sm:grid-cols-[150px_1fr_130px]">
                <div className="rounded-sm border-4 border-signal bg-ink p-3 text-center text-parchment">
                  <div className="goose-portrait goose-sprite mx-auto h-[96px] w-full" style={{ backgroundPosition: "66.666% 100%" }} />
                  <div className="mt-2 text-[10px] font-black uppercase text-signal">Operator profile</div>
                  <div className="brush-title text-xl text-white">{user.name || "Captain Goose"}</div>
                </div>
                <div>
                  <h2 className="brush-title text-3xl text-ember [text-shadow:2px_2px_0_#f4a51c] xl:text-4xl">Verified Goose Operator</h2>
                  <div className="mt-2 grid gap-1 text-sm font-black uppercase text-ink">
                    <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Hardware-backed</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-700" /> Local demo</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-700" /> Human-verified</div>
                  </div>
                </div>
                <div className="stamp bg-white/40 px-4 py-3 text-center text-2xl">Verified</div>
              </div>
            </section>
            <div className="grid min-h-0 gap-4 xl:grid-cols-[1fr_.92fr]">
              <AdminAddUserCard />
              <GamePrepCard defaultGoose="captain" />
            </div>
            <section className="dark-card hidden p-3 2xl:block">
              <h2 className="brush-title text-2xl text-signal">Recent activity</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {audits.length ? audits.slice(0, 3).map((audit) => (
                  <div key={audit.id} className="rounded-sm border border-white/15 bg-black/40 p-3 text-xs font-bold text-parchment/80">
                    {audit.message}
                  </div>
                )) : <div className="text-sm font-bold text-parchment/70">No honks recorded yet.</div>}
              </div>
            </section>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
