"use client";

import { KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  checkResetCode, resetPassword, sendEmailCode, sendResetCode, signInWithGoogle, signInWithPassword, signUp,
  verifyEmail, verifyEmailCode, type AuthState,
} from "./actions";

type Mode = "signin" | "signup";
type Method = "code" | "password";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);

function Message({ state }: { state: AuthState }) {
  if (!state?.error && !state?.info) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={cn("rounded-md px-3 py-2 text-[13px]", state.error ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
      {state.error ?? state.info}
    </p>
  );
}

function OtpInput({ name = "otp" }: { name?: string }) {
  return (
    <Input label="Code à 6 chiffres" name={name} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required placeholder="123456" className="[&_input]:tracking-[0.5em] [&_input]:text-center [&_input]:text-lg" />
  );
}

/** Email-code flow: request a code, then enter it. Creates the account on first use. */
function EmailCodeForm({ next, askName }: { next: string; askName: boolean }) {
  const [sent, send, sending] = useActionState(sendEmailCode, undefined);
  const [verified, verify, verifying] = useActionState(verifyEmailCode, undefined);
  const email = verified?.email ?? sent?.email;
  const step = verified?.step ?? sent?.step;

  if (step === "code") {
    return (
      <form action={verify} className="space-y-3">
        <Message state={verified ?? sent} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <p className="text-[13px] text-text2">Code envoyé à <span className="text-text font-medium">{email}</span>. Il expire dans 5 minutes.</p>
        {askName && <Input label="Nom ou nom de la boutique" name="name" autoComplete="name" placeholder="Awa Tissus" />}
        <OtpInput />
        <Button type="submit" fullWidth loading={verifying}>Valider le code</Button>
        <button type="submit" formAction={send} formNoValidate className="w-full text-center text-[13px] text-text2 hover:text-text">Renvoyer un code</button>
      </form>
    );
  }
  return (
    <form action={send} className="space-y-3">
      <Message state={sent} />
      <Input label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={email} placeholder="vous@exemple.com" />
      <Button type="submit" fullWidth loading={sending} leftIcon={<Mail className="size-4" />}>Recevoir un code par e-mail</Button>
    </form>
  );
}

/** Email + password sign-in, with the forgotten-password flow (code method). */
function PasswordSignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, undefined);
  const [verifyState, verify, verifying] = useActionState(verifyEmail, undefined);
  const [forgot, setForgot] = useState(false);

  if (state?.step === "verify" || verifyState?.step === "verify") {
    const email = verifyState?.email ?? state?.email;
    return (
      <form action={verify} className="space-y-3">
        <Message state={verifyState ?? state} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <p className="text-[13px] text-text2">Un code de vérification a été envoyé à <span className="text-text font-medium">{email}</span>.</p>
        <OtpInput />
        <Button type="submit" fullWidth loading={verifying}>Vérifier mon e-mail</Button>
      </form>
    );
  }
  if (forgot) return <ResetPasswordForm onDone={() => setForgot(false)} />;
  return (
    <form action={action} className="space-y-3">
      <Message state={state} />
      <input type="hidden" name="next" value={next} />
      <Input label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state?.email} placeholder="vous@exemple.com" />
      <Input label="Mot de passe" name="password" type="password" autoComplete="current-password" required minLength={6} />
      <div className="flex justify-end">
        <button type="button" onClick={() => setForgot(true)} className="text-[13px] text-highlight hover:underline">Mot de passe oublié ?</button>
      </div>
      <Button type="submit" fullWidth loading={pending} leftIcon={<KeyRound className="size-4" />}>Se connecter</Button>
    </form>
  );
}

