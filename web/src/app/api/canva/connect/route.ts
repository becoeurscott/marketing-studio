import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/insforge/server";
import { cookieOptions, FLOW, seal, configured } from "@/lib/canva/server";
import { guard } from "@/lib/higgsfield/guard";

export async function POST(request: Request) {
  const blocked = guard(request, { limit: 30 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  if (!configured()) return Response.json({ error: "La connexion Canva n’est pas encore configurée." }, { status: 503 });
  const verifier = randomBytes(32).toString("base64url");
  const state = randomBytes(32).toString("base64url");
  (await cookies()).set(FLOW, seal({ userId: user.id, verifier, state, expires: Date.now() + 600000 }), { ...cookieOptions, maxAge: 600 });
  const url = new URL("https://www.canva.com/api/oauth/authorize");
  url.search = new URLSearchParams({ client_id: process.env.CANVA_CLIENT_ID!, redirect_uri: process.env.CANVA_REDIRECT_URI!, response_type: "code", code_challenge_method: "S256", code_challenge: createHash("sha256").update(verifier).digest("base64url"), state, scope: "asset:read asset:write brandtemplate:meta:read brandtemplate:content:read design:content:read design:content:write design:meta:read" }).toString();
  return Response.json({ url: url.toString() });
}
