import { NextRequest, NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { generateJSON } from "@liberation-os/ai-core";

interface RouteProps {
  params: Promise<{ contentId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { contentId } = await params;

  const item = await db.contentItem.findUnique({
    where: { id: contentId },
    include: { project: { select: { goalType: true, goal: true } } },
  });

  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const prompt = `You are a viral content strategist. Analyze this ${item.type} for ${item.platform ?? "social media"} and give a brief JSON response.

Title: ${item.title ?? "Untitled"}
Body: ${item.body}
Project goal: ${item.project.goal}

Respond with JSON only:
{
  "score": <number 1-10 rating for virality/engagement>,
  "verdict": "<one sentence assessment>",
  "suggestion": "<one specific rewrite or improvement suggestion>",
  "rewrite": "<improved version of the body text>"
}`;

  try {
    const result = await generateJSON<{
      score: number;
      verdict: string;
      suggestion: string;
      rewrite: string;
    }>(prompt);

    return NextResponse.json({ suggestion: result });
  } catch {
    // Offline fallback — provide deterministic suggestion
    const wordCount = item.body.split(/\s+/).length;
    const hasHashtags = item.body.includes("#");
    const hasCTA = /follow|comment|save|share|link|click/i.test(item.body);
    let score = 6;
    const tips: string[] = [];

    if (wordCount < 20) { tips.push("expand with more detail"); score -= 1; }
    if (wordCount > 150) { tips.push("trim for punchier delivery"); score -= 1; }
    if (!hasHashtags) { tips.push("add 3-5 targeted hashtags"); score -= 1; }
    if (!hasCTA) { tips.push("add a clear call-to-action"); score -= 1; }
    if (item.body.startsWith("#")) { score += 1; tips.push("strong hook opening"); }

    score = Math.max(1, Math.min(10, score));

    return NextResponse.json({
      suggestion: {
        score,
        verdict: `Solid ${item.type} draft${tips.length ? " with room to improve" : ""}.`,
        suggestion: tips.length > 0
          ? `To boost engagement: ${tips.join(", ")}.`
          : "This draft looks ready to publish after final review.",
        rewrite: null,
      },
    });
  }
}
