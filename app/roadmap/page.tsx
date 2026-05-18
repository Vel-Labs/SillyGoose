import { BadgeCheck, BellRing, Coins, Gamepad2, KeyRound, Landmark, MonitorCheck, RadioTower, ShieldCheck, Sparkles, Trophy, WalletCards } from "lucide-react";
import { Panel, SectionHeader, StatusBadge } from "@/components/arcade-primitives";
import { PageShell } from "@/components/brand-shell";

const implemented = [
  {
    title: "Security Key sign-in",
    detail: "Ledger DMK prepares the signer, then browser WebAuthn verifies the Silly Goose player account.",
    status: "Live",
    icon: ShieldCheck
  },
  {
    title: "Verified rooms",
    detail: "Game rooms, rival joins, rematches, turns, and outcomes stay server-owned instead of client-trusted.",
    status: "Live",
    icon: Gamepad2
  },
  {
    title: "Achievement registry",
    detail: "Achievements and user unlocks already have schema support, with Flockerroom cosmetic rewards staged.",
    status: "Staged",
    icon: Trophy
  }
];

const nearTerm = [
  {
    title: "Wallet Proof",
    detail: "Optional wallet link after Security Key sign-in. Adds a Wallet Proof badge without replacing the WebAuthn account.",
    icon: WalletCards
  },
  {
    title: "Signed Rivalry Challenge",
    detail: "Off-chain EIP-712 challenge signed by the linked wallet and stored with nonce, room, rival, deadline, and optional $Bread stake.",
    icon: BadgeCheck
  },
  {
    title: "$Bread Ledger",
    detail: "Supabase-backed off-chain balances, transfers, GG tips, challenge stake locks, and challenge stake releases.",
    icon: Coins
  },
  {
    title: "Receive Verification",
    detail: "Show and verify a receive address on the Ledger signer before GG tips or dev tips. Strong value signal with limited product risk.",
    icon: KeyRound
  }
];

const deeper = [
  {
    title: "Clear Signing Receipts",
    detail: "Pair each signed challenge with a human-readable app preview, signer confirmation notes, and stored receipt evidence.",
    icon: MonitorCheck
  },
  {
    title: "Wallet Alerts",
    detail: "Notify the linked wallet surface when $Bread, tips, or signed challenges happen. Browser/app alerts are near-term; device-native alerts need deeper wallet/app work.",
    icon: BellRing
  },
  {
    title: "On-chain Achievements",
    detail: "Optional low-cost mint lane for season/event badges after the off-chain achievement registry proves the product loop.",
    icon: Sparkles
  },
  {
    title: "Game Wallet",
    detail: "A scoped smart account for game actions, inspired by the ClearIntent account-abstraction boundary, while keeping parent wallet keys out of app state.",
    icon: Landmark
  },
  {
    title: "Signer-native Play",
    detail: "Playing directly on touch-screen Ledger signers would require custom device-app work and a much deeper product track than the current web demo.",
    icon: RadioTower
  }
];

export default function RoadmapPage() {
  return (
    <PageShell>
      <section className="app-width mx-auto w-full px-4 pb-6 sm:px-6">
        <div className="poster-border dashboard-frame p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase text-signal">Meeting roadmap</p>
                <h1 className="brush-title mt-2 text-4xl leading-none text-white sm:text-5xl">Ledger Growth Path</h1>
                <p className="mt-3 max-w-2xl text-sm font-black uppercase leading-relaxed text-parchment/75">
                  Silly Goose starts with Security Key sign-in, then lets players add wallet proof, signed rivalry,
                  $Bread value loops, receive verification, and optional on-chain achievements without making crypto mandatory.
                </p>
              </div>

              <Panel className="p-3">
                <SectionHeader>Recommended UX</SectionHeader>
                <div className="mt-3 grid gap-2">
                  {[
                    "Primary sign-in stays Security Key first.",
                    "Wallet Proof is an optional second step in Profile.",
                    "$Bread stays off-chain, transferable, and non-redeemable.",
                    "On-chain features are opt-in proof layers, not base gameplay."
                  ].map((item) => (
                    <div key={item} className="rounded-sm border-2 border-black bg-black/40 px-3 py-2 text-xs font-black uppercase text-parchment/75">
                      {item}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel className="p-3">
              <SectionHeader>Already Present</SectionHeader>
              <div className="mt-3 grid gap-3">
                {implemented.map((item) => (
                  <RoadmapCard key={item.title} {...item} />
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel className="p-3">
              <SectionHeader>Best Next Features</SectionHeader>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {nearTerm.map((item) => (
                  <RoadmapCard key={item.title} {...item} status="Next" />
                ))}
              </div>
            </Panel>

            <Panel className="p-3">
              <SectionHeader>Where DMK Can Go</SectionHeader>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {deeper.map((item) => (
                  <RoadmapCard key={item.title} {...item} status="Future" />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function RoadmapCard({ title, detail, status, icon: Icon }: { title: string; detail: string; status: string; icon: typeof ShieldCheck }) {
  return (
    <article className="rounded-sm border-2 border-black bg-black/45 p-3">
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-6 w-6 shrink-0 text-signal" />
        <StatusBadge tone={status === "Live" ? "verified" : status === "Staged" ? "ready" : "soon"}>{status}</StatusBadge>
      </div>
      <h2 className="mt-3 text-base font-black uppercase leading-none text-white">{title}</h2>
      <p className="mt-2 text-xs font-black uppercase leading-snug text-parchment/65">{detail}</p>
    </article>
  );
}
