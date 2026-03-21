"use client";

import { useEffect, useState } from "react";
import type { ProjectSnapshot } from "@liberation-os/types";

interface ProjectStatusPanelProps {
  initialProject: ProjectSnapshot;
}

const activeStatuses = new Set(["pending", "running"]);

export function ProjectStatusPanel({ initialProject }: ProjectStatusPanelProps) {
  const [project, setProject] = useState(initialProject);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeStatuses.has(project.status)) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to refresh project");
        }

        const refreshed = (await response.json()) as ProjectSnapshot;
        setProject(refreshed);
        setError(null);
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh project");
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [project.id, project.status]);

  const latestRun = project.runs[0];

  return (
    <div className="grid">
      <section className="card panel">
        <p className="eyebrow">PROJECT</p>
        <h1>{project.title}</h1>
        <p className="small">Status: {project.status}</p>
        <p className="small">Goal type: {project.goalType}</p>
        <pre className="result">{JSON.stringify(project.input, null, 2)}</pre>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="card panel">
        <h2>Workflow Run</h2>
        {latestRun ? (
          <>
            <p className="small">Run status: {latestRun.status}</p>
            <p className="small">Started: {latestRun.startedAt ?? "Not started"}</p>
            <p className="small">Completed: {latestRun.completedAt ?? "Not completed"}</p>
            {latestRun.errorLog ? <p className="error">{latestRun.errorLog}</p> : null}
            <div className="grid" style={{ marginTop: 16 }}>
              {latestRun.steps.map((step) => (
                <div key={step.id} className="card nested-card">
                  <h3>{step.key}</h3>
                  <p className="small">Agent: {step.agentName}</p>
                  <p className="small">Status: {step.status}</p>
                  <pre className="result compact">{JSON.stringify(step.output ?? step.input, null, 2)}</pre>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="small">No workflow run found.</p>
        )}
      </section>

      <section className="card panel">
        <h2>Generated Content</h2>
        {project.content.length === 0 ? <p className="small">Worker has not saved content yet.</p> : null}
        <div className="grid">
          {project.content.map((item) => (
            <article key={item.id} className="card nested-card">
              <p className="small">{item.platform ?? "unassigned platform"}</p>
              <h3>{item.title ?? item.type}</h3>
              <p>{item.body}</p>
              <pre className="result compact">{JSON.stringify(item.metadata, null, 2)}</pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}