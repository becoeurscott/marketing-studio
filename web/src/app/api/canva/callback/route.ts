import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/insforge/server";
import { FLOW, unseal, exchange, storeTokens, cookieOptions } from "@/lib/canva/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const flow = unseal<{ userId: string; verifier: string; state: string; expires: number }>(jar.get(FLOW)?.value);
  jar.set(FLOW, "", { ...cookieOptions, maxAge: 0 });
  const user = await getSessionUser();
  let status = "error";
  try {
    const code = url.searchParams.get("code");
    if (!user || !flow || flow.userId !== user.id || flow.expires < Date.now() || flow.state !== url.searchParams.get("state") || !code || url.searchParams.has("error")) throw new Error("invalid_flow");
    await storeTokens(user.id, await exchange({ grant_type: "authorization_code", code, code_verifier: flow.verifier, redirect_uri: process.env.CANVA_REDIRECT_URI! }));
    status = "connected";
  } catch { /* Never expose authorization codes or provider details. */ }
  return Response.redirect(new URL(`/templates?canva=${status}`, request.url), 303);
}
