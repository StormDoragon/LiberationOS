"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Publish modal — lets the user pick an integration and optionally schedule
// ---------------------------------------------------------------------------
interface IntegrationOption {
  id: string;
  provider: string;
}

interface PublishModalProps {
  contentId: string;
  workspaceId: string;
  onClose: () => void;
  onDone: () => void;
}

function PublishModal({ contentId, workspaceId, onClose, onDone }: PublishModalProps) {
  const [integrations, setIntegrations] = useState<IntegrationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch(`/api/integrations?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data: { connections: IntegrationOption[] }) => {
        setIntegrations(data.connections);
        if (data.connections.length > 0) setSelectedId(data.connections[0].id);
      })
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setPublishing(true);
    setResult(null);
    try {
      const res = await fetch(`/api/content/${contentId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: selectedId,
          scheduledAt: scheduledAt || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Published! External ID: ${data.externalId}` });
        setTimeout(onDone, 1500);
      } else {
        setResult({ ok: false, message: data.error ?? "Publish failed" });
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card stack" style={{ width: "min(420px, 94vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="row">
          <strong>Publish to integration</strong>
          <button className="button" style={{ fontSize: 12, padding: "4px 10px" }} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p className="small">Loading integrations…</p>
        ) : integrations.length === 0 ? (
          <p className="small">
            No integrations connected.{" "}
            <a href="/integrations" style={{ textDecoration: "underline" }}>Set one up</a>.
          </p>
        ) : (
          <form onSubmit={handlePublish} className="stack" style={{ gap: 10 }}>
            <div className="stack" style={{ gap: 4 }}>
              <label className="small" style={{ fontWeight: 500 }}>Platform</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  width: "100%", border: "1px solid #cbd5e1", borderRadius: 14,
                  padding: 12, background: "white", font: "inherit", fontSize: 14,
                }}
              >
                {integrations.map((c) => (
                  <option key={c.id} value={c.id}>{c.provider}</option>
                ))}
              </select>
            </div>

            <div className="stack" style={{ gap: 4 }}>
              <label className="small" style={{ fontWeight: 500 }}>
                Schedule for (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="small" style={{ margin: 0 }}>Leave blank to publish immediately.</p>
            </div>

            {result && (
              <p
                className="small"
                style={{ color: result.ok ? "#166534" : "#dc2626", fontWeight: 500 }}
              >
                {result.message}
              </p>
            )}

            <button className="button primary" type="submit" disabled={publishing || !selectedId}>
              {publishing ? "Publishing…" : scheduledAt ? "Schedule" : "Publish now"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

interface Suggestion {
  score: number;
  verdict: string;
  suggestion: string;
  rewrite: string | null;
}

export function ContentActions({
  contentId,
  status,
  workspaceId,
}: {
  contentId: string;
  status: string;
  workspaceId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
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
    <>
      {showPublishModal && (
        <PublishModal
          contentId={contentId}
          workspaceId={workspaceId}
          onClose={() => setShowPublishModal(false)}
          onDone={() => { setShowPublishModal(false); router.refresh(); }}
        />
      )}
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
              onClick={() => setShowPublishModal(true)}
              disabled={loading}
            >
              Publish →
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
    </>
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
