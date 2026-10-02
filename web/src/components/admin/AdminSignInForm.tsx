"use client";

import { useActionState } from "react";
import { signInWithPassword } from "@/app/(auth)/actions";

const input = "mt-1.5 h-11 w-full rounded-xl border border-white/[0.08] bg-black px-3.5 text-[14px] outline-none placeholder:text-muted focus:border-white/25";

export function AdminSignInForm() {
  const [state, action, pending] = useActionState(signInWithPassword, undefined);
  const error = state?.error ?? null;

  return (
    <div className="mt-6 space-y-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value="/admin" />
        <label className="block">
          <span className="text-[12px] font-medium text-text2">E-mail</span>
          <input name="email" type="email" autoComplete="username" required defaultValue={state?.email} className={input} placeholder="vous@exemple.com" />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-text2">Mot de passe</span>
          <input name="password" type="password" autoComplete="current-password" required className={input} />
        </label>
        {error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}
        <button disabled={pending} className="h-11 w-full rounded-xl bg-gradient-to-r from-accent to-[#ef4444] text-[14px] font-medium text-white disabled:opacity-50">
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
