import { describe, expect, it } from "vitest";
import {
  dollarsToCents,
  progressPercent,
  remainingCents,
  suggestedMonthlyCents,
} from "@/lib/money";
import { goalProgressPercent } from "@/lib/progress";
import { createItemSchema } from "@/lib/validations";
import { greetingForHour } from "@/lib/utils";

describe("money", () => {
  it("converts dollars to cents without float drift", () => {
    expect(dollarsToCents(12.34)).toBe(1234);
    expect(dollarsToCents(8400)).toBe(840000);
  });

  it("computes remaining and progress", () => {
    expect(remainingCents(1_200_000, 840_000)).toBe(360_000);
    expect(progressPercent(840_000, 1_200_000)).toBe(70);
  });

  it("suggests monthly contribution", () => {
    const now = new Date("2025-05-16");
    const target = new Date("2025-12-31");
    const monthly = suggestedMonthlyCents(1_200_000, 840_000, target, now);
    expect(monthly).toBeGreaterThan(0);
    expect(monthly * 7).toBeGreaterThanOrEqual(360_000);
  });
});

describe("goal progress", () => {
  it("handles habit and milestone tracking", () => {
    expect(goalProgressPercent(7, 12, 0, 0, "habit")).toBe(58);
    expect(goalProgressPercent(0, null, 2, 4, "milestone")).toBe(50);
    expect(goalProgressPercent(80, null, 0, 0, "percentage")).toBe(80);
  });
});

describe("validation", () => {
  it("requires title and financial target amount", () => {
    const bad = createItemSchema.safeParse({
      type: "financial_target",
      title: "",
      owner: "both",
    });
    expect(bad.success).toBe(false);

    const good = createItemSchema.safeParse({
      type: "financial_target",
      title: "Emergency fund",
      owner: "both",
      target_amount: 12000,
      current_amount: 8400,
    });
    expect(good.success).toBe(true);
  });
});

describe("greeting", () => {
  it("changes by hour", () => {
    expect(greetingForHour(8)).toBe("Good morning");
    expect(greetingForHour(14)).toBe("Good afternoon");
    expect(greetingForHour(20)).toBe("Good evening");
  });
});
