import { NextResponse, type NextRequest } from "next/server";

/**
 * Google sign-in return for the iOS app: hands the one-time code to the app (sokozia://), which
 * exchanges it with its own PKCE verifier. The code is useless without that verifier.
 */
export async function GET(request: NextRequest) {
  const target = new URL("sokozia://auth-callback");
  const code = request.nextUrl.searchParams.get("insforge_code");
  if (code && !request.nextUrl.searchParams.get("error")) target.searchParams.set("insforge_code", code);
  else target.searchParams.set("error", "oauth");
  return NextResponse.redirect(target);
}
