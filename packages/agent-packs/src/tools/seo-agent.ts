/**
 * SEO Checker Agent — tool-calling agent that analyzes content for SEO quality.
 *
 * Uses LOCAL tools (no external API) for metrics, then calls the LLM to
 * synthesize findings into a prioritized action list.
 *
 * Tools exposed to the LLM:
 *   - count_words           : total word count
 *   - keyword_density       : how often a keyword appears (as %)
 *   - readability_score     : Flesch-Kincaid reading ease (0-100)
 *   - extract_headings      : H1/H2/H3 headings from markdown/HTML
 *   - check_meta_description: whether a meta description exists in metadata
 */
import { callWithTools } from "@liberation-os/ai-core";
import type { Agent } from "@liberation-os/workflow-engine";
import type { AgentContext, WorkflowArtifacts } from "@liberation-os/types";

export interface SEOInput {
  content: string;          // The body text to analyze
  title?: string;
  targetKeywords?: string[]; // Optional list of target keywords
  metadata?: Record<string, unknown>;
}

export interface SEOIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  value?: string | number;
}

export interface SEOOutput {
  score: number;            // 0-100 composite SEO score
  readabilityScore: number; // Flesch-Kincaid ease (0-100)
  wordCount: number;
  keywordDensities: Record<string, number>;
  headings: string[];
  issues: SEOIssue[];
  suggestions: string[];    // LLM-generated actionable suggestions
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Local SEO tool implementations
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 1;

  // Count vowel clusters
  const clusters = w.match(/[aeiouy]+/g);
  let count = clusters ? clusters.length : 1;

  // Silent -e at end
  if (w.endsWith("e") && w.length > 2) count = Math.max(1, count - 1);
  // -le / -les endings typically add a syllable
  if (w.endsWith("le") && !/[aeiouy]le$/.test(w)) count = Math.max(1, count);

  return Math.max(1, count);
}

function readabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 50;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease formula
  const score =
    206.835 -
    1.015 * avgWordsPerSentence -
    84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function keywordDensity(text: string, keyword: string): number {
  const total = countWords(text);
  if (total === 0) return 0;

  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();

  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(kw, idx)) !== -1) {
    count++;
    idx += kw.length;
  }

  return parseFloat(((count / total) * 100).toFixed(2));
}

