import { redirect } from "next/navigation";
import { PageShell } from "@/components/brand-shell";
import { DashboardConsole } from "@/components/dashboard-console";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await readStore();
  const outcomes = store.outcomes.filter((outcome) => (
    outcome.players.X?.userId === user.id || outcome.players.O?.userId === user.id
  )).slice(0, 5);

  return (
    <PageShell>
      <DashboardConsole user={user} outcomes={outcomes} initialTab={tab === "builder" || tab === "games" ? tab : "overview"} />
    </PageShell>
  );
}
