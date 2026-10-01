import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

/** App areas that need an account (the landing and auth pages stay public). */
const PROTECTED = /^\/(home|studio|projects|assets|campaigns|creators|credits|favorites|generations|help|notifications|pricing|profile|settings|templates|workspace|brand)(\/|$)/;

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });

  const { pathname, search } = request.nextUrl;
  // API routes: refresh the session cookies above, but answer with 401 themselves (no redirect).
  if (pathname.startsWith("/api/")) return response;
  const signedIn = response.cookies.get("insforge_access_token")?.value || request.cookies.get("insforge_access_token")?.value || request.cookies.get("insforge_refresh_token")?.value;
  const onboarding = /^\/onboarding(\/|$)/.test(pathname);
  if ((PROTECTED.test(pathname) || onboarding) && !signedIn) {
    // First-time visitors starting the onboarding are sent to sign-up, everyone else to sign-in.
    const url = new URL(onboarding ? "/inscription" : "/connexion", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/|api/auth/|favicon.ico|showcase/|styles/|.*\\.(?:png|jpg|jpeg|webp|svg|mp4|ico)$).*)"] };
