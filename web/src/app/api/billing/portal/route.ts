import { stripe, stripeConfigured } from "@/lib/billing/stripe";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/** Stripe customer portal (change plan, cancel, invoices). Returns { url }. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  if (!stripeConfigured()) return Response.json({ error: "Le paiement par carte arrive bientôt." }, { status: 503 });
  const { data } = await adminClient().database.from("ms_subscriptions").select("customer_id").eq("user_id", user.id).limit(1);
  const customer = (data?.[0] as { customer_id: string } | undefined)?.customer_id;
  if (!customer) return Response.json({ error: "Aucun abonnement." }, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  try {
    const s = await stripe<{ url: string }>("/billing_portal/sessions", { customer, return_url: `${origin}/credits` });
    return Response.json({ url: s.url });
  } catch {
    return Response.json({ error: "Gestion de l'abonnement indisponible." }, { status: 502 });
  }
}
