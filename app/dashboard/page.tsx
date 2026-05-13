import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2, Coins, LockKeyhole, ShieldCheck } from "lucide-react";
import { AdminAddUserCard } from "@/components/admin-add-user-card";
import { PageShell } from "@/components/brand-shell";
import { GamePrepCard } from "@/components/game-prep-card";
import { OperatorGooseProfile } from "@/components/operator-goose-profile";
import { SurrenderHonkButton } from "@/components/surrender-honk-button";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await readStore();
  const audits = store.audits.slice(0, 4);

  return (
    <PageShell>
      <section className="app-width mx-auto h-full min-h-0 w-full px-4 pb-2 sm:px-6">
        <div className="poster-border dashboard-frame grid h-full min-h-0 overflow-hidden gap-3 p-3 lg:grid-cols-[180px_1fr]">
          <aside className="dark-card flex flex-col gap-2 p-3">
            <OperatorGooseProfile operatorName={user.name || "King Goose"} />
            <div className="sidebar-row sidebar-row-active">
              <ShieldCheck className="h-4 w-4" />
              Security Key session
            </div>
            <div className="sidebar-row">
              <LockKeyhole className="h-4 w-4" />
              WebAuthn verified
            </div>
            <div className="sidebar-row">
              <Coins className="h-4 w-4" />
              1,337 honks
            </div>
            <SurrenderHonkButton />
          </aside>
          <div className="min-h-0 space-y-2 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-parchment/65">Welcome back,</p>
                <h1 className="brush-title text-3xl text-white xl:text-4xl">{user.name || "Verified Goose"}.</h1>
                <p className="text-xs font-black uppercase text-signal">@{user.handle} retained by Security Key session</p>
              </div>
              <div className="dark-card flex items-center gap-3 px-3 py-2 text-xs font-black uppercase text-parchment">
                <Coins className="h-5 w-5 text-signal" />
                Flock cred
                <span className="text-signal">1,337 honks</span>
              </div>
            </div>
            <section className="poster-border parchment relative overflow-hidden p-2">
              <Image src="/reference-art/game-loading-screen-empty.png" alt="" width={1672} height={941} priority className="absolute inset-0 h-full w-full object-cover opacity-20" />
              <div className="relative grid items-center gap-3 sm:grid-cols-[96px_1fr_96px]">
                <OperatorGooseProfile operatorName={user.name || "King Goose"} variant="hero" />
                <div className="rounded-sm border-2 border-black bg-parchment/90 p-2 shadow-[4px_4px_0_rgba(0,0,0,.22)]">
                  <h2 className="text-xl font-black uppercase leading-none text-ember">Verified Goose Operator</h2>
                  <div className="mt-1 grid gap-0.5 text-[11px] font-black uppercase text-ink">
                    <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Hardware-backed</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-700" /> Local demo</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-700" /> Human-verified</div>
                  </div>
                </div>
                <div className="stamp verified-stamp bg-white/50">Verified</div>
              </div>
            </section>
            <div className="grid min-h-0 gap-3 xl:grid-cols-[.72fr_1.28fr]">
              <div className="grid min-h-0 gap-3">
                <AdminAddUserCard />
                <section className="dark-card min-h-0 p-2">
                  <h2 className="brush-title text-xl leading-none text-signal">Recent activity</h2>
                  <div className="mt-2 grid gap-2">
                    {audits.length ? audits.slice(0, 3).map((audit) => (
                      <div key={audit.id} className="rounded-sm border border-white/15 bg-black/40 p-2 text-[11px] font-bold leading-snug text-parchment/80">
                        {audit.message}
                      </div>
                    )) : <div className="text-xs font-bold text-parchment/70">No honks recorded yet.</div>}
                  </div>
                </section>
              </div>
              <GamePrepCard defaultGoose="captain" />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
