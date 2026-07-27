export const dynamic = "force-dynamic";

import { addCouponAction, redeemCouponAction } from "@/services/basecamp/actions";
import { basecampService } from "@/services/basecamp/service";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default async function BasecampCouponsPage() {
  const coupons = await basecampService.listCoupons();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[var(--ink)]">Sex coupons</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Write IOUs you actually want redeemed. Tap redeem when it&apos;s go time.
        </p>
      </div>

      <form action={addCouponAction} className="space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
        <Input name="title" required placeholder="Coupon title (filthy + clear)" />
        <Textarea name="body" required placeholder="Details / limits / how to redeem…" rows={3} />
        <Button type="submit">Add coupon</Button>
      </form>

      <ul className="space-y-3">
        {coupons.map((c) => (
          <li
            key={c.id}
            className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl text-[var(--ink)]">{c.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{c.body}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-[var(--clay)]">
                  {c.status}
                </p>
              </div>
              {c.status === "available" ? (
                <form action={redeemCouponAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" size="sm">
                    Redeem
                  </Button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
