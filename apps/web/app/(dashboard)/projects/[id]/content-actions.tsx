"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  score: number;
  verdict: string;
  suggestion: string;
  rewrite: string | null;
}

export function ContentActions({
  contentId,
  status,
}: {
  contentId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function getSuggestion() {
    setSuggesting(true);
    try {
      const res = await fetch(`/api/content/${contentId}/suggest`, { method: "POST" });
      const data = await res.json();
      setSuggestion(data.suggestion);
    } finally {
      setSuggesting(false);
    }
  }

  if (status === "published") {
    return <span className="badge" data-status="published">Published</span>;
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 6 }}>
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
        {status === "draft" && (
          <button
            className="button"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => updateStatus("approved")}
            disabled={loading}
          >
            {loading ? "..." : "Approve"}
          </button>
        )}
        {(status === "approved" || status === "scheduled") && (
          <button
            className="button primary"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => updateStatus("published")}
            disabled={loading}
          >
            {loading ? "..." : "Publish"}
          </button>
        )}
        {status !== "draft" && (
          <button
            className="button"
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => updateStatus("draft")}
            disabled={loading}
          >
            Revert to draft
          </button>
        )}
      </div>
      {suggestion && (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#86efac", padding: 12 }}>
          <div className="stack" style={{ gap: 4 }}>
            <div className="row">
              <strong style={{ fontSize: 12 }}>AI Assessment</strong>
              <span className="badge" data-status={suggestion.score >= 7 ? "completed" : suggestion.score >= 4 ? "scheduled" : "failed"}>
                {suggestion.score}/10
              </span>
            </div>
            <p className="small" style={{ margin: 0 }}>{suggestion.verdict}</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{suggestion.suggestion}</p>
            {suggestion.rewrite && (
              <pre className="code" style={{ fontSize: 11, marginTop: 4 }}>{suggestion.rewrite}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BulkActions({ projectId, draftCount, approvedCount }: {
  projectId: string;
  draftCount: number;
  approvedCount: number;
}) {
  const [action, setAction] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const router = useRouter();

  async function bulkApprove() {
    setAction("Approving");
    const res = await fetch(`/api/projects/${projectId}/approve-all`, { method: "POST" });
    const data = await res.json();
    setProgress({ done: data.updated, total: data.updated });
    setTimeout(() => { setAction(null); router.refresh(); }, 600);
  }

  async function bulkPublish() {
    setAction("Publishing");
    const res = await fetch(`/api/projects/${projectId}/publish-all`, { method: "POST" });
    const data = await res.json();
    setProgress({ done: data.updated, total: data.updated });
    setTimeout(() => { setAction(null); router.refresh(); }, 600);
  }

  const pct = progress.total > 0 ? 100 : 0;

  return (
    <div className="stack" style={{ gap: 8 }}>
      {action && (
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="small">{action}...</span>
            <span className="small">{progress.done} items</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="row" style={{ gap: 6 }}>
        {draftCount > 0 && (
          <button className="button" onClick={bulkApprove} disabled={!!action}>
            {action === "Approving" ? "Approving..." : `Approve all drafts (${draftCount})`}
          </button>
        )}
        {approvedCount > 0 && (
          <button className="button primary" onClick={bulkPublish} disabled={!!action}>
            {action === "Publishing" ? "Publishing..." : `Publish all approved (${approvedCount})`}
          </button>
        )}
      </div>
    </div>
  );
}