function extractHeadings(text: string): string[] {
  const headings: string[] = [];

  // Markdown headings
  const mdHeadings = text.match(/^#{1,6}\s.+$/gm);
  if (mdHeadings) headings.push(...mdHeadings);

  // HTML headings
  const htmlHeadings = text.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
  if (htmlHeadings) headings.push(...htmlHeadings.map((h) => h.replace(/<[^>]+>/g, "")));

  return headings;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an SEO analysis agent for LiberationOS.

Your job is to audit the provided content using the SEO tools, then give a clear, prioritized list of improvements.

Instructions:
1. Call the SEO tools to gather data: word count, keyword densities, readability, headings.
2. Based on the results, produce a score from 0-100 (where 100 = perfect SEO).
3. List issues with severity (error / warning / info).
4. Give 3-5 concrete, actionable suggestions.
5. Keep your final response focused and practical — avoid generic advice.

SEO scoring guide:
- Word count < 300: -20 points (thin content)
- No headings: -15 points
- Readability < 30 (very difficult): -10 points
- Primary keyword density < 0.5% or > 3%: -10 points
- Missing meta description: -5 points
- Word count 1000+: +10 points`;

export function createSEOAgent(): Agent<SEOInput, SEOOutput> {
  return {
    name: "tool.seo-check",
    description:
      "Analyzes content for SEO quality using local tools (keyword density, readability, word count, headings) then synthesizes actionable recommendations.",

    async execute(
      input: SEOInput,
      context: AgentContext,
      _artifacts: WorkflowArtifacts,
    ): Promise<SEOOutput> {
      const { content, title, targetKeywords = [], metadata } = input;

      // Collected metrics
      let wordCount = 0;
      let readability = 0;
      const densities: Record<string, number> = {};
      let headings: string[] = [];
      const issues: SEOIssue[] = [];

      const tools = [
        {
          name: "count_words",
          description: "Count the total words in the content.",
          parameters: { type: "object", properties: {}, required: [] },
        },
        {
          name: "readability_score",
          description: "Calculate the Flesch-Kincaid reading ease score (0-100, higher = easier).",
          parameters: { type: "object", properties: {}, required: [] },
        },
        {
          name: "keyword_density",
          description: "Check how often a keyword appears as a percentage of total words.",
          parameters: {
            type: "object",
            properties: {
              keyword: { type: "string", description: "The keyword or phrase to check" },
            },
            required: ["keyword"],
          },
        },
        {
          name: "extract_headings",
          description: "Extract all headings (H1-H6 markdown or HTML) from the content.",
          parameters: { type: "object", properties: {}, required: [] },
        },
        {
          name: "check_meta_description",
          description: "Check whether a meta description is present in the content metadata.",
          parameters: { type: "object", properties: {}, required: [] },
        },
      ];

      const userMessage = `Analyze this content:

Title: ${title ?? "(none)"}
Target keywords: ${targetKeywords.length ? targetKeywords.join(", ") : "(not specified)"}

Content (first 2000 chars):
${content.slice(0, 2000)}`;

      const { finalResponse, toolCalls, usage } = await callWithTools(
        SYSTEM_PROMPT,
        userMessage,
        tools,
        async (toolName, args) => {
          const typedArgs = args as Record<string, string>;
          let result: unknown;

          switch (toolName) {
            case "count_words":
              wordCount = countWords(content);
              result = { wordCount };
              break;

            case "readability_score":
              readability = readabilityScore(content);
              result = {
                score: readability,
                interpretation:
                  readability >= 70
                    ? "Easy to read"
                    : readability >= 50
                      ? "Fairly easy"
                      : readability >= 30
                        ? "Difficult"
                        : "Very difficult",
              };
              break;

            case "keyword_density": {
              const kw = typedArgs.keyword ?? "";
              const density = keywordDensity(content, kw);
              densities[kw] = density;
              result = { keyword: kw, density, percent: `${density}%` };
              break;
            }

            case "extract_headings":
              headings = extractHeadings(content);
              result = {
                count: headings.length,
                headings: headings.slice(0, 10),
              };
              break;

            case "check_meta_description": {
              const hasMeta =
                typeof metadata?.metaDescription === "string" ||
                typeof metadata?.description === "string";
              result = {
                present: hasMeta,
                value: hasMeta
                  ? (metadata?.metaDescription as string) ?? (metadata?.description as string)
                  : null,
              };
              break;
            }

            default:
              result = { error: `Unknown tool: ${toolName}` };
          }

          context.trace?.addEvent({
            type: "tool_call",
            stepKey: "seo_check",
            agentName: "tool.seo-check",
            toolName,
            toolArgs: typedArgs,
            toolResult: result,
          });

          return result;
        },
      );

      context.trace?.addEvent({
        type: "llm_call",
        stepKey: "seo_check",
        agentName: "tool.seo-check",
        prompt: `${SYSTEM_PROMPT}\n\n${userMessage}`,
        modelResponse: finalResponse,
        model: usage.model,
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        costUsd: usage.costUsd,
        reasoning: finalResponse,
      });

      // Build issues from collected metrics
      if (wordCount > 0 && wordCount < 300) {
        issues.push({
          severity: "error",
          code: "thin_content",
          message: `Word count is only ${wordCount}. Aim for 300+ for indexability, 1000+ for depth.`,
          value: wordCount,
        });
      }

      if (readability > 0 && readability < 30) {
        issues.push({
          severity: "warning",
          code: "low_readability",
          message: `Readability score is ${readability}/100 — very difficult to read. Simplify sentences.`,
          value: readability,
        });
      }

      if (headings.length === 0) {
        issues.push({
          severity: "warning",
          code: "no_headings",
          message: "No headings found. Add H1/H2 structure to improve scannability.",
        });
      }

      for (const [kw, density] of Object.entries(densities)) {
        if (density < 0.5) {
          issues.push({
            severity: "info",
            code: "low_keyword_density",
            message: `Keyword "${kw}" density is ${density}% — consider mentioning it more naturally.`,
            value: density,
          });
        } else if (density > 3) {
          issues.push({
            severity: "warning",
            code: "keyword_stuffing",
            message: `Keyword "${kw}" density is ${density}% — potential keyword stuffing, reduce usage.`,
            value: density,
          });
        }
      }

      // Compute composite score
      let score = 100;
      if (wordCount > 0 && wordCount < 300) score -= 20;
      if (wordCount >= 1000) score += 10;
      if (headings.length === 0) score -= 15;
      if (readability > 0 && readability < 30) score -= 10;
      for (const [, d] of Object.entries(densities)) {
        if (d < 0.5 || d > 3) score -= 10;
      }
      score = Math.max(0, Math.min(100, score));

      // Extract suggestions from LLM response (or fallback)
      const suggestions = finalResponse
        ? finalResponse
            .split("\n")
            .filter((line) => line.trim().length > 10)
            .slice(0, 5)
        : [
            wordCount < 300 ? "Expand content to at least 300 words." : "Content length is acceptable.",
            headings.length === 0 ? "Add heading structure (H1, H2) to organize content." : "Headings look good.",
            readability < 50 ? "Shorten sentences for better readability." : "Readability is acceptable.",
          ];

      return {
        score,
        readabilityScore: readability,
        wordCount,
        keywordDensities: densities,
        headings,
        issues,
        suggestions,
        reasoning: finalResponse || `SEO analysis complete. Score: ${score}/100.`,
      };
    },
  };
}
