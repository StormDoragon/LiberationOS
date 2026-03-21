/**
 * Publisher Agent — tool-calling agent that publishes or schedules content
 * to a connected integration using LLM-guided tool selection.
 *
 * The LLM receives the content + available integrations, then calls:
 *   - list_integrations   : inspect what's available
 *   - publish_now         : publish immediately to a named provider
 *   - schedule_for_later  : schedule at a specific ISO datetime
 *
 * If no API key is set, the agent auto-picks the first available integration.
 */
import { callWithTools } from "@liberation-os/ai-core";
import type { Agent } from "@liberation-os/workflow-engine";
import type { AgentContext, WorkflowArtifacts } from "@liberation-os/types";
import { publishContent } from "@liberation-os/integrations";

export interface IntegrationCredentialBlob {
  id: string;
  provider: string;
  credentials: Record<string, unknown>;
}

export interface PublisherInput {
  /** Content to publish (title + body are required) */
  contentItem: {
    id?: string;
    type: string;
    title?: string;
    body: string;
    platform?: string;
    metadata?: Record<string, unknown>;
  };
  /** Pre-loaded integration connections (credentials included) */
  connections: IntegrationCredentialBlob[];
}

export interface PublisherOutput {
  published: boolean;
  provider?: string;
  externalId?: string;
  scheduledAt?: string;
  reasoning: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are a publishing agent for LiberationOS.
Your job is to publish or schedule the given content to the most appropriate integration.

Rules:
1. First call list_integrations to see what is available.
2. Match the content's platform/type to the best provider (e.g. twitter for short text, wordpress for articles, mailchimp for email).
3. Call publish_now or schedule_for_later with your chosen provider.
4. Explain your reasoning clearly in your final response.
5. If no integration matches well, pick the first available one and note why.`;

export function createPublisherAgent(): Agent<PublisherInput, PublisherOutput> {
  return {
    name: "tool.publish-content",
    description:
      "LLM tool-calling agent: picks the right integration and publishes or schedules content via real API calls.",

    async execute(
      input: PublisherInput,
      context: AgentContext,
      _artifacts: WorkflowArtifacts,
    ): Promise<PublisherOutput> {
      const { contentItem, connections } = input;

      if (connections.length === 0) {
        return {
          published: false,
          reasoning: "No integration connections available. Configure one at /integrations.",
          error: "no_connections",
        };
      }

      const tools = [
        {
          name: "list_integrations",
          description: "List all available publishing integrations for this workspace.",
          parameters: { type: "object", properties: {}, required: [] },
        },
        {
          name: "publish_now",
          description: "Publish content immediately to the named integration provider.",
          parameters: {
            type: "object",
            properties: {
              provider: {
                type: "string",
                description: "The integration provider (e.g. twitter, wordpress, mailchimp)",
              },
            },
            required: ["provider"],
          },
        },
        {
          name: "schedule_for_later",
          description: "Schedule content to be published at a specific datetime.",
          parameters: {
            type: "object",
            properties: {
              provider: { type: "string" },
              scheduledAt: {
                type: "string",
                description: "ISO 8601 datetime string, e.g. 2026-04-01T09:00:00Z",
              },
            },
            required: ["provider", "scheduledAt"],
          },
        },
      ];

      let lastResult: PublisherOutput = {
        published: false,
        reasoning: "No publish action taken.",
      };

      const userMessage = `Content to publish:
Title: ${contentItem.title ?? "(none)"}
Type: ${contentItem.type}
Platform hint: ${contentItem.platform ?? "any"}
Body (first 500 chars): ${contentItem.body.slice(0, 500)}

Available integrations: ${connections.map((c) => c.provider).join(", ")}`;

      const { finalResponse, toolCalls, usage } = await callWithTools(
        SYSTEM_PROMPT,
        userMessage,
        tools,
        async (toolName, args) => {
          const typedArgs = args as Record<string, string>;

          if (toolName === "list_integrations") {
            const list = connections.map((c) => ({ provider: c.provider }));
            context.trace?.addEvent({
              type: "tool_call",
              stepKey: context.projectId,
              agentName: "tool.publish-content",
              toolName,
              toolArgs: {},
              toolResult: list,
            });
            return list;
          }

          if (toolName === "publish_now" || toolName === "schedule_for_later") {
            const provider = typedArgs.provider;
            const scheduledAt =
              toolName === "schedule_for_later" ? typedArgs.scheduledAt : undefined;

            const conn = connections.find((c) => c.provider === provider);
            if (!conn) {
              return { error: `No connection found for provider: ${provider}` };
            }

            try {
              const result = await publishContent(
                {
                  id: contentItem.id ?? "agent_publish",
                  type: contentItem.type,
                  title: contentItem.title,
                  body: contentItem.body,
                  platform: contentItem.platform,
                  metadata: contentItem.metadata,
                },
                conn.provider,
                conn.credentials,
                { scheduledAt },
              );

              lastResult = {
                published: true,
                provider: result.provider,
                externalId: result.externalId,
                scheduledAt,
                reasoning: finalResponse || `Published to ${provider}`,
              };

              context.trace?.addEvent({
                type: "tool_call",
                stepKey: context.projectId,
                agentName: "tool.publish-content",
                toolName,
                toolArgs: typedArgs,
                toolResult: result,
              });

              return result;
            } catch (err) {
              const error = err instanceof Error ? err.message : "Publish error";
              lastResult = {
                published: false,
                provider,
                reasoning: error,
                error,
              };
              return { error };
            }
          }

          return { error: `Unknown tool: ${toolName}` };
        },
      );

      context.trace?.addEvent({
        type: "llm_call",
        stepKey: context.projectId,
        agentName: "tool.publish-content",
        prompt: `${SYSTEM_PROMPT}\n\n${userMessage}`,
        modelResponse: finalResponse,
        model: usage.model,
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        costUsd: usage.costUsd,
        reasoning: finalResponse,
      });

      // Enrich lastResult with the LLM's final reasoning
      if (lastResult.published) {
        lastResult.reasoning = finalResponse || lastResult.reasoning;
      }

      // Fallback: if LLM didn't trigger a publish tool, use first connection
      if (!lastResult.published && toolCalls.length === 0) {
        const conn = connections[0];
        if (conn) {
          try {
            const result = await publishContent(
              {
                id: contentItem.id ?? "agent_publish",
                type: contentItem.type,
                title: contentItem.title,
                body: contentItem.body,
                platform: contentItem.platform,
                metadata: contentItem.metadata,
              },
              conn.provider,
              conn.credentials,
            );
            lastResult = {
              published: true,
              provider: result.provider,
              externalId: result.externalId,
              reasoning: `Fallback: published to first available integration (${conn.provider}).`,
            };
          } catch (err) {
            lastResult.error =
              err instanceof Error ? err.message : "Fallback publish failed";
          }
        }
      }

      return lastResult;
    },
  };
}
