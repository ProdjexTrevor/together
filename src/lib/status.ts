import type { ItemStatus, ItemType } from "@/types";

export function statusTone(status: ItemStatus): "sage" | "clay" | "amber" | "neutral" | "success" {
  switch (status) {
    case "completed":
    case "decided":
    case "reached":
    case "on_track":
      return "success";
    case "awaiting_response":
    case "blocked":
    case "behind":
    case "needs_attention":
      return "clay";
    case "in_progress":
    case "discussion":
    case "collecting_options":
      return "amber";
    default:
      return "neutral";
  }
}

export function statusLabel(status: ItemStatus): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function typeLabel(type: ItemType): string {
  switch (type) {
    case "financial_target":
      return "Financial Target";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function typePath(type: ItemType): string {
  switch (type) {
    case "task":
      return "tasks";
    case "decision":
      return "decisions";
    case "goal":
      return "goals";
    case "financial_target":
      return "finances";
  }
}
