"use client";

import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { refreshAccount } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

type State = { kind: "checking" } | { kind: "completed"; credits: number } | { kind: "failed" } | { kind: "pending" } | { kind: "error"; message: string };

const POLL_MS = 3000;
const MAX_POLLS = 60; // ~3 minutes, then the customer can check again later

/** Back from pawaPay: polls the payment until it is confirmed (credits are added on the server). */
export default function PaymentReturnPage() {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    let polls = 0;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch(`/api/pay/${id}`, { cache: "no-store" });
        const data = (await res.json()) as { status?: string; credits?: number; error?: string };
        if (!alive) return;
        if (!res.ok) { setState({ kind: "error", message: data.error ?? "Paiement introuvable." }); return; }
        if (data.status === "completed") { await refreshAccount(); setState({ kind: "completed", credits: data.credits ?? 0 }); return; }
        if (data.status === "failed") { setState({ kind: "failed" }); return; }
        polls += 1;
        if (polls >= MAX_POLLS) { setState({ kind: "pending" }); return; }
        timer = setTimeout(check, POLL_MS);
      } catch {
        if (alive) timer = setTimeout(check, POLL_MS);
      }
    };
    void check();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  return (
    <div className="mx-auto max-w-md py-10">
      <Card elevated className="text-center p-8">
        {state.kind === "checking" && (
          <>
            <Loader2 className="mx-auto size-10 animate-spin text-accent" />
            <h1 className="mt-4 text-lg font-semibold">Confirmation du paiement…</h1>
            <p className="mt-1 text-sm text-text2">Validez le paiement sur votre téléphone si ce n&apos;est pas déjà fait. Cette page se met à jour toute seule.</p>
          </>
        )}
        {state.kind === "completed" && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success"><Check className="size-7" /></span>
            <h1 className="mt-4 text-lg font-semibold">Paiement confirmé</h1>
            <p className="mt-1 text-sm text-text2">+{formatNumber(state.credits)} crédits ont été ajoutés à votre compte.</p>
            <Link href="/studio" className="mt-6 block"><Button fullWidth>Commencer à créer</Button></Link>
          </>
        )}
        {state.kind === "failed" && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger/15 text-danger"><X className="size-7" /></span>
            <h1 className="mt-4 text-lg font-semibold">Paiement non abouti</h1>
            <p className="mt-1 text-sm text-text2">Aucun montant n&apos;a été débité. Vous pouvez réessayer.</p>
            <Link href="/credits" className="mt-6 block"><Button fullWidth>Réessayer</Button></Link>
          </>
        )}
        {state.kind === "pending" && (
          <>
            <Loader2 className="mx-auto size-10 text-muted" />
            <h1 className="mt-4 text-lg font-semibold">Paiement en attente</h1>
            <p className="mt-1 text-sm text-text2">Votre opérateur n&apos;a pas encore confirmé. Vos crédits seront ajoutés dès la confirmation.</p>
            <Button className="mt-6" fullWidth onClick={() => window.location.reload()}>Vérifier à nouveau</Button>
          </>
        )}
        {state.kind === "error" && (
          <>
            <h1 className="text-lg font-semibold">Paiement introuvable</h1>
            <p className="mt-1 text-sm text-text2">{state.message}</p>
            <Link href="/credits" className="mt-6 block"><Button fullWidth variant="secondary">Retour aux crédits</Button></Link>
          </>
        )}
      </Card>
    </div>
  );
}
