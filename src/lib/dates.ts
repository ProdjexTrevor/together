import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatShortDate(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";
  return format(date, "MMM d");
}

export function formatLongDate(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";
  return format(date, "MMM d, yyyy");
}

export function formatRelative(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

export function utcNowIso(): string {
  return new Date().toISOString();
}
