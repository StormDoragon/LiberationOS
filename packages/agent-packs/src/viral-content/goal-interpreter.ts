import { generateJSON } from "@liberation-os/ai-core";
import type { ViralContentGoal } from "@liberation-os/types";

export async function interpretGoal(input: string): Promise<ViralContentGoal> {
  const prompt = `
Convert this goal into structured JSON:

"${input}"

Return:
{
  "goalType": "viral_content_batch",
  "platforms": [],
  "niche": "",
  "quantity": number
}
`;

  return generateJSON<ViralContentGoal>(prompt);
}