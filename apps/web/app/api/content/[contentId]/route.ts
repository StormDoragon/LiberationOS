import { NextRequest, NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { z } from "zod";
import {
  authErrorResponse,
  requireContentAccess,
  requireUser,
} from "../../../../lib/api-auth";

interface RouteProps {
  params: Promise<{ contentId: string }>;
}
const updateSchema = z.object({
  status: z.enum(["draft", "approved", "scheduled", "published"]),
});
export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireUser();
    const { contentId } = await params;
    await requireContentAccess(contentId, user.id);
    const parsed = updateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid status", issues: parsed.error.flatten() },
        { status: 400 },
      );
    const item = await db.contentItem.update({
      where: { id: contentId },
      data: parsed.data,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to update content" }, { status: 500 })
    );
  }
}
