import { PageShell } from "@/components/brand-shell";
import { GooseLoginPanel } from "@/components/goose-login-panel";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const redirectTo = next?.startsWith("/") ? next : "/dashboard";
  return (
    <PageShell>
      <section className="mx-auto flex min-h-[calc(100dvh-170px)] w-full max-w-5xl items-center justify-center px-4 pb-8 pt-2">
        <GooseLoginPanel redirectTo={redirectTo} />
      </section>
    </PageShell>
  );
}
