import type { AuditEntry } from "@/lib/types";

export function formatAuditDetails(entry: AuditEntry): string {
  const details = entry.details;
  if (!details || typeof details !== "object") return "—";
  const keys = Object.keys(details);
  if (keys.length === 0) return "—";

  return keys
    .map((key) => {
      const value = details[key];
      if (value == null) return `${key}: —`;
      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${String(value)}`;
    })
    .join(" · ");
}
