import { accountSummary } from "@/lib/account";
import { errorResponse } from "@/lib/higgsfield/server";
import { getSessionUser } from "@/lib/insforge/server";
import { syncJob } from "@/lib/jobs";

/** Media copies can take a few seconds for videos. */
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  try {
    const { id } = await params;
    if (!UUID.test(id)) return Response.json({ error: "Identifiant invalide." }, { status: 400 });
    const job = await syncJob(user.id, id);
    if (!job) return Response.json({ error: "Génération introuvable." }, { status: 404 });
    const final = job.status === "completed" || job.status === "failed" || job.status === "nsfw" || job.status === "canceled";
    return Response.json(final ? { ...job, credits: (await accountSummary(user.id)).credits } : job);
  } catch (error) {
    return errorResponse(error);
  }
}
