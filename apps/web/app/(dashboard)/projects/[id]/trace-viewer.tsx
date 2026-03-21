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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function eventTypeColor(type: TraceEvent["type"]): string {
  switch (type) {
    case "llm_call":
      return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    case "tool_call":
      return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
    case "step_start":
      return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    case "step_end":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "error":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LLMCallCard({ event }: { event: TraceEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded px-1.5 py-0.5 text-xs font-mono bg-blue-500/20 text-blue-300">
            LLM
          </span>
          <span className="text-slate-300 font-medium">
            {event.model ?? "unknown model"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {(event.tokensIn ?? 0) > 0 && (
            <span>
              ↑ {formatTokens(event.tokensIn!)} &nbsp;↓ {formatTokens(event.tokensOut ?? 0)}
            </span>
          )}
          {(event.costUsd ?? 0) > 0 && (
            <span className="text-amber-400">{formatCost(event.costUsd!)}</span>
          )}
        </div>
      </div>

      {event.prompt && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full text-left"
        >
          <p className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? "▼ Hide prompt" : "▶ Show prompt"}
          </p>
          {expanded && (
            <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-400 bg-slate-900/50 rounded p-2 max-h-40 overflow-y-auto">
              {event.prompt.slice(0, 2000)}
              {event.prompt.length > 2000 && "\n…(truncated)"}
            </pre>
          )}
        </button>
      )}

      {event.modelResponse && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">Response:</p>
          <p className="text-xs text-slate-300 bg-slate-900/50 rounded p-2 line-clamp-3">
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
    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="rounded px-1.5 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300">
          TOOL
        </span>
        <span className="text-slate-300 font-medium font-mono">
          {event.toolName ?? "unknown"}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? "▼ hide" : "▶ details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Args</p>
            <pre className="text-xs text-slate-400 bg-slate-900/50 rounded p-2 overflow-x-auto max-h-28">
              {JSON.stringify(event.toolArgs, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Result</p>
            <pre className="text-xs text-slate-400 bg-slate-900/50 rounded p-2 overflow-x-auto max-h-28">
              {JSON.stringify(event.toolResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StepGroup({ stepKey, events }: { stepKey: string; events: TraceEvent[] }) {
  const [collapsed, setCollapsed] = useState(false);

  const endEvent = events.find((e) => e.type === "step_end");
  const agentName = events[0]?.agentName ?? stepKey;
  const durationMs = endEvent?.durationMs;

  const innerEvents = events.filter(
    (e) => e.type !== "step_start" && e.type !== "step_end",
  );

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* Step header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{collapsed ? "▶" : "▼"}</span>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">{stepKey}</p>
            <p className="text-xs text-slate-500">{agentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {durationMs !== undefined && (
            <span>{durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}</span>
          )}
          <span>{innerEvents.length} events</span>
        </div>
      </button>

      {/* Step events */}
      {!collapsed && innerEvents.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {innerEvents.map((event) => {
            if (event.type === "llm_call") return <LLMCallCard key={event.id} event={event} />;
            if (event.type === "tool_call") return <ToolCallCard key={event.id} event={event} />;
            if (event.type === "error") {
              return (
                <div
                  key={event.id}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400"
                >
                  <span className="font-medium">Error:</span> {event.error}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {!collapsed && innerEvents.length === 0 && (
        <p className="px-4 pb-3 text-xs text-slate-600">No inner events recorded.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TraceViewer({ events, summary }: TraceViewerProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6 text-center">
        <p className="text-slate-500 text-sm">
          No trace events yet. Run the project to see a detailed execution trace.
        </p>
      </div>
    );
  }

  const groups = groupByStep(events);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {summary && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Trace Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Steps", value: groups.size },
              { label: "Events", value: summary.totalEvents },
              { label: "LLM Calls", value: summary.llmCalls },
              { label: "Tool Calls", value: summary.toolCalls },
              {
                label: "Tokens In",
                value: formatTokens(summary.tokensIn),
              },
              {
                label: "Est. Cost",
                value: formatCost(summary.costUsd),
                highlight: summary.costUsd > 0,
              },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="text-center">
                <p
                  className={`text-lg font-semibold ${highlight ? "text-amber-400" : "text-slate-200"}`}
                >
                  {value}
                </p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step timeline */}
      <div className="space-y-3">
        {Array.from(groups.entries()).map(([stepKey, stepEvents]) => (
          <StepGroup key={stepKey} stepKey={stepKey} events={stepEvents} />
        ))}
      </div>
    </div>
  );
}
