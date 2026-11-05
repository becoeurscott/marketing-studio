import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/insforge/server";
import { adminClient, MEDIA_BUCKET } from "@/lib/insforge/admin";
import { normalizePhoto, UploadError } from "@/lib/upload";
import { guard } from "@/lib/higgsfield/guard";
import { accessToken, allowedTemplate, canva, CanvaError, configured, cookieOptions, failure, Job, readTicket, SESSION, session, ticket } from "@/lib/canva/server";

export const runtime = "nodejs";
type Dataset = Record<string, { type: string }>;
type Template = { id: string; title: string; thumbnail?: { url: string } };
const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  try {
    const url = new URL(request.url);
    if (!url.searchParams.has("catalog") && !url.searchParams.has("template")) return json({ configured: configured(), connected: Boolean(await session(user.id)) });
    const token = await accessToken(user.id);
    const id = url.searchParams.get("template");
    if (id) {
      allowedTemplate(id);
      const result = await canva<{ dataset?: Dataset }>(token, `/brand-templates/${id}/dataset`);
      return json({ fields: result.dataset ?? {} });
    }
    const continuation = url.searchParams.get("continuation");
    if (continuation && continuation.length > 2000) throw new CanvaError("Pagination invalide.");
    const result = await canva<{ items: Template[]; continuation?: string }>(token, `/brand-templates?dataset=non_empty${continuation ? `&continuation=${encodeURIComponent(continuation)}` : ""}`);
    const ids = (process.env.CANVA_TEMPLATE_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
    return json({ items: result.items.filter(t => !ids.length || ids.includes(t.id)).map(t => ({ id: t.id, title: t.title, thumbnail: t.thumbnail?.url })), continuation: result.continuation });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const blocked = guard(request, { limit: 600 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  try {
    const action = new URL(request.url).searchParams.get("action");
    if (action === "disconnect") {
      // Remove this browser's encrypted connection; account-wide revocation remains available in Canva.
      (await cookies()).set(SESSION, "", { ...cookieOptions, maxAge: 0 });
      return json({ ok: true });
    }
    const token = await accessToken(user.id);
    if (action === "upload") {
      const bytes = await normalizePhoto(request);
      const result = await canva<{ job: Job }>(token, "/asset-uploads", { method: "POST", headers: { "Content-Type": "application/octet-stream", "Asset-Upload-Metadata": JSON.stringify({ name_base64: Buffer.from("Marketing Studio.jpg").toString("base64") }) }, body: new Uint8Array(bytes) });
      return json({ ticket: ticket(user.id, "upload", result.job.id) });
    }
    const body = await request.json().catch(() => { throw new CanvaError("Requête invalide."); }) as Record<string, unknown>;
    if (action === "poll") {
      const kind = String(body.kind);
      const paths: Record<string, string> = { upload: "asset-uploads", autofill: "autofills", export: "exports" };
      if (!(kind in paths) || typeof body.ticket !== "string") throw new CanvaError("Opération invalide.");
      const id = readTicket(body.ticket, user.id, kind);
      const { job } = await canva<{ job: Job }>(token, `/${paths[kind]}/${id}`);
      if (job.status === "failed") throw new CanvaError("La création Canva a échoué. Vérifiez les images et votre forfait.", 422);
      if (job.status !== "success") return json({ status: "in_progress" });
      if (kind === "upload") {
        if (!job.asset?.id) throw new CanvaError("Image Canva introuvable.", 502);
        return json({ status: "success", asset: ticket(user.id, "asset", job.asset.id) });
      }
      if (kind === "autofill") {
        if (!job.result?.design.id) throw new CanvaError("Design Canva introuvable.", 502);
        return json({ status: "success", design: ticket(user.id, "design", job.result.design.id) });
      }
      return json({ status: "success", export: body.ticket });
    }
    if (action === "generate") {
      const id = String(body.templateId ?? "");
      allowedTemplate(id);
      const { dataset = {} } = await canva<{ dataset?: Dataset }>(token, `/brand-templates/${id}/dataset`);
      if (!body.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) throw new CanvaError("Complétez les champs.");
      const values = body.fields as Record<string, unknown>;
      const data: Record<string, object> = {};
      if (!Object.keys(dataset).length) throw new CanvaError("Ce modèle ne contient aucun champ personnalisable.");
      for (const [name, field] of Object.entries(dataset)) {
        const value = values[name];
        if (field.type !== "text" && field.type !== "image") throw new CanvaError("Ce modèle contient des champs non pris en charge. Choisissez un modèle texte et image.");
        if (typeof value !== "string" || !value.trim() || value.length > 4000) throw new CanvaError(`Complétez le champ ${name}.`);
        data[name] = field.type === "text" ? { type: "text", text: value.trim() } : { type: "image", asset_id: decodeURIComponent(readTicket(value, user.id, "asset")) };
      }
      const { job } = await canva<{ job: Job }>(token, "/autofills", { method: "POST", body: JSON.stringify({ brand_template_id: id, title: String(body.title ?? "Création Marketing Studio").slice(0, 100), data }) });
      return json({ ticket: ticket(user.id, "autofill", job.id) });
    }
    if (action === "export") {
      const id = readTicket(String(body.design ?? ""), user.id, "design");
      const { job } = await canva<{ job: Job }>(token, "/exports", { method: "POST", body: JSON.stringify({ design_id: decodeURIComponent(id), format: { type: "png", pages: [1] } }) });
      return json({ ticket: ticket(user.id, "export", job.id) });
    }
    if (action === "save") {
      const id = readTicket(String(body.export ?? ""), user.id, "export");
      const { job } = await canva<{ job: Job }>(token, `/exports/${id}`);
      if (job.status !== "success" || !job.urls?.[0]) throw new CanvaError("Export pas encore prêt.");
      // URL comes only from Canva's authenticated job response, never from the browser.
      const response = await fetch(job.urls[0], { signal: AbortSignal.timeout(25000) });
      if (!response.ok || !response.body) throw new CanvaError("Téléchargement Canva indisponible.", 502);
      const reader = response.body.getReader();
      const parts: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 20 * 1024 * 1024) { await reader.cancel(); throw new CanvaError("Export trop volumineux (20 Mo maximum).", 413); }
          parts.push(value);
        }
      } finally { reader.releaseLock(); }
      const bytes = Buffer.concat(parts);
      if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new CanvaError("Canva n’a pas renvoyé un PNG valide.", 502);
      const { data, error } = await adminClient().storage.from(MEDIA_BUCKET).upload(`u/${user.id}/canva/${crypto.randomUUID()}.png`, new Blob([new Uint8Array(bytes)], { type: "image/png" }));
      if (error || !data) throw new CanvaError("Enregistrement indisponible. Réessayez.", 503);
      return json({ url: data.url, key: data.key, sizeKb: Math.ceil(bytes.length / 1024) });
    }
    throw new CanvaError("Action inconnue.");
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: error.status });
    return failure(error);
  }
}
