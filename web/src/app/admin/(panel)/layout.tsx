import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { currentAdmin } from "@/lib/admin/server";
import { getSessionUser } from "@/lib/insforge/server";
import { adminSignOut } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/connexion");
  const admin = await currentAdmin();
  if (!admin) {
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-6 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">403</p>
          <h1 className="mt-2 text-2xl font-semibold">Accès réservé aux administrateurs</h1>
          <p className="mt-2 text-sm text-text2">Le compte {user.email} n&apos;a pas accès au tableau de bord.</p>
          <div className="mt-6 flex justify-center gap-2">
            <form action={adminSignOut}><button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Changer de compte</button></form>
            <Link href="/home" className="rounded-full border border-white/15 px-4 py-2 text-sm">Retour à l&apos;app</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] p-0 lg:p-3">
      <div className="flex min-h-dvh lg:min-h-[calc(100dvh-24px)] lg:rounded-[22px] lg:border lg:border-white/[0.06] bg-black overflow-hidden">
        <AdminNav admin={{ name: admin.name || admin.email.split("@")[0], email: admin.email }} />
        <div className="flex-1 min-w-0 px-4 pb-24 pt-4 sm:px-6 lg:pb-8">{children}</div>
      </div>
    </div>
  );
}
