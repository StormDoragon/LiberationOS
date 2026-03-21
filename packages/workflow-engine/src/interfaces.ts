import type { AgentContext, WorkflowArtifacts } from "@liberation-os/types";

export interface Agent<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  execute(input: Input, context: AgentContext, artifacts: WorkflowArtifacts): Promise<Output>;
}
