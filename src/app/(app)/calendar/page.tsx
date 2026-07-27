export const dynamic = "force-dynamic";

import Link from "next/link";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { requireHousehold, Shell } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { typePath } from "@/lib/status";
import { cn } from "@/lib/utils";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; type?: string }>;
}) {
  const { view = "month", type } = await searchParams;
  const { repo, ctx } = await requireHousehold();
  let items = await repo.getCalendarItems();
  if (type) items = items.filter((i) => i.type === type);

  const anchor = new Date("2025-05-16T12:00:00");
  const days = eachDayOfInterval({
    start: startOfMonth(anchor),
    end: endOfMonth(anchor),
  });

  const byDay = (day: Date) =>
    items.filter((i) => i.due_date && isSameDay(parseISO(i.due_date), day));

  return (
    <Shell ctx={ctx}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink md:text-5xl">Calendar</h1>
          <p className="mt-1 text-muted">Deadlines, targets, and milestones in one place.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/calendar?view=month"
            className={cn(
              "rounded-full px-3 py-1.5",
              view === "month" ? "bg-pale-clay text-clay" : "bg-card text-muted"
            )}
          >
            Month
          </Link>
          <Link
            href="/calendar?view=agenda"
            className={cn(
              "rounded-full px-3 py-1.5",
              view === "agenda" ? "bg-pale-clay text-clay" : "bg-card text-muted"
            )}
          >
            Agenda
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {[
          ["", "All"],
          ["task", "Tasks"],
          ["decision", "Decisions"],
          ["goal", "Goals"],
          ["financial_target", "Finances"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={`/calendar?view=${view}${value ? `&type=${value}` : ""}`}
            className={cn(
              "rounded-full px-3 py-1.5",
              (type ?? "") === value ? "bg-ink text-white" : "border border-border bg-card text-muted"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {view === "agenda" ? (
        <Card className="divide-y divide-border p-0">
          {items
            .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
            .map((item) => (
              <Link
                key={item.id}
                href={`/${typePath(item.type)}/${item.id}`}
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-page/50"
              >
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-sm capitalize text-muted">{item.type.replaceAll("_", " ")}</p>
                </div>
                <p className="text-sm text-muted">
                  {item.due_date ? format(parseISO(item.due_date), "MMM d, yyyy") : ""}
                </p>
              </Link>
            ))}
          {items.length === 0 ? (
            <p className="p-6 text-sm text-muted">No dated items match this filter.</p>
          ) : null}
        </Card>
      ) : (
        <Card className="p-4 md:p-6">
          <h2 className="mb-4 font-display text-2xl text-ink">
            {format(anchor, "MMMM yyyy")}
          </h2>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dayItems = byDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-20 rounded-[12px] border border-border/70 bg-page/40 p-1.5 text-left",
                    isToday(day) && "border-clay/50 ring-1 ring-clay/30",
                    !isSameMonth(day, anchor) && "opacity-40"
                  )}
                >
                  <p className="text-xs font-medium text-ink">{format(day, "d")}</p>
                  <ul className="mt-1 space-y-1">
                    {dayItems.slice(0, 2).map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/${typePath(item.type)}/${item.id}`}
                          className="block truncate rounded bg-pale-sage/80 px-1 py-0.5 text-[10px] text-ink"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </Shell>
  );
}
