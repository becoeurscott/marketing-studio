import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Temporary admin access for generating launch assets (creator sheets, product photos, template
 * thumbnails) without spending a customer account. Disabled unless ADMIN_TOKEN is set.
 */
export function isAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const given = request.headers.get("x-admin-token");
  if (!expected || !given || expected.length < 32) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
