import { NextRequest, NextResponse } from "next/server";
import { createProjectAndQueue } from "@liberation-os/workflow-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { goal?: string };
    const goal = body.goal?.trim();

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const created = await createProjectAndQueue(goal);
    return NextResponse.json({ jobId: created.jobId, projectId: created.projectId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to queue workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}