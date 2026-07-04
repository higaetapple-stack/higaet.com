import { accessLog } from "./telemetry";

export type PolicyScore = {
  denyRate: number;
  sampleSize: number;
  effectiveness: "OVERLY_RESTRICTIVE" | "OVERLY_PERMISSIVE" | "BALANCED" | "INSUFFICIENT_DATA";
};

export function scorePolicy(table: string, role: string): PolicyScore {
  const relevant = accessLog.filter((e) => e.table === table && e.role === role);
  const total = relevant.length;
  if (total < 10) {
    return { denyRate: 0, sampleSize: total, effectiveness: "INSUFFICIENT_DATA" };
  }
  const denies = relevant.filter((e) => e.result === "DENY").length;
  const denyRate = denies / total;
  const effectiveness: PolicyScore["effectiveness"] =
    denyRate > 0.8
      ? "OVERLY_RESTRICTIVE"
      : denyRate < 0.05
        ? "OVERLY_PERMISSIVE"
        : "BALANCED";
  return { denyRate, sampleSize: total, effectiveness };
}
