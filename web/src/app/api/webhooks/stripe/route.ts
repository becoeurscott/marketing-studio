import { creditInvoice, planById, saveSubscription, stripe, verifyStripeSignature } from "@/lib/billing/stripe";

type Meta = { user_id?: string; plan?: string };
type Sub = { id: string; customer: string; status: string; metadata: Meta; current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };

const periodEnd = (s: Sub) => {
  const t = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return t ? new Date(t * 1000).toISOString() : null;
};

/**
 * Stripe events: each paid invoice of a monthly pass adds the plan's credits (once per invoice);
 * subscription changes keep ms_subscriptions in sync. Signature checked on the raw body.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"))) return new Response("Invalid signature", { status: 400 });
  const event = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
  try {
    if (event.type === "invoice.paid") {
      const inv = event.data.object as { id: string; amount_paid: number; subscription?: string; parent?: { subscription_details?: { subscription?: string } } };
      const subId = inv.subscription ?? inv.parent?.subscription_details?.subscription;
      if (subId) {
        const sub = await stripe<Sub>(`/subscriptions/${subId}`, undefined, "GET");
        const plan = planById(sub.metadata.plan);
        if (plan && sub.metadata.user_id) {
          await creditInvoice(inv.id, sub.metadata.user_id, plan, inv.amount_paid);
          await saveSubscription({ user_id: sub.metadata.user_id, customer_id: sub.customer, subscription_id: sub.id, plan: plan.id, status: sub.status, current_period_end: periodEnd(sub) });
        }
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted" || event.type === "customer.subscription.created") {
      const sub = event.data.object as unknown as Sub;
      if (sub.metadata?.user_id) {
        await saveSubscription({ user_id: sub.metadata.user_id, customer_id: sub.customer, subscription_id: sub.id, plan: sub.metadata.plan ?? "", status: event.type.endsWith("deleted") ? "canceled" : sub.status, current_period_end: periodEnd(sub) });
      }
    }
  } catch {
    return new Response("Retry later", { status: 500 });
  }
  return Response.json({ received: true });
}
