"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { AdminSettings } from "@/lib/admin/server";

const FIELDS: { key: keyof AdminSettings; label: string; hint: string; type: "number" | "date"; step?: string }[] = [
  { key: "hfBudgetUsd", label: "Montant rechargé sur Higgsfield ($)", hint: "Total chargé sur le compte API depuis la date ci-dessous.", type: "number", step: "0.01" },
  { key: "hfBudgetSince", label: "Date de la recharge", hint: "Les dépenses sont comptées à partir de ce jour.", type: "date" },
  { key: "hfUsdPerCredit", label: "Coût Higgsfield d'un crédit Marketing Studio ($)", hint: "À vérifier avec votre facture Higgsfield.", type: "number", step: "0.0001" },
  { key: "hfOtherSpendUsd", label: "Autres dépenses Higgsfield ($)", hint: "Générations faites hors de l'app (visuels du site…).", type: "number", step: "0.01" },
  { key: "hfAlertUsd", label: "Alerte quand il reste moins de ($)", hint: "Affiche une alerte rouge sur la vue d'ensemble.", type: "number", step: "1" },
  { key: "xofPerCredit", label: "Prix de vente d'un crédit (FCFA)", hint: "Sert à estimer la valeur des crédits vendus.", type: "number", step: "0.1" },
];

export function SettingsForm({ initial }: { initial: AdminSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])));
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const changed = FIELDS.filter((f) => values[f.key] !== String(initial[f.key]));

  const save = () =>
    start(async () => {
      const patch = Object.fromEntries(changed.map((f) => [f.key, f.type === "number" ? Number(values[f.key]) : values[f.key]])) as Partial<AdminSettings>;
      const r = await saveSettings(patch);
      setNotice(r.ok ? { ok: true, text: "Réglages enregistrés." } : { ok: false, text: r.error ?? "Échec." });
      if (r.ok) router.refresh();
    });

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[12px] font-medium text-text2">{f.label}</span>
            <input
              type={f.type} step={f.step} min={f.type === "number" ? 0 : undefined}
              value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.08] bg-[#0b0b0b] px-3 text-[13px] outline-none focus:border-white/25 [color-scheme:dark]"
            />
            <span className="mt-1 block text-[11px] text-muted">{f.hint}</span>
          </label>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending || !changed.length} className="h-10 rounded-xl bg-white px-5 text-[13px] font-medium text-black disabled:opacity-40">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {changed.length > 0 && <span className="text-[12px] text-muted">{changed.length} modification(s) non enregistrée(s)</span>}
      </div>
      {notice && <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-[12px] ${notice.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{notice.text}</p>}
    </div>
  );
}
