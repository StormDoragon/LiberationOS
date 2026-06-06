import { db } from "@liberation-os/db";
import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "../../../../../lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const user = await requireUser();
    const { runId } = await params;
    const run = await db.workflowRun.findFirst({
      where: { id: runId, project: { workspace: { userId: user.id } } },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        artifacts: true,
      },
    });
    if (!run)
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    const artifacts = run.artifacts as Record<string, unknown> | null;
    return NextResponse.json({
      runId: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      trace: artifacts?.trace ?? [],
      traceSummary: artifacts?.traceSummary ?? null,
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to load run trace" }, { status: 500 })
    );
  }
}
