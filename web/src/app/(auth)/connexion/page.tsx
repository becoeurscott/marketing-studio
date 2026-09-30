import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, safeNext } from "@/lib/insforge/server";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = { oauth: "La connexion avec Google n’a pas abouti. Réessayez." };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const target = safeNext(next);
  if (await getSessionUser()) redirect(target);
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Bon retour 👋</h1>
      <p className="mt-1 mb-6 text-sm text-text2">Connectez-vous pour retrouver vos créations.</p>
      <AuthForm mode="signin" next={target} error={error ? ERRORS[error] ?? ERRORS.oauth : undefined} />
    </>
  );
}
