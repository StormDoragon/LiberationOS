import type { ReactNode } from "react";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
