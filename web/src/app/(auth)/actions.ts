"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";
import { getSessionUser, safeNext, serverClient, type SessionUser } from "@/lib/insforge/server";

/** Form state shared by the auth forms. Never contains tokens. */
export type AuthState =
  | { error?: string; info?: string; email?: string; step?: "verify" | "code" | "reset-code" | "reset-password"; resetToken?: string }
  | undefined;

const fr = (msg?: string): string => {
  const m = (msg ?? "").toLowerCase();
  if (m.includes("already")) return "Un compte existe déjà avec cet e-mail. Connectez-vous.";
  if (m.includes("verif")) return "Votre e-mail n’est pas encore vérifié. Entrez le code reçu.";
  if (m.includes("invalid") || m.includes("credential") || m.includes("password")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("otp") || m.includes("code") || m.includes("expired")) return "Code incorrect ou expiré.";
  if (m.includes("too many") || m.includes("rate")) return "Trop de tentatives. Patientez une minute.";
  return "Une erreur est survenue. Réessayez.";
};

const emailOf = (form: FormData) => String(form.get("email") ?? "").trim().toLowerCase();
const nextOf = (form: FormData, fallback = "/home") => safeNext(form.get("next"), fallback);
/** Session-changing calls (write/clear the auth cookies). */
const auth = async () => createAuthActions({ cookies: await cookies() });
/** Calls that don't create a session: resend codes, password reset. */
const plainAuth = async () => (await serverClient()).auth;

/* ---------- Email + password ---------- */

export async function signInWithPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  const { error } = await (await auth()).signInWithPassword({ email, password: String(form.get("password") ?? "") });
  if (error) {
    const msg = fr(error.message);
    // Unverified account: send a fresh code and switch to the code step.
    if (error.statusCode === 403) {
      await (await plainAuth()).resendVerificationEmail({ email });
      return { step: "verify", email, error: msg };
    }
    return { error: msg, email };
  }
  redirect(nextOf(form));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Indiquez votre nom ou celui de votre boutique.", email };
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères.", email };
  const { data, error } = await (await auth()).signUp({ email, password, name });
  if (error) return { error: fr(error.message), email };
  if (data && "accessToken" in data && data.accessToken) redirect(nextOf(form, "/onboarding"));
  return { step: "verify", email, info: "Nous vous avons envoyé un code à 6 chiffres par e-mail." };
}

/** 6-digit code sent after sign-up (email verification). Signs the user in on success. */
export async function verifyEmail(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  const { error } = await (await auth()).verifyEmail({ email, otp: String(form.get("otp") ?? "").trim() });
  if (error) return { step: "verify", email, error: fr(error.message) };
  redirect(nextOf(form, "/onboarding"));
}

/* ---------- Passwordless email code ---------- */

export async function sendEmailCode(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Entrez une adresse e-mail valide.", email };
  const { error } = await (await auth()).signInWithOtp({ email });
  if (error) return { error: fr(error.message), email };
  // Same message whether or not the account exists (no account enumeration).
  return { step: "code", email, info: "Si l’adresse est valide, un code à 6 chiffres vient de vous être envoyé." };
}

export async function verifyEmailCode(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  const name = String(form.get("name") ?? "").trim() || undefined;
  const { error } = await (await auth()).verifyOtp({ email, otp: String(form.get("otp") ?? "").trim(), name });
  if (error) return { step: "code", email, error: fr(error.message) };
  redirect(nextOf(form));
}

/* ---------- Google ---------- */

export async function signInWithGoogle(form: FormData): Promise<void> {
  const store = await cookies();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await (await auth()).signInWithOAuth("google", {
    redirectTo: new URL("/api/auth/callback", origin).toString(),
    additionalParams: { prompt: "select_account" },
    skipBrowserRedirect: true,
  });
  if (error || !data?.url || !data.codeVerifier) redirect("/connexion?error=oauth");
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
  store.set("insforge_code_verifier", data.codeVerifier, opts);
  store.set("sz_next", nextOf(form), opts);
  redirect(data.url);
}

/* ---------- Password reset (code method) ---------- */

export async function sendResetCode(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  await (await plainAuth()).sendResetPasswordEmail({ email });
  return { step: "reset-code", email, info: "Si un compte existe, un code de réinitialisation vient d’être envoyé." };
}

export async function checkResetCode(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  const { data, error } = await (await plainAuth()).exchangeResetPasswordToken({ email, code: String(form.get("otp") ?? "").trim() });
  if (error || !data?.token) return { step: "reset-code", email, error: fr(error?.message) };
  return { step: "reset-password", email, resetToken: data.token };
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailOf(form);
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 6) return { step: "reset-password", email, resetToken: token, error: "Le mot de passe doit faire au moins 6 caractères." };
  const { error } = await (await plainAuth()).resetPassword({ newPassword: password, otp: token });
  if (error) return { step: "reset-password", email, resetToken: token, error: fr(error.message) };
  return { email, info: "Mot de passe modifié. Connectez-vous avec le nouveau mot de passe." };
}

/* ---------- Sign out ---------- */

export async function signOut(): Promise<void> {
  await (await auth()).signOut();
  redirect("/connexion");
}

/** Current account for the client store (id, email, name only). */
export async function currentAccount(): Promise<SessionUser | null> {
  return getSessionUser();
}
