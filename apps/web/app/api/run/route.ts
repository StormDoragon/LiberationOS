import { NextRequest, NextResponse } from "next/server";
import { createProjectAndQueue } from "@liberation-os/workflow-engine";
import { z } from "zod";
import { authErrorResponse, requireUser } from "../../../lib/api-auth";

export const dynamic = "force-dynamic";
const runSchema = z.object({ goal: z.string().trim().min(1).max(10_000) });
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = runSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "A valid goal is required", issues: parsed.error.flatten() },
        { status: 400 },
      );
    const created = await createProjectAndQueue(parsed.data.goal, user.id);
    return NextResponse.json({
      jobId: created.jobId,
      projectId: created.projectId,
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to queue workflow" }, { status: 500 })
    );
  }
}
