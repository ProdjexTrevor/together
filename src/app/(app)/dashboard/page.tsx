export const dynamic = "force-dynamic";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireHousehold, Shell } from "@/lib/session";

export default async function DashboardPage() {
  const { repo, ctx } = await requireHousehold();
  const [tasks, decisions, goals, finances, checkIns] = await Promise.all([
    repo.listItems("task"),
    repo.listItems("decision"),
    repo.listItems("goal"),
    repo.listItems("financial_target"),
    repo.getLatestWellnessCheckIns().catch(() => ({ mine: null, partner: null })),
  ]);

  return (
    <Shell ctx={ctx}>
      <DashboardView
        ctx={ctx}
        tasks={tasks}
        decisions={decisions}
        goals={goals}
        finances={finances}
        checkIns={checkIns}
      />
    </Shell>
  );
}
