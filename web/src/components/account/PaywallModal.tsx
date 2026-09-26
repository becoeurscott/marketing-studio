"use client";

import { Check, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { plans } from "@/data";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS, type CreditAction, type PlanId } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export type PaywallReason = "credits" | "plan";

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** Why the feature is locked. */
  reason?: PaywallReason;
  /** Credits required for the blocked action (credits reason). */
  required?: number;
  /** Plan needed to unlock (plan reason). */
  requiredPlan?: PlanId;
  /** Feature name shown in the copy, e.g. "Video generation". */
  feature?: string;
}

const PLAN_ORDER: PlanId[] = ["starter", "creator", "studio", "agency"];
export const planRank = (p: PlanId) => PLAN_ORDER.indexOf(p);

/**
 * Locked-feature dialog. Reusable by any page: either not enough credits
 * (offers to buy credits) or the plan is too low (offers to upgrade).
 */
export function PaywallModal({ open, onClose, reason = "credits", required = 0, requiredPlan = "creator", feature }: PaywallModalProps) {
  const router = useRouter();
  const credits = useStore((s) => s.credits);
  const plan = useStore((s) => s.plan);
  const target = plans.find((p) => p.id === requiredPlan) ?? plans[1];
  const isCredits = reason === "credits";

  const go = (href: string) => { onClose(); router.push(href); };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="pt-5 text-center">
        <div className="mx-auto size-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-4">
          {isCredits ? <Sparkles className="size-5 text-highlight" /> : <Lock className="size-5 text-highlight" />}
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{isCredits ? "Crédits insuffisants" : `${feature ?? "Cette fonctionnalité"} nécessite le forfait ${target.name}`}</h2>
        <p className="text-sm text-text2 mt-1.5">
          {isCredits
            ? <>{feature ?? "Cette action"} coûte <span className="text-text font-medium">{formatNumber(required)}</span> crédits. Vous en avez <span className="text-text font-medium">{formatNumber(credits)}</span>.</>
            : <>Vous êtes sur le forfait <span className="text-text font-medium capitalize">{plan}</span>. Passez à {target.name} ({target.priceMonthly} $/mois) pour la débloquer.</>}
        </p>
        {!isCredits && (
          <ul className="mt-4 text-left space-y-1.5 text-[13px] text-text2 bg-surface border border-border rounded-md p-3">
            {target.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2"><Check className="size-3.5 text-success shrink-0" />{h}</li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <Button fullWidth onClick={() => go(isCredits ? "/credits" : "/pricing")}>{isCredits ? "Acheter des crédits" : `Passer à ${target.name}`}</Button>
          <Button fullWidth variant="ghost" onClick={() => go(isCredits ? "/pricing" : "/credits")}>{isCredits ? "Voir les forfaits" : "Acheter plutôt des crédits"}</Button>
        </div>
      </div>
    </Modal>
  );
}

export interface CreditsGuard {
  /** Returns true if the action may proceed; otherwise opens the paywall. */
  check: (action: Exclude<CreditAction, "purchase" | "bonus"> | number, feature?: string) => boolean;
  /** Require at least this plan; opens the plan paywall when below. */
  requirePlan: (plan: PlanId, feature?: string) => boolean;
  /** Render this once in the page tree. */
  paywall: ReactNode;
  credits: number;
  plan: PlanId;
}

/**
 * `const guard = useCreditsGuard();`
 * `if (!guard.check("video", "Video generation")) return;` … `{guard.paywall}`
 */
export function useCreditsGuard(): CreditsGuard {
  const credits = useStore((s) => s.credits);
  const plan = useStore((s) => s.plan);
  const [state, setState] = useState<{ open: boolean; reason: PaywallReason; required: number; requiredPlan: PlanId; feature?: string }>({
    open: false, reason: "credits", required: 0, requiredPlan: "creator",
  });
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const check = useCallback<CreditsGuard["check"]>((action, feature) => {
    const required = typeof action === "number" ? action : CREDIT_COSTS[action];
    if (credits >= required) return true;
    setState({ open: true, reason: "credits", required, requiredPlan: "creator", feature });
    return false;
  }, [credits]);

  const requirePlan = useCallback<CreditsGuard["requirePlan"]>((requiredPlan, feature) => {
    if (planRank(plan) >= planRank(requiredPlan)) return true;
    setState({ open: true, reason: "plan", required: 0, requiredPlan, feature });
    return false;
  }, [plan]);

  const paywall = <PaywallModal open={state.open} onClose={close} reason={state.reason} required={state.required} requiredPlan={state.requiredPlan} feature={state.feature} />;
  return { check, requirePlan, paywall, credits, plan };
}
