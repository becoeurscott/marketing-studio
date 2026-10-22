import { refundJob } from "@/lib/account";
import { adminClient } from "@/lib/insforge/admin";
import { cancelRequest } from "@/lib/higgsfield/server";
import { getSessionUser } from "@/lib/insforge/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cancels a job that hasn't started yet on Higgsfield and refunds its credits (once). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Identifiant invalide." }, { status: 400 });
  const { data } = await adminClient().database.from("ms_jobs").select("hf_request_id, status, finalized").eq("id", id).eq("user_id", user.id).limit(1);
  const job = data?.[0] as { hf_request_id: string | null; status: string; finalized: boolean } | undefined;
  if (!job) return Response.json({ error: "Génération introuvable." }, { status: 404 });
  if (job.finalized) return Response.json({ error: "Cette génération est déjà terminée." }, { status: 409 });
  if (!job.hf_request_id || job.status !== "queued") return Response.json({ error: "Trop tard : la génération a déjà commencé." }, { status: 409 });
  try {
    if (!(await cancelRequest(job.hf_request_id))) return Response.json({ error: "Trop tard : la génération a déjà commencé." }, { status: 409 });
  } catch {
    return Response.json({ error: "Annulation impossible pour le moment." }, { status: 502 });
  }
  await refundJob(id, "canceled");
  return Response.json({ ok: true, status: "canceled" });
}
