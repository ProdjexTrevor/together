/** Money helpers — always store and compute in integer cents. */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(centsToDollars(cents));
}

export function formatCurrencyPrecise(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(centsToDollars(cents));
}

export function remainingCents(targetCents: number, currentCents: number): number {
  return Math.max(targetCents - currentCents, 0);
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Suggested monthly contribution (cents) to hit target by targetDate.
 * Uses whole months remaining (at least 1).
 */
export function suggestedMonthlyCents(
  targetCents: number,
  currentCents: number,
  targetDate: Date,
  now = new Date()
): number {
  const remaining = remainingCents(targetCents, currentCents);
  if (remaining <= 0) return 0;

  const months =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth()) +
    (targetDate.getDate() >= now.getDate() ? 0 : -1);

  const monthsLeft = Math.max(months, 1);
  return Math.ceil(remaining / monthsLeft);
}
