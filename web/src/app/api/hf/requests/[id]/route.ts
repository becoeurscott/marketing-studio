import { errorResponse, getJob } from "@/lib/higgsfield/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await getJob(id));
  } catch (error) {
    return errorResponse(error);
  }
}
