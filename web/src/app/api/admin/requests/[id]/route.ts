import { isAdmin } from "@/lib/admin-token";
import { errorResponse, getJob } from "@/lib/higgsfield/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    return Response.json(await getJob((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}
