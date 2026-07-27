import { redirect } from "next/navigation";
import { getRepository } from "@/services";

export const dynamic = "force-dynamic";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRepository().getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }

  return children;
}
