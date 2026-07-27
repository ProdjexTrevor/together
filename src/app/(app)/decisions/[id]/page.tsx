import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { DiscussionPanel } from "@/components/comments/discussion-panel";
import { DecisionOptions } from "@/components/items/decision-options";
import { DeleteItemButton } from "@/components/items/delete-item-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatLongDate } from "@/lib/dates";
import { statusLabel, statusTone } from "@/lib/status";
import { requireHousehold, Shell } from "@/lib/session";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repo, ctx } = await requireHousehold();
  const item = await repo.getItem(id);
  if (!item || item.type !== "decision") notFound();

  const [comments, reactions, activity] = await Promise.all([
    repo.listComments(id),
    repo.listReactions(id),
    repo.listActivity(id),
  ]);

  const myResponse = item.responses?.find((r) => r.user_id === ctx.currentUser.id);
  const partnerResponse = ctx.partner
    ? item.responses?.find((r) => r.user_id === ctx.partner!.id)
    : null;

  return (
    <Shell ctx={ctx}>
      <Link href="/decisions" className="text-sm font-medium text-muted hover:text-ink">
        ← Decisions
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
                {item.title}
              </h1>
              {item.description ? (
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.description}</p>
              ) : null}
              {!myResponse && item.status === "awaiting_response" ? (
                <p className="mt-3 text-sm font-medium text-clay">Your response is needed</p>
              ) : null}
              {myResponse && !partnerResponse ? (
                <p className="mt-3 text-sm font-medium text-muted">Waiting for your partner</p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                <DeleteItemButton itemId={item.id} itemType={item.type} title={item.title} />
              </div>
              {item.due_date ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-clay">
                  <CalendarDays className="h-4 w-4" />
                  Decision deadline {formatLongDate(item.due_date)}
                </p>
              ) : null}
            </div>
          </div>

          <DecisionOptions
            itemId={item.id}
            options={item.options ?? []}
            responses={item.responses ?? []}
            currentUserId={ctx.currentUser.id}
          />

          <Card className="p-5">
            <h2 className="font-display text-2xl text-ink">Activity & history</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {activity.map((event) => (
                <li key={event.id} className="rounded-[14px] bg-page/70 p-3 text-sm">
                  <p className="font-medium text-ink">{event.summary}</p>
                  <p className="mt-1 text-muted">{formatLongDate(event.created_at)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <DiscussionPanel
          itemId={item.id}
          comments={comments}
          reactions={reactions}
          profiles={ctx.members.map((m) => m.profile)}
          highlightFirstPartner
        />
      </div>
    </Shell>
  );
}
