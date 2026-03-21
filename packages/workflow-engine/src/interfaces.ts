import type { AgentContext } from "@liberation-os/types";

export interface Agent<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  execute(input: Input, context: AgentContext): Promise<Output>;
}
