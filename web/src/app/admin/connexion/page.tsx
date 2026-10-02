import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSignInForm } from "@/components/admin/AdminSignInForm";
import { currentAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "Connexion admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Sign-in only (no account creation): the admin allow-list is checked after sign-in by the /admin layout. */
export default async function AdminSignIn() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-black px-4">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[110px]" />
      <div className="relative w-full max-w-sm rounded-[22px] border border-white/[0.08] bg-[#0f0f0f] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-black text-black">S</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Sokozia</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Administration</span>
          </span>
        </div>
        <h1 className="mt-6 text-xl font-semibold tracking-tight">Connexion administrateur</h1>
        <p className="mt-1 text-[13px] text-muted">Réservé aux comptes autorisés. Aucune création de compte ici.</p>
        <AdminSignInForm />
      </div>
    </main>
  );
}
