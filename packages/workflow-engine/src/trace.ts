import type { TraceEvent, TraceRecorder } from "@liberation-os/types";

/**
 * Concrete implementation of TraceRecorder.
 * One instance is created per WorkflowRun and injected into AgentContext.
 * At the end of the run, call getEvents() and persist to WorkflowRun.artifacts.trace.
 */
export class TraceRecorderImpl implements TraceRecorder {
  private readonly events: TraceEvent[] = [];

  addEvent(event: Omit<TraceEvent, "id" | "timestamp">): TraceEvent {
    const full: TraceEvent = {
      id: `evt_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.events.push(full);
    return full;
  }

  getEvents(): TraceEvent[] {
    return [...this.events];
  }

  /** Total input tokens across all llm_call events */
  totalTokensIn(): number {
    return this.events.reduce((sum, e) => sum + (e.tokensIn ?? 0), 0);
  }

  /** Total output tokens across all llm_call events */
  totalTokensOut(): number {
    return this.events.reduce((sum, e) => sum + (e.tokensOut ?? 0), 0);
  }

  /** Estimated total cost in USD */
  totalCostUsd(): number {
    return this.events.reduce((sum, e) => sum + (e.costUsd ?? 0), 0);
  }

  summary(): {
    totalEvents: number;
    llmCalls: number;
    toolCalls: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
  } {
    return {
      totalEvents: this.events.length,
      llmCalls: this.events.filter((e) => e.type === "llm_call").length,
      toolCalls: this.events.filter((e) => e.type === "tool_call").length,
      tokensIn: this.totalTokensIn(),
      tokensOut: this.totalTokensOut(),
      costUsd: this.totalCostUsd(),
    };
  }
}
