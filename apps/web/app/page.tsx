"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateProjectResponse {
  projectId: string;
  workflowRunId: string;
  jobId: string;
}

export default function HomePage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<CreateProjectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRun() {
    if (!goal.trim()) {
      setError("Enter a goal before running the workflow.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ goal })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(payload.error ?? "Failed to queue workflow");
      }

      const payload = (await response.json()) as CreateProjectResponse;
      setResult(payload);
      router.push(`/projects/${payload.projectId}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to queue workflow");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container">
      <div className="hero">
        <div>
          <p className="eyebrow">CORE FLOW</p>
          <h1>LiberationOS</h1>
          <p className="lead">User creates a project, queues a workflow, lets the worker execute agents, and reviews saved output in the UI.</p>
        </div>
        <a className="button secondary" href="/projects">Open dashboard</a>
      </div>

      <section className="card panel">
        <h2>Create Project</h2>
        <p className="small">Try: Post 30 viral TikToks for anime motivation.</p>
        <textarea
          className="input area"
          placeholder="Enter your goal..."
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          rows={5}
        />
        <div className="actions">
          <button className="button primary" onClick={handleRun} disabled={isSubmitting}>
            {isSubmitting ? "Queueing..." : "Queue Workflow"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <pre className="result">{JSON.stringify(result, null, 2)}</pre>
      </section>
    </main>
  );
}
