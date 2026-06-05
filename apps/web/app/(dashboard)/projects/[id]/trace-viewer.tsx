"use client";

import { useState } from "react";
import type { TraceEvent } from "@liberation-os/types";

interface TraceSummary {
  totalEvents: number;
  llmCalls: number;
  toolCalls: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

interface TraceViewerProps {
  events: TraceEvent[];
  summary?: TraceSummary | null;
}

function groupByStep(events: TraceEvent[]): Map<string, TraceEvent[]> {
  const groups = new Map<string, TraceEvent[]>();
  for (const event of events) {
    const key = event.stepKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return groups;
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.000";
  return `$${usd.toFixed(6)}`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function LLMCallCard({ event }: { event: TraceEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="trace-call trace-call-llm">
      <div className="trace-row">
        <div className="trace-inline">
          <span className="trace-pill trace-pill-llm">LLM</span>
          <span className="trace-call-title">{event.model ?? "unknown model"}</span>
        </div>
        <div className="trace-meta">
          {(event.tokensIn ?? 0) > 0 && (
            <span>↑ {formatTokens(event.tokensIn!)} · ↓ {formatTokens(event.tokensOut ?? 0)}</span>
          )}
          {(event.costUsd ?? 0) > 0 && <span className="trace-cost">{formatCost(event.costUsd!)}</span>}
        </div>
      </div>

      {event.prompt && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="trace-disclosure">
          <span>{expanded ? "▼ Hide prompt" : "▶ Show prompt"}</span>
          {expanded && (
            <pre className="trace-code">
              {event.prompt.slice(0, 2000)}
              {event.prompt.length > 2000 && "\n…(truncated)"}
            </pre>
          )}
        </button>
      )}

      {event.modelResponse && (
        <div className="trace-response">
          <p className="trace-label">Response:</p>
          <p className="trace-code trace-code-clamped">
            {event.modelResponse.slice(0, 300)}
            {event.modelResponse.length > 300 && "…"}
          </p>
        </div>
      )}
    </div>
  );
}

function ToolCallCard({ event }: { event: TraceEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="trace-call trace-call-tool">
      <div className="trace-row">
        <div className="trace-inline">
          <span className="trace-pill trace-pill-tool">TOOL</span>
          <span className="trace-call-title trace-mono">{event.toolName ?? "unknown"}</span>
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="trace-link-button">
          {expanded ? "▼ hide" : "▶ details"}
        </button>
      </div>

      {expanded && (
        <div className="trace-detail-grid">
          <div>
            <p className="trace-label">Args</p>
            <pre className="trace-code">{JSON.stringify(event.toolArgs, null, 2)}</pre>
          </div>
          <div>
            <p className="trace-label">Result</p>
            <pre className="trace-code">{JSON.stringify(event.toolResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StepGroup({ stepKey, events }: { stepKey: string; events: TraceEvent[] }) {
  const [collapsed, setCollapsed] = useState(false);

  const endEvent = events.find((event) => event.type === "step_end");
  const agentName = events[0]?.agentName ?? stepKey;
  const durationMs = endEvent?.durationMs;
  const innerEvents = events.filter((event) => event.type !== "step_start" && event.type !== "step_end");

  return (
    <div className="trace-step">
      <button type="button" onClick={() => setCollapsed((value) => !value)} className="trace-step-header">
        <div className="trace-inline">
          <span className="trace-chevron">{collapsed ? "▶" : "▼"}</span>
          <div style={{ textAlign: "left" }}>
            <p className="trace-step-title">{stepKey}</p>
            <p className="trace-meta">{agentName}</p>
          </div>
        </div>
        <div className="trace-meta">
          {durationMs !== undefined && (
            <span>{durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}</span>
          )}
          <span>{innerEvents.length} events</span>
        </div>
      </button>

      {!collapsed && innerEvents.length > 0 && (
        <div className="trace-step-body">
          {innerEvents.map((event) => {
            if (event.type === "llm_call") return <LLMCallCard key={event.id} event={event} />;
            if (event.type === "tool_call") return <ToolCallCard key={event.id} event={event} />;
            if (event.type === "error") {
              return (
                <div key={event.id} className="trace-error">
                  <span style={{ fontWeight: 600 }}>Error:</span> {event.error}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {!collapsed && innerEvents.length === 0 && <p className="trace-empty">No inner events recorded.</p>}
    </div>
  );
}

export default function TraceViewer({ events, summary }: TraceViewerProps) {
  if (events.length === 0) {
    return (
      <div className="trace-empty-panel">
        <p className="small">No trace events yet. Run the project to see a detailed execution trace.</p>
      </div>
    );
  }

  const groups = groupByStep(events);

  return (
    <div className="trace-viewer">
      {summary && (
        <div className="trace-summary">
          <h3 className="trace-summary-title">Trace Summary</h3>
          <div className="trace-summary-grid">
            {[
              { label: "Steps", value: groups.size },
              { label: "Events", value: summary.totalEvents },
              { label: "LLM Calls", value: summary.llmCalls },
              { label: "Tool Calls", value: summary.toolCalls },
              { label: "Tokens In", value: formatTokens(summary.tokensIn) },
              { label: "Est. Cost", value: formatCost(summary.costUsd), highlight: summary.costUsd > 0 },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="trace-summary-item">
                <p className={highlight ? "trace-summary-value trace-cost" : "trace-summary-value"}>{value}</p>
                <p className="trace-label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="trace-viewer">
        {Array.from(groups.entries()).map(([stepKey, stepEvents]) => (
          <StepGroup key={stepKey} stepKey={stepKey} events={stepEvents} />
        ))}
      </div>
    </div>
  );
}
