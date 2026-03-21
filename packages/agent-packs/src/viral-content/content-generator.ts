import { generateJSON } from "@liberation-os/ai-core";
import type { GeneratedContentBatchItem, ViralContentGoal } from "@liberation-os/types";

export async function generateContentBatch(config: ViralContentGoal): Promise<GeneratedContentBatchItem[]> {
  const prompt = `
Generate ${config.quantity} viral content ideas for ${config.niche}.

Return JSON:
[
  {
    "hook": "",
    "script": "",
    "caption": ""
  }
]
`;

  return generateJSON<GeneratedContentBatchItem[]>(prompt);
}