"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { refundJobCredits } from "@/app/admin/actions";

export function RefundButton({ jobId, cost }: { jobId: string; cost: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = () => {
    const reason = prompt(`Rembourser ${cost} crédits au client ? Indiquez la raison :`, "Résultat de mauvaise qualité");
    if (reason === null) return;
    start(async () => {
      const r = await refundJobCredits(jobId, reason);
      if (!r.ok) alert(r.error ?? "Échec du remboursement.");
      router.refresh();
    });
  };
  return (
    <button type="button" onClick={run} disabled={pending} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] text-text2 hover:border-white/25 hover:text-text disabled:opacity-40">
      {pending ? "…" : "Rembourser"}
    </button>
  );
}
