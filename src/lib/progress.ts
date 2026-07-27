import { progressPercent } from "./money";

export function goalProgressPercent(
  currentValue: number,
  targetValue: number | null,
  completedMilestones: number,
  totalMilestones: number,
  trackingType: "numeric" | "percentage" | "milestone" | "habit"
): number {
  if (trackingType === "milestone") {
    if (totalMilestones <= 0) return 0;
    return progressPercent(completedMilestones, totalMilestones);
  }
  if (trackingType === "percentage") {
    return Math.min(100, Math.max(0, Math.round(currentValue)));
  }
  if (targetValue == null || targetValue <= 0) return 0;
  return progressPercent(currentValue, targetValue);
}

export function habitProgressLabel(
  currentValue: number,
  targetValue: number | null,
  unit = "weeks"
): string {
  const target = targetValue ?? 0;
  return `${currentValue} / ${target} ${unit}`;
}
