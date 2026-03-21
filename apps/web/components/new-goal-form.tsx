"use client";

import { useState } from "react";

export function NewGoalForm() {
  const [goal, setGoal] = useState("");

  return (
    <form className="card">
      <h2>New Goal</h2>
      <textarea
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        placeholder="Post 30 viral TikToks for my anime motivation page"
        style={{ width: "100%", minHeight: 120, marginTop: 12 }}
      />
      <button className="button" type="button" style={{ marginTop: 12 }}>
        Create workflow
      </button>
    </form>
  );
}
