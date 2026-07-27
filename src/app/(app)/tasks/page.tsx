export const dynamic = "force-dynamic";

import { CreateItemButton } from "@/components/create/create-item-button";
import { ItemList } from "@/components/items/item-list";
import { requireHousehold, Shell } from "@/lib/session";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q } = await searchParams;
  const { repo, ctx } = await requireHousehold();
  let items = await repo.listItems("task", { search: q });
  const profiles = ctx.members.map((m) => m.profile);

  return (
    <Shell ctx={ctx}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink md:text-5xl">Tasks</h1>
          <p className="mt-1 text-muted">Shared to-dos with clear owners and dates.</p>
        </div>
        <div className="hidden md:block">
          <CreateItemButton />
        </div>
      </div>
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search tasks…"
          className="h-11 w-full max-w-md rounded-[13px] border border-border bg-card px-3.5 text-[15px]"
        />
      </form>
      <ItemList
        items={items}
        profiles={profiles}
        emptyMessage="No tasks yet. Add something you can finish together."
      />
    </Shell>
  );
}
