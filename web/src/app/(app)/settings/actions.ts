"use server";

import { serverClient } from "@/lib/insforge/server";

/** Real account details for Paramètres (never trusts the browser for the e-mail). */
export interface AccountDetails {
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string | null;
  emailVerified: boolean;
}

type RawUser = {
  email?: string;
  createdAt?: string;
  created_at?: string;
  emailVerified?: boolean;
  email_verified?: boolean;
  profile?: { name?: string; avatar_url?: string; avatarUrl?: string } | null;
};

async function currentUser(): Promise<RawUser | null> {
  const client = await serverClient();
  const { data } = await client.auth.getCurrentUser();
  return (data?.user as RawUser | null | undefined) ?? null;
}

export async function accountDetails(): Promise<AccountDetails | null> {
  const u = await currentUser();
  if (!u?.email) return null;
  return {
    email: u.email,
    name: u.profile?.name ?? "",
    avatarUrl: u.profile?.avatar_url ?? u.profile?.avatarUrl ?? "",
    createdAt: u.createdAt ?? u.created_at ?? null,
    emailVerified: u.emailVerified ?? u.email_verified ?? true,
  };
}

/** Saves the display name (and avatar) on the InsForge account, so every device sees it. */
export async function updateProfile(input: { name: string; avatarUrl?: string }): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim().slice(0, 80);
  if (!name) return { ok: false, error: "Le nom est obligatoire." };
  const avatar = input.avatarUrl && /^https:\/\//.test(input.avatarUrl) ? input.avatarUrl : undefined;
  const client = await serverClient();
  const { error } = await client.auth.setProfile({ name, ...(avatar ? { avatar_url: avatar } : {}) });
  if (error) return { ok: false, error: "Impossible d’enregistrer le profil. Réessayez." };
  return { ok: true };
}

/** Step 1 of a password change: a 6-digit code is e-mailed to the signed-in account. */
export async function sendPasswordCode(): Promise<{ ok: boolean; email?: string; error?: string }> {
  const u = await currentUser();
  if (!u?.email) return { ok: false, error: "Reconnectez-vous pour changer le mot de passe." };
  const client = await serverClient();
  const { error } = await client.auth.sendResetPasswordEmail({ email: u.email });
  if (error) return { ok: false, error: "Envoi du code impossible. Réessayez dans une minute." };
  return { ok: true, email: u.email };
}

/** Step 2: checks the code and sets the new password (also works for Google / code-only accounts). */
export async function changePassword(input: { code: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  const u = await currentUser();
  if (!u?.email) return { ok: false, error: "Reconnectez-vous pour changer le mot de passe." };
  if (input.password.length < 6) return { ok: false, error: "Le mot de passe doit faire au moins 6 caractères." };
  const client = await serverClient();
  const { data, error } = await client.auth.exchangeResetPasswordToken({ email: u.email, code: input.code.trim() });
  if (error || !data?.token) return { ok: false, error: "Code incorrect ou expiré." };
  const res = await client.auth.resetPassword({ newPassword: input.password, otp: data.token });
  if (res.error) return { ok: false, error: "Impossible de changer le mot de passe. Réessayez." };
  return { ok: true };
}
