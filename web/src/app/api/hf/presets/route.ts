import { errorResponse, listPresets } from "@/lib/higgsfield/server";

/** Higgsfield Marketing Studio style presets (ids, names, preview images). No secrets returned. */
export async function GET() {
  try {
    return Response.json({ items: await listPresets() }, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch (error) {
    return errorResponse(error);
  }
}
