"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContentActions({
  contentId,
  status,
}: {
  contentId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
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

  if (status === "published") {
    return <span className="badge" data-status="published">Published</span>;
  }

  return (
    <div className="row" style={{ gap: 6 }}>
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
  );
}

export function BulkApproveButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function approveAll() {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/approve-all`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="button" onClick={approveAll} disabled={loading}>
      {loading ? "Approving..." : "Approve all drafts"}
    </button>
  );
}
