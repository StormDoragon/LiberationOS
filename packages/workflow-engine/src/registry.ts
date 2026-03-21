import type { Agent } from "./interfaces";

export class AgentRegistry {
  private agents = new Map<string, Agent>();

  register(agent: Agent) {
    this.agents.set(agent.name, agent);
  }

  get(name: string) {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Agent not found: ${name}`);
    return agent;
  }
}
