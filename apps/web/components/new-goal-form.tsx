"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewGoalForm() {
  const [goal, setGoal] = useState("Post 30 viral TikToks for my anime motivation page");
  const [niche, setNiche] = useState("anime motivation");
  const [quantity, setQuantity] = useState(30);
  const [runMode, setRunMode] = useState<"review" | "queue">("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit() {
    try {
      setIsSubmitting(true);
      const response = await fetch(runMode === "queue" ? "/api/run" : "/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runMode === "queue" ? { goal } : { goal, niche, quantity }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      const data = await response.json();
      router.push(`/projects/${runMode === "queue" ? data.projectId : data.project.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card stack">
      <div>
        <h2 style={{ margin: 0 }}>Create a new goal</h2>
        <p className="small">Choose a review project or queue the workflow for the background worker.</p>
      </div>

      <div className="grid grid-2">
        <label className="card nested-card" style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="run-mode"
            checked={runMode === "review"}
            onChange={() => setRunMode("review")}
          />
          <strong>Review project</strong>
          <span className="small">Create a project now; run it from the dashboard.</span>
        </label>
        <label className="card nested-card" style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="run-mode"
            checked={runMode === "queue"}
            onChange={() => setRunMode("queue")}
          />
          <strong>Queue worker run</strong>
          <span className="small">Create the project and add a BullMQ job immediately.</span>
        </label>
      </div>

      <label className="stack">
        <span className="small">Goal</span>
        <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={5} />
      </label>

      <div className="grid grid-2" style={{ opacity: runMode === "queue" ? 0.55 : 1 }}>
        <label className="stack">
          <span className="small">Niche</span>
          <input value={niche} disabled={runMode === "queue"} onChange={(event) => setNiche(event.target.value)} />
        </label>
        <label className="stack">
          <span className="small">Quantity</span>
          <input type="number" value={quantity} disabled={runMode === "queue"} onChange={(event) => setQuantity(Number(event.target.value))} />
        </label>
      </div>

      <button className="button primary" onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : runMode === "queue" ? "Create and queue run" : "Create project"}
      </button>
    </div>
  );
}
