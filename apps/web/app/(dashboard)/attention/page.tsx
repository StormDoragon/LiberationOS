"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface AttentionItem {
  id: string;
  type: string;
  platform: string | null;
  title: string | null;
  body: string;
  status: string;
  project: { id: string; title: string; goalType: string };
}

interface Suggestion {
  score: number;
  verdict: string;
  suggestion: string;
  rewrite: string | null;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? "completed" : score >= 5 ? "scheduled" : "failed";
  return <span className="badge" data-status={color}>{score}/10</span>;
}

function ContentCard({ item, onUpdate }: { item: AttentionItem; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function getSuggestion() {
    setSuggesting(true);
    try {
      const res = await fetch(`/api/content/${item.id}/suggest`, { method: "POST" });
      const data = await res.json();
      setSuggestion(data.suggestion);
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="card stack">
      <div className="row">
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "flex-start", gap: 8 }}>
            <strong>{item.title ?? item.type}</strong>
            <span className="badge" data-status={item.status}>{item.status}</span>
            {suggestion && <ScoreBadge score={suggestion.score} />}
          </div>
          <p className="small" style={{ margin: 0 }}>
            <Link href={`/projects/${item.project.id}`}>{item.project.title}</Link>
            {item.platform && <> · {item.platform}</>}
          </p>
        </div>
        <div className="row" style={{ gap: 6, flexShrink: 0 }}>
          {!suggestion && (
            <button
              className="button"
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={getSuggestion}
              disabled={suggesting}
            >
              {suggesting ? "Analyzing..." : "✦ AI Review"}
            </button>
          )}
          {item.status === "draft" && (
            <button
              className="button"
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => updateStatus("approved")}
              disabled={loading}
            >
              Approve
            </button>
          )}
          {item.status === "approved" && (
            <button
              className="button primary"
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => updateStatus("published")}
              disabled={loading}
            >
              Publish
            </button>
          )}
        </div>
      </div>

      <pre className="code" style={{ maxHeight: 120, overflow: "hidden" }}>{item.body}</pre>

      {suggestion && (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row">
              <strong style={{ fontSize: 13 }}>AI Assessment</strong>
              <ScoreBadge score={suggestion.score} />
            </div>
            <p className="small" style={{ margin: 0 }}>{suggestion.verdict}</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{suggestion.suggestion}</p>
            {suggestion.rewrite && (
              <>
                <hr style={{ margin: "6px 0" }} />
                <p className="small" style={{ margin: 0, fontWeight: 600 }}>Suggested rewrite:</p>
                <pre className="code" style={{ fontSize: 12 }}>{suggestion.rewrite}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttentionPage() {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [summary, setSummary] = useState({ drafts: 0, approved: 0, total: 0 });
  const [filter, setFilter] = useState<"all" | "draft" | "approved">("all");
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/attention");
    const data = await res.json();
    setItems(data.items);
    setSummary(data.summary);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = filter === "all"
    ? items
    : items.filter((i) => i.status === filter);

  async function bulkApproveAll() {
    const drafts = items.filter((i) => i.status === "draft");
    if (drafts.length === 0) return;

    setBulkAction("Approving");
    setBulkProgress({ done: 0, total: drafts.length });

    for (let i = 0; i < drafts.length; i++) {
      await fetch(`/api/content/${drafts[i].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setBulkProgress({ done: i + 1, total: drafts.length });
    }

    setBulkAction(null);
    fetchItems();
  }

  async function bulkPublishAll() {
    const approved = items.filter((i) => i.status === "approved");
    if (approved.length === 0) return;

    setBulkAction("Publishing");
    setBulkProgress({ done: 0, total: approved.length });

    for (let i = 0; i < approved.length; i++) {
      await fetch(`/api/content/${approved[i].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      setBulkProgress({ done: i + 1, total: approved.length });
    }

    setBulkAction(null);
    fetchItems();
  }

  const pct = bulkProgress.total > 0
    ? Math.round((bulkProgress.done / bulkProgress.total) * 100)
    : 0;

  return (
    <main className="container stack">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: 4 }}>What Needs My Attention</h1>
          <p className="small">Review, approve, and publish content across all projects.</p>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{summary.drafts}</div>
          <div className="small">Drafts to review</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{summary.approved}</div>
          <div className="small">Ready to publish</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{summary.total}</div>
          <div className="small">Total items</div>
        </div>
      </div>

      {bulkAction && (
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <strong>{bulkAction}...</strong>
            <span className="small">{bulkProgress.done} / {bulkProgress.total}</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="row">
          <div className="row" style={{ gap: 6, justifyContent: "flex-start" }}>
            <button
              className={`button${filter === "all" ? " primary" : ""}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setFilter("all")}
            >
              All ({summary.total})
            </button>
            <button
              className={`button${filter === "draft" ? " primary" : ""}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setFilter("draft")}
            >
              Drafts ({summary.drafts})
            </button>
            <button
              className={`button${filter === "approved" ? " primary" : ""}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setFilter("approved")}
            >
              Approved ({summary.approved})
            </button>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {summary.drafts > 0 && (
              <button className="button" onClick={bulkApproveAll} disabled={!!bulkAction}>
                Approve all drafts
              </button>
            )}
            {summary.approved > 0 && (
              <button className="button primary" onClick={bulkPublishAll} disabled={!!bulkAction}>
                Publish all approved
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="stack">
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p className="muted" style={{ fontSize: 18 }}>Nothing needs your attention right now.</p>
            <p className="small">Create a project and run a workflow to generate content.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <ContentCard key={item.id} item={item} onUpdate={fetchItems} />
          ))
        )}
      </div>
    </main>
  );
}
