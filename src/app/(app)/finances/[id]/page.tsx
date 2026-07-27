import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { DiscussionPanel } from "@/components/comments/discussion-panel";
import { AddContributionButton } from "@/components/items/add-contribution-button";
import { DeleteItemButton } from "@/components/items/delete-item-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { formatLongDate, formatShortDate } from "@/lib/dates";
import {
  formatCurrency,
  progressPercent,
  remainingCents,
  suggestedMonthlyCents,
} from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/status";
import { requireHousehold, Shell } from "@/lib/session";

export default async function FinanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repo, ctx } = await requireHousehold();
  const item = await repo.getItem(id);
  if (!item || item.type !== "financial_target" || !item.financial) notFound();

  const [comments, reactions] = await Promise.all([
    repo.listComments(id),
    repo.listReactions(id),
  ]);

  const { current_amount_cents, target_amount_cents } = item.financial;
  const pct = progressPercent(current_amount_cents, target_amount_cents);
  const remaining = remainingCents(target_amount_cents, current_amount_cents);
  const monthly = item.due_date
    ? suggestedMonthlyCents(target_amount_cents, current_amount_cents, new Date(item.due_date))
    : 0;

  const profileMap = Object.fromEntries(ctx.members.map((m) => [m.user_id, m.profile]));

  return (
    <Shell ctx={ctx}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/finances" className="text-sm font-medium text-muted hover:text-ink">
          ← Financial Target
        </Link>
        <DeleteItemButton itemId={item.id} itemType={item.type} title={item.title} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pale-clay text-xl text-clay">
                $
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h1 className="font-display text-3xl text-ink md:text-4xl">{item.title}</h1>
                  <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                </div>
                {item.description ? (
                  <p className="mt-2 text-[15px] italic text-muted">{item.description}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-lg font-medium text-ink">
                  {formatCurrency(current_amount_cents)} of {formatCurrency(target_amount_cents)}
                </p>
                <p className="text-sm text-muted">{pct}% complete</p>
              </div>
              <ProgressBar className="mt-3" value={pct} />
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
                <CalendarDays className="h-4 w-4" />
                {item.due_date ? formatLongDate(item.due_date) : "No target date"} ·{" "}
                {formatCurrency(remaining)} remaining
              </p>
              {monthly > 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Suggested monthly: {formatCurrency(monthly)}
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Contributions</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {(item.contributions ?? []).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-ink">{formatCurrency(c.amount_cents)}</p>
                    <p className="text-muted">
                      {profileMap[c.contributor_id]?.full_name ?? "Partner"} ·{" "}
                      {formatShortDate(c.contributed_at)}
                    </p>
                    {c.note ? <p className="text-muted">{c.note}</p> : null}
                  </div>
                </li>
              ))}
              {(item.contributions ?? []).length === 0 ? (
                <li className="text-sm text-muted">No contributions yet.</li>
              ) : null}
            </ul>
          </Card>

          <div className="md:hidden">
            <AddContributionButton itemId={item.id} />
          </div>
          <div className="hidden md:block">
            <AddContributionButton itemId={item.id} />
          </div>
        </div>

        <DiscussionPanel
          itemId={item.id}
          comments={comments}
          reactions={reactions}
          profiles={ctx.members.map((m) => m.profile)}
        />
      </div>
    </Shell>
  );
}
