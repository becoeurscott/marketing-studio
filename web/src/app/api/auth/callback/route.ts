import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { safeNext } from "@/lib/insforge/server";

/** Google OAuth return: exchange the code on the server so the session lands in httpOnly cookies. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  if (request.nextUrl.searchParams.get("error") || !code) {
    return NextResponse.redirect(new URL("/connexion?error=oauth", request.url));
  }
  const store = await cookies();
  const verifier = store.get("insforge_code_verifier")?.value;
  if (!verifier) return NextResponse.redirect(new URL("/connexion?error=oauth", request.url));

  const next = safeNext(store.get("sz_next")?.value);
  const response = NextResponse.redirect(new URL(next, request.url));
  const auth = createAuthActions({ requestCookies: request.cookies, responseCookies: response.cookies });
  const { data, error } = await auth.exchangeOAuthCode(code, verifier);
  if (error || !data?.user) return NextResponse.redirect(new URL("/connexion?error=oauth", request.url));
  response.cookies.delete("insforge_code_verifier");
  response.cookies.delete("sz_next");
  return response;
}
