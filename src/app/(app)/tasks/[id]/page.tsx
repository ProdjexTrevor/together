import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscussionPanel } from "@/components/comments/discussion-panel";
import { TaskCheckbox } from "@/components/items/task-checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatLongDate } from "@/lib/dates";
import { statusLabel, statusTone } from "@/lib/status";
import { requireHousehold, Shell } from "@/lib/session";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repo, ctx } = await requireHousehold();
  const item = await repo.getItem(id);
  if (!item || item.type !== "task") notFound();

  const [comments, reactions, activity] = await Promise.all([
    repo.listComments(id),
    repo.listReactions(id),
    repo.listActivity(id),
  ]);
  const profiles = ctx.members.map((m) => m.profile);

  return (
    <Shell ctx={ctx}>
      <Link href="/tasks" className="text-sm font-medium text-muted hover:text-ink">
        ← Tasks
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <TaskCheckbox
              itemId={item.id}
              completed={item.status === "completed"}
              title={item.title}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="font-display text-4xl text-ink md:text-5xl">{item.title}</h1>
                <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
              </div>
              {item.description ? (
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
                  {item.description}
                </p>
              ) : null}
              <dl className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-ink">Due</dt>
                  <dd>{item.due_date ? formatLongDate(item.due_date) : "No due date"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Priority</dt>
                  <dd className="capitalize">{item.priority}</dd>
                </div>
              </dl>
            </div>
          </div>

          {item.checklist && item.checklist.length > 0 ? (
            <Card className="p-5">
              <h2 className="font-display text-2xl text-ink">Checklist</h2>
              <ul className="mt-3 space-y-2">
                {item.checklist.map((row) => (
                  <li key={row.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border border-border ${
                        row.completed ? "bg-pale-sage text-success" : ""
                      }`}
                    >
                      {row.completed ? "✓" : null}
                    </span>
                    <span className={row.completed ? "text-muted line-through" : "text-ink"}>
                      {row.title}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="font-display text-2xl text-ink">Activity & history</h2>
            <ul className="mt-4 space-y-3">
              {activity.map((event) => (
                <li key={event.id} className="text-sm text-muted">
                  <span className="font-medium text-ink">{event.summary}</span>
                  <span className="ml-2">{formatLongDate(event.created_at)}</span>
                </li>
              ))}
              {activity.length === 0 ? (
                <li className="text-sm text-muted">No activity yet.</li>
              ) : null}
            </ul>
          </Card>
        </div>

        <DiscussionPanel
          itemId={item.id}
          comments={comments}
          reactions={reactions}
          profiles={profiles}
        />
      </div>
    </Shell>
  );
}
