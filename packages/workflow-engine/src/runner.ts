import type { AgentContext, WorkflowPlan } from "@liberation-os/types";
import { AgentRegistry } from "./registry";

export async function runWorkflowPlan(plan: WorkflowPlan, registry: AgentRegistry, context: AgentContext) {
  const outputs: Record<string, unknown> = {};

  for (const step of plan.steps) {
    context.logger.info(`Running step ${step.key}`, { agent: step.agentName });
    const agent = registry.get(step.agentName);
    outputs[step.key] = await agent.execute(step.input, context);
  }

  return outputs;
}
