export const dynamic = "force-dynamic";

import { CreateItemButton } from "@/components/create/create-item-button";
import { ItemList } from "@/components/items/item-list";
import { requireHousehold, Shell } from "@/lib/session";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { repo, ctx } = await requireHousehold();
  const items = await repo.listItems("decision", { search: q });

  return (
    <Shell ctx={ctx}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink md:text-5xl">Decisions</h1>
          <p className="mt-1 text-muted">Choose together with options, votes, and discussion.</p>
        </div>
        <div className="hidden md:block">
          <CreateItemButton />
        </div>
      </div>
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search decisions…"
          className="h-11 w-full max-w-md rounded-[13px] border border-border bg-card px-3.5 text-[15px]"
        />
      </form>
      <ItemList
        items={items}
        profiles={ctx.members.map((m) => m.profile)}
        emptyMessage="No open decisions. Start one when you need a shared choice."
      />
    </Shell>
  );
}
