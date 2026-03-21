export interface PerformanceSnapshot {
  source: string;
  impressions: number;
  clicks: number;
  conversions?: number;
  revenue?: number;
}

export function summarizePerformance(snapshot: PerformanceSnapshot) {
  const ctr = snapshot.impressions === 0 ? 0 : snapshot.clicks / snapshot.impressions;
  return { ...snapshot, ctr };
}
