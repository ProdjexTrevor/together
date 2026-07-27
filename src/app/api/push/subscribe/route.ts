import { NextResponse } from "next/server";
import { getRepository } from "@/services";
import { removePushSubscription, savePushSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const user = await getRepository().getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const endpoint = String(body.endpoint || "");
  const p256dh = String(body.keys?.p256dh || "");
  const auth = String(body.keys?.auth || "");

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription({
    userId: user.id,
    endpoint,
    p256dh,
    auth,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getRepository().getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const endpoint = String(body.endpoint || "");
  if (endpoint) {
    await removePushSubscription(endpoint);
  }
  return NextResponse.json({ ok: true });
}
