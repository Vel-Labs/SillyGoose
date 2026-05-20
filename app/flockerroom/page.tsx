import Link from "next/link";
import { redirect } from "next/navigation";
import { Panel } from "@/components/arcade-primitives";
import { PageShell } from "@/components/brand-shell";
import { FlockerroomConsole } from "@/components/flockerroom-console";
import { getCurrentUser } from "@/lib/auth/session";

const flockerroomEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOCKERROOM !== "false";

export default async function FlockerroomPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/flockerroom");

  if (!flockerroomEnabled) {
    return (
      <PageShell>
        <section className="app-width mx-auto w-full px-4 pb-2 sm:px-6">
          <Panel className="poster-border p-4">
            <p className="brush-strip mb-2 inline-block px-3 py-1 text-[11px] text-parchment">Flockerroom</p>
            <h1 className="brush-title text-3xl text-white">Flockerroom is gated.</h1>
            <p className="mt-2 max-w-2xl text-xs font-black uppercase leading-snug text-parchment/70">
              Set NEXT_PUBLIC_ENABLE_FLOCKERROOM=true to preview the staged cosmetic loadout system. Existing Goose Builder and active goose selection remain available.
            </p>
            <Link
              href="/dashboard?tab=builder"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-sm border-2 border-black bg-signal px-3 py-2 text-xs font-black uppercase text-ink"
            >
              Return to Goose Builder
            </Link>
          </Panel>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <FlockerroomConsole user={user} />
    </PageShell>
  );
}
