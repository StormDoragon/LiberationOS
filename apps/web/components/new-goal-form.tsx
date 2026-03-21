"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewGoalForm() {
  const [goal, setGoal] = useState("Post 30 viral TikToks for my anime motivation page");
  const [niche, setNiche] = useState("anime motivation");
  const [quantity, setQuantity] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit() {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, niche, quantity }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      const data = await response.json();
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card stack">
      <div>
        <h2 style={{ margin: 0 }}>Create a new goal</h2>
        <p className="small">Phase 3 uses Prisma-backed projects and real workflow runs.</p>
      </div>

      <label className="stack">
        <span className="small">Goal</span>
        <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={5} />
      </label>

      <div className="grid grid-2">
        <label className="stack">
          <span className="small">Niche</span>
          <input value={niche} onChange={(event) => setNiche(event.target.value)} />
        </label>
        <label className="stack">
          <span className="small">Quantity</span>
          <input type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </label>
      </div>

      <button className="button primary" onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create project"}
      </button>
    </div>
  );
}
