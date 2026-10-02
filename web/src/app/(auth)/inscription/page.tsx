import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, safeNext } from "@/lib/insforge/server";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // New accounts go through the campaign onboarding first.
  const target = safeNext(next, "/onboarding");
  if (await getSessionUser()) redirect(target);
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Créez votre compte</h1>
      <p className="mt-1 mb-6 text-sm text-text2">50 crédits offerts : votre première photo produit est gratuite. Sans carte bancaire.</p>
      <AuthForm mode="signup" next={target} />
      <p className="mt-6 text-center text-[11px] text-muted">En créant un compte, vous acceptez les conditions d’utilisation de Sokozia.</p>
    </>
  );
}
