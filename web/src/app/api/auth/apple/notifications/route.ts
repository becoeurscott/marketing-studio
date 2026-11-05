import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const issuer = "https://appleid.apple.com";

/**
 * Receives Sign in with Apple server-to-server notifications.
 *
 * Apple signs every notification as a JWT. Verify it against Apple's public keys before
 * accepting it so a third party cannot forge account or email-preference events.
 */
export async function POST(request: Request) {
  let body: { signedPayload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof body.signedPayload !== "string") {
    return NextResponse.json({ error: "Missing signedPayload." }, { status: 400 });
  }

  try {
    const audience = process.env.APPLE_SIGN_IN_CLIENT_ID ?? "com.sokozia.app";
    const { payload } = await jwtVerify(body.signedPayload, appleKeys, {
      issuer,
      audience,
    });

    // Do not log the user identifier or e-mail address. Vercel logs retain only the event type,
    // which is enough to diagnose delivery while preserving user privacy.
    console.info("Verified Sign in with Apple notification", {
      notificationType: payload.notification_type ?? "unknown",
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid Apple notification signature." }, { status: 401 });
  }
}
