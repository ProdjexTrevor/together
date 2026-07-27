import Link from "next/link";
import {
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  Heart,
  HeartPulse,
  Scale,
  Target,
} from "lucide-react";
import { formatRelative, formatShortDate } from "@/lib/dates";
import { insightForCheckIn, scoreTone } from "@/lib/check-in";
import { formatCurrency, progressPercent } from "@/lib/money";
import { habitProgressLabel } from "@/lib/progress";
import { greetingForHour } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/status";
import type { HouseholdContext, ItemWithMeta, WellnessCheckIn } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { CreateItemButton } from "@/components/create/create-item-button";
import { TaskCheckbox } from "@/components/items/task-checkbox";

export function DashboardView({
  ctx,
  tasks,
  decisions,
  goals,
  finances,
  checkIns,
}: {
  ctx: HouseholdContext;
  tasks: ItemWithMeta[];
  decisions: ItemWithMeta[];
  goals: ItemWithMeta[];
  finances: ItemWithMeta[];
  checkIns: { mine: WellnessCheckIn | null; partner: WellnessCheckIn | null };
}) {
  const hour = new Date().getHours();
  const names = ctx.partner
    ? `${ctx.currentUser.full_name} & ${ctx.partner.full_name}`
    : ctx.currentUser.full_name;
  const partnerFirst = ctx.partner?.full_name.split(" ")[0];

  const openTasks = tasks.filter((t) => t.status !== "completed").slice(0, 4);
  const completedThisWeek = tasks.filter((t) => t.status === "completed").length;
  const awaiting = decisions.filter((d) => d.status === "awaiting_response").slice(0, 1);
  const activeGoal = goals[0];
  const activeFinance = finances[0];

  const upcoming = [...tasks, ...decisions, ...goals, ...finances]
    .filter((i) => i.due_date && i.status !== "completed" && i.status !== "decided" && i.status !== "reached")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 4);

  const tasksDueSoon = tasks.filter((t) => t.status !== "completed").length;
  const decisionsNeedInput = decisions.filter(
    (d) => d.status === "awaiting_response" || d.status === "discussion"
  ).length;
  const goalsInProgress = goals.filter((g) => g.status !== "completed").length;
  const financesOnTrack = finances.filter((f) => f.status === "on_track" || f.status === "reached").length;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[40px] leading-[1.05] text-ink md:text-[60px]">
            {greetingForHour(hour)}, {names}
            <Link
              href="/basecamp"
              className="ml-2 inline-block text-clay transition hover:scale-110"
              aria-label="Open private Basecamp"
              title="Private"
            >
              ♡
            </Link>
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted md:text-base">
            You&apos;ve got great things ahead—tackle a few together.
          </p>
        </div>
        <div className="hidden md:block">
          <CreateItemButton />
        </div>
      </div>

      <Card className="border-clay/25 bg-gradient-to-br from-pale-clay/35 via-card to-pale-sage/25 p-5 md:p-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-clay" />
            <CardTitle>
              {partnerFirst ? `How ${partnerFirst} is doing` : "Check-in"}
            </CardTitle>
          </div>
          <Link href="/check-in" className="text-sm font-medium text-clay">
            Open check-in →
          </Link>
        </CardHeader>
        {checkIns.partner ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Mental", checkIns.partner.mental],
                  ["Physical", checkIns.partner.physical],
                  ["Emotional", checkIns.partner.emotional],
                ] as const
              ).map(([label, score]) => (
                <Badge key={label} tone={scoreTone(score)}>
                  {label} {score}/5
                </Badge>
              ))}
            </div>
            <p className="text-[15px] leading-relaxed text-ink/90">
              {insightForCheckIn(checkIns.partner, null, ctx.partner?.full_name)}
            </p>
            <p className="text-xs text-muted">
              Shared {formatRelative(checkIns.partner.created_at)}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {partnerFirst
              ? `${partnerFirst} hasn’t checked in yet. Share yours and invite them to do the same.`
              : "Start a quick wellness check-in to stay in sync."}
          </p>
        )}
      </Card>

      {/* Mobile metric grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <MetricCard href="/tasks" title="Tasks" value={`${tasksDueSoon} due soon`} tone="sage" />
        <MetricCard
          href="/decisions"
          title="Decisions"
          value={`${decisionsNeedInput} need input`}
          tone="clay"
        />
        <MetricCard
          href="/goals"
          title="Goals"
          value={`${goalsInProgress} in progress`}
          tone="sage"
        />
        <MetricCard
          href="/finances"
          title="Financial Targets"
          value={`${financesOnTrack} on track`}
          tone="clay"
        />
      </div>

      <div className="hidden gap-5 md:grid md:grid-cols-2">
        <Card className="p-5 md:p-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-sage" />
              <CardTitle>Tasks</CardTitle>
            </div>
            <Link href="/tasks" className="text-sm font-medium text-clay">
              View all →
            </Link>
          </CardHeader>
          <ul className="mt-4 space-y-3">
            {(openTasks.length ? openTasks : tasks.slice(0, 4)).map((task) => (
              <li key={task.id} className="flex items-center gap-3">
                <TaskCheckbox
                  itemId={task.id}
                  completed={task.status === "completed"}
                  title={task.title}
                />
                <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
                  <p
                    className={
                      task.status === "completed"
                        ? "truncate text-[15px] text-muted line-through"
                        : "truncate text-[15px] text-ink"
                    }
                  >
                    {task.title}
                  </p>
                </Link>
                {task.owner_id ? (
                  <Avatar
                    name={
                      ctx.members.find((m) => m.user_id === task.owner_id)?.profile.full_name ??
                      "Owner"
                    }
                    size="sm"
                  />
                ) : null}
                <span className="text-xs text-muted">{formatShortDate(task.due_date)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            {completedThisWeek} tasks completed this week
          </p>
        </Card>

        <Card className="p-5 md:p-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-clay" />
              <CardTitle>Decisions</CardTitle>
            </div>
            <Link href="/decisions" className="text-sm font-medium text-clay">
              View all →
            </Link>
          </CardHeader>
          {awaiting[0] ? (
            <div className="mt-4 rounded-[16px] border border-border bg-page/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{awaiting[0].title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {ctx.members.find((m) => m.user_id === awaiting[0].created_by)?.profile
                      .full_name ?? "Partner"}{" "}
                    proposed · {formatShortDate(awaiting[0].created_at)}
                  </p>
                </div>
                <Badge tone={statusTone(awaiting[0].status)}>
                  {statusLabel(awaiting[0].status)}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link
                  href={`/decisions/${awaiting[0].id}`}
                  className="inline-flex h-10 items-center rounded-[12px] border border-ink/20 px-3 text-sm font-medium"
                >
                  Respond now
                </Link>
                <p className="text-sm text-muted">
                  {awaiting[0].comment_count ?? 0} recent comment
                  {(awaiting[0].comment_count ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">No decisions waiting on you right now.</p>
          )}
        </Card>

        <Card className="p-5 md:p-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-sage" />
              <CardTitle>Goals</CardTitle>
            </div>
            <Link href="/goals" className="text-sm font-medium text-clay">
              View all →
            </Link>
          </CardHeader>
          {activeGoal ? (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{activeGoal.title}</p>
                  <p className="mt-2 text-sm text-muted">
                    {habitProgressLabel(
                      activeGoal.goal?.current_value ?? 0,
                      activeGoal.goal?.target_value ?? 0,
                      activeGoal.goal?.unit ?? "weeks"
                    )}
                  </p>
                </div>
                <Badge tone={statusTone(activeGoal.status)}>
                  {statusLabel(activeGoal.status)}
                </Badge>
              </div>
              <ProgressBar
                className="mt-3"
                value={progressPercent(
                  activeGoal.goal?.current_value ?? 0,
                  activeGoal.goal?.target_value ?? 1
                )}
              />
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-muted">
                  {activeGoal.comment_count ?? 0} recent comments
                </span>
                <Link href={`/goals/${activeGoal.id}`} className="font-medium text-clay">
                  View goal →
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">Add a shared goal to get started.</p>
          )}
        </Card>

        <Card className="p-5 md:p-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-clay" />
              <CardTitle>Financial Targets</CardTitle>
            </div>
            <Link href="/finances" className="text-sm font-medium text-clay">
              View all →
            </Link>
          </CardHeader>
          {activeFinance?.financial ? (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{activeFinance.title}</p>
                  <p className="mt-2 text-sm text-muted">
                    {formatCurrency(activeFinance.financial.current_amount_cents)} of{" "}
                    {formatCurrency(activeFinance.financial.target_amount_cents)}
                  </p>
                </div>
                <Badge tone={statusTone(activeFinance.status)}>
                  {statusLabel(activeFinance.status)}
                </Badge>
              </div>
              <ProgressBar
                className="mt-3"
                value={progressPercent(
                  activeFinance.financial.current_amount_cents,
                  activeFinance.financial.target_amount_cents
                )}
              />
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-muted">
                  {activeFinance.comment_count ?? 0} recent comment
                  {(activeFinance.comment_count ?? 0) === 1 ? "" : "s"}
                </span>
                <Link href={`/finances/${activeFinance.id}`} className="font-medium text-clay">
                  View target →
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">Set a financial target together.</p>
          )}
        </Card>
      </div>

      <Card className="hidden p-5 md:block md:p-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-sage" />
            <CardTitle>Coming up</CardTitle>
          </div>
          <Link href="/calendar" className="text-sm font-medium text-clay">
            View calendar →
          </Link>
        </CardHeader>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((item) => (
            <Link
              key={item.id}
              href={`/${item.type === "financial_target" ? "finances" : `${item.type}s`}/${item.id}`}
              className="rounded-[16px] border border-border bg-page/50 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {formatShortDate(item.due_date)}
              </p>
              <p className="mt-2 text-sm font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-xs text-muted">All day</p>
            </Link>
          ))}
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Nothing on the calendar just yet.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-5 md:hidden">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 text-sage" />
          <p className="text-[15px] leading-relaxed text-muted">
            Small shifts, shared consistently, lead to the life you&apos;re building together. ♡
          </p>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  href,
  title,
  value,
  tone,
}: {
  href: string;
  title: string;
  value: string;
  tone: "sage" | "clay";
}) {
  return (
    <Link
      href={href}
      className="rounded-[18px] border border-border bg-card p-4 shadow-sm"
    >
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full ${
          tone === "sage" ? "bg-pale-sage text-success" : "bg-pale-clay text-clay"
        }`}
      >
        ·
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{value}</p>
      <p className="mt-3 text-sm font-medium text-clay">View →</p>
    </Link>
  );
}
