"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adjustCredits, setPlan } from "@/app/admin/actions";

const PLANS = [["starter", "Starter"], ["creator", "Creator"], ["studio", "Studio"], ["agency", "Agency"]] as const;
const input = "h-10 w-full rounded-xl border border-white/[0.08] bg-[#0b0b0b] px-3 text-[13px] outline-none placeholder:text-muted focus:border-white/25";

export function UserActions({ userId, plan, credits }: { userId: string; plan: string; credits: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [planValue, setPlanValue] = useState(plan);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const n = Math.trunc(Number(amount));
  const valid = !!n && reason.trim().length >= 3;

  const submitCredits = (sign: 1 | -1) => {
    if (!valid) return;
    const delta = sign * Math.abs(n);
    if (sign < 0 && Math.abs(n) > credits && !confirm(`Le compte n'a que ${credits} crédits : le solde sera ramené à 0. Continuer ?`)) return;
    start(async () => {
      const r = await adjustCredits(userId, delta, reason);
      setNotice(r.ok ? { ok: true, text: `Nouveau solde : ${r.balance} crédits.` } : { ok: false, text: r.error ?? "Échec." });
      if (r.ok) { setAmount(""); setReason(""); router.refresh(); }
    });
  };

  const submitPlan = () =>
    start(async () => {
      const r = await setPlan(userId, planValue);
      setNotice(r.ok ? { ok: true, text: "Formule mise à jour." } : { ok: false, text: r.error ?? "Échec." });
      if (r.ok) router.refresh();
    });

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[12px] font-medium text-text2">Ajouter ou retirer des crédits</p>
        <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
          <input className={input} inputMode="numeric" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} aria-label="Montant en crédits" />
          <input className={input} placeholder="Raison (visible dans l'historique du client)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} aria-label="Raison" />
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={!valid || pending} onClick={() => submitCredits(1)} className="h-9 flex-1 rounded-xl bg-success/90 text-[13px] font-medium text-black disabled:opacity-40">+ Ajouter</button>
          <button type="button" disabled={!valid || pending} onClick={() => submitCredits(-1)} className="h-9 flex-1 rounded-xl bg-white/[0.08] text-[13px] font-medium disabled:opacity-40">− Retirer</button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-text2">Formule</p>
        <div className="flex gap-2">
          <select className={input} value={planValue} onChange={(e) => setPlanValue(e.target.value)} aria-label="Formule">
            {PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="button" disabled={pending || planValue === plan} onClick={submitPlan} className="h-10 shrink-0 rounded-xl bg-white px-4 text-[13px] font-medium text-black disabled:opacity-40">Enregistrer</button>
        </div>
      </div>

      {notice && <p role="status" className={`rounded-lg px-3 py-2 text-[12px] ${notice.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{notice.text}</p>}
    </div>
  );
}
