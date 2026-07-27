import { beforeEach, describe, expect, it } from "vitest";
import { demoRepository, IDS } from "@/services/demo/repository";

describe("demo authorization", () => {
  beforeEach(() => {
    demoRepository.reset();
  });

  it("allows household members to read shared items", async () => {
    await demoRepository.signIn("trevor@together.app", "together123");
    const item = await demoRepository.getItem(IDS.decisionVacation);
    expect(item?.title).toBe("Summer vacation location");
  });

  it("blocks cross-household access", async () => {
    await demoRepository.signOut();
    await demoRepository.createHousehold("Alex", "Alex & Co");
    await expect(demoRepository.getItem(IDS.decisionVacation)).rejects.toThrow(/Forbidden/);
  });

  it("updates financial progress after contribution", async () => {
    await demoRepository.signIn("trevor@together.app", "together123");
    const before = await demoRepository.getItem(IDS.financeEmergency);
    const beforeCents = before!.financial!.current_amount_cents;
    const updated = await demoRepository.addContribution(IDS.financeEmergency, 100);
    expect(updated.financial!.current_amount_cents).toBe(beforeCents + 10000);
  });

  it("deletes an item and blocks further access", async () => {
    await demoRepository.signIn("trevor@together.app", "together123");
    await demoRepository.deleteItem(IDS.taskGrocery);
    expect(await demoRepository.getItem(IDS.taskGrocery)).toBeNull();
  });
});
