import Link from "next/link";
import { formatShortDate } from "@/lib/dates";
import { statusLabel, statusTone, typePath } from "@/lib/status";
import type { ItemWithMeta, Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { TaskCheckbox } from "./task-checkbox";
import { ProgressBar } from "@/components/ui/progress";
import { formatCurrency, progressPercent } from "@/lib/money";

export function ItemList({
  items,
  profiles,
  emptyMessage,
}: {
  items: ItemWithMeta[];
  profiles: Profile[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted">{emptyMessage}</p>
      </Card>
    );
  }

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const owner = item.owner_id ? profileMap[item.owner_id] : null;
        const href = `/${typePath(item.type)}/${item.id}`;
        return (
          <li key={item.id}>
            <Card className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                {item.type === "task" ? (
                  <TaskCheckbox
                    itemId={item.id}
                    completed={item.status === "completed"}
                    title={item.title}
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link href={href} className="min-w-0">
                      <h3
                        className={
                          item.status === "completed"
                            ? "font-display text-xl text-muted line-through md:text-2xl"
                            : "font-display text-xl text-ink md:text-2xl"
                        }
                      >
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
                      ) : null}
                    </Link>
                    <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>

                  {item.type === "goal" && item.goal ? (
                    <div className="mt-3">
                      <ProgressBar
                        value={progressPercent(
                          item.goal.current_value,
                          item.goal.target_value ?? 1
                        )}
                      />
                      <p className="mt-1 text-xs text-muted">
                        {item.goal.current_value} / {item.goal.target_value}{" "}
                        {item.goal.unit ?? ""}
                      </p>
                    </div>
                  ) : null}

                  {item.type === "financial_target" && item.financial ? (
                    <div className="mt-3">
                      <ProgressBar
                        value={progressPercent(
                          item.financial.current_amount_cents,
                          item.financial.target_amount_cents
                        )}
                      />
                      <p className="mt-1 text-xs text-muted">
                        {formatCurrency(item.financial.current_amount_cents)} of{" "}
                        {formatCurrency(item.financial.target_amount_cents)}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                    {owner ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar name={owner.full_name} size="sm" />
                        {owner.full_name}
                      </span>
                    ) : (
                      <span>Both</span>
                    )}
                    {item.due_date ? <span>Due {formatShortDate(item.due_date)}</span> : null}
                    <span>
                      {item.comment_count ?? 0} comment{(item.comment_count ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