function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const [sent, send, sending] = useActionState(sendResetCode, undefined);
  const [checked, check, checking] = useActionState(checkResetCode, undefined);
  const [reset, doReset, resetting] = useActionState(resetPassword, undefined);

  if (reset && !reset.step) {
    return (
      <div className="space-y-3">
        <Message state={reset} />
        <Button fullWidth onClick={onDone}>Retour à la connexion</Button>
      </div>
    );
  }
  const current = reset ?? checked ?? sent;
  if (current?.step === "reset-password") {
    return (
      <form action={doReset} className="space-y-3">
        <Message state={reset} />
        <input type="hidden" name="email" value={current.email} />
        <input type="hidden" name="token" value={current.resetToken} />
        <Input label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" required minLength={6} />
        <Button type="submit" fullWidth loading={resetting}>Changer le mot de passe</Button>
      </form>
    );
  }
  if (current?.step === "reset-code") {
    return (
      <form action={check} className="space-y-3">
        <Message state={checked ?? sent} />
        <input type="hidden" name="email" value={current.email} />
        <OtpInput />
        <Button type="submit" fullWidth loading={checking}>Valider le code</Button>
      </form>
    );
  }
  return (
    <form action={send} className="space-y-3">
      <p className="text-[13px] text-text2">Entrez votre e-mail : nous vous envoyons un code pour choisir un nouveau mot de passe.</p>
      <Input label="Adresse e-mail" name="email" type="email" autoComplete="email" required />
      <Button type="submit" fullWidth loading={sending}>Envoyer le code</Button>
      <button type="button" onClick={onDone} className="w-full text-center text-[13px] text-text2 hover:text-text">Annuler</button>
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [verifyState, verify, verifying] = useActionState(verifyEmail, undefined);

  if (state?.step === "verify" || verifyState?.step === "verify") {
    const email = verifyState?.email ?? state?.email;
    return (
      <form action={verify} className="space-y-3">
        <Message state={verifyState ?? state} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <p className="text-[13px] text-text2">Dernière étape : entrez le code envoyé à <span className="text-text font-medium">{email}</span>.</p>
        <OtpInput />
        <Button type="submit" fullWidth loading={verifying}>Créer mon compte</Button>
      </form>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <Message state={state} />
      <input type="hidden" name="next" value={next} />
      <Input label="Nom ou nom de la boutique" name="name" autoComplete="name" required placeholder="Awa Tissus" />
      <Input label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state?.email} placeholder="vous@exemple.com" />
      <Input label="Mot de passe" name="password" type="password" autoComplete="new-password" required minLength={6} hint="6 caractères minimum." />
      <Button type="submit" fullWidth loading={pending}>Créer mon compte</Button>
    </form>
  );
}

export function AuthForm({ mode, next, error }: { mode: Mode; next: string; error?: string }) {
  const [method, setMethod] = useState<Method>("code");
  const signup = mode === "signup";
  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" fullWidth size="lg" leftIcon={<GoogleIcon />}>Continuer avec Google</Button>
      </form>

      <div className="flex items-center gap-3 text-[12px] text-muted"><span className="h-px flex-1 bg-border" />ou avec votre e-mail<span className="h-px flex-1 bg-border" /></div>

      <div role="tablist" aria-label="Méthode" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        {([["code", "Code par e-mail"], ["password", "Mot de passe"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={method === id} onClick={() => setMethod(id)} className={cn("h-9 rounded-md text-[13px] font-medium transition-colors", method === id ? "bg-elevated text-text border border-border-strong" : "text-text2 hover:text-text")}>
            {label}
          </button>
        ))}
      </div>

      {method === "code" ? <EmailCodeForm next={next} askName={signup} /> : signup ? <SignUpForm next={next} /> : <PasswordSignInForm next={next} />}

      <p className="text-center text-[13px] text-text2">
        {signup ? <>Déjà un compte ? <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="text-highlight hover:underline">Se connecter</Link></> : <>Pas encore de compte ? <Link href={`/inscription?next=${encodeURIComponent(next)}`} className="text-highlight hover:underline">Créer un compte</Link></>}
      </p>
    </div>
  );
}
