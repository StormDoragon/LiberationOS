"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunButton({ projectId }: { projectId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  async function onRun() {
    try {
      setIsRunning(true);
      const response = await fetch(`/api/projects/${projectId}/run`, { method: "POST" });
      if (!response.ok) throw new Error("Workflow run failed");
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <button className="button primary" onClick={onRun} disabled={isRunning}>
      {isRunning ? "Running workflow..." : "Run workflow"}
    </button>
  );
}
