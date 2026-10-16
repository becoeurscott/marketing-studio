import { customerFor, planById, stripe, stripeConfigured, STRIPE_CURRENCY } from "@/lib/billing/stripe";
import { getSessionUser } from "@/lib/insforge/server";

/** Starts a Stripe Checkout for a monthly pass. Returns { url } to open (web or iOS). */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  if (!stripeConfigured()) return Response.json({ error: "Le paiement par carte arrive bientôt." }, { status: 503 });
  const { plan: planId } = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = planById(planId);
  if (!plan) return Response.json({ error: "Abonnement inconnu." }, { status: 400 });
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  try {
    const customer = await customerFor(user.id, user.email);
    const session = await stripe<{ url: string }>("/checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": STRIPE_CURRENCY,
      "line_items[0][price_data][unit_amount]": plan.priceXof,
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": `Marketing Studio ${plan.name} · ${plan.credits} crédits / mois`,
      "metadata[user_id]": user.id,
      "metadata[plan]": plan.id,
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][plan]": plan.id,
      success_url: `${origin}/credits?abonnement=ok`,
      cancel_url: `${origin}/pricing`,
    });
    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: "Le paiement n'a pas pu démarrer. Réessayez." }, { status: 502 });
  }
}
