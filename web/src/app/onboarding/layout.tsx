import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

export const dynamic = "force-dynamic";

/**
 * Onboarding is for brand-new accounts only. A returning user (their workspace is already saved
 * on the account) lands on the dashboard, whichever way they signed in and on whichever device.
 */
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (user) {
    const { data } = await adminClient().database.from("ms_state").select("user_id").eq("user_id", user.id).limit(1);
    if (data?.length) redirect("/home");
  }
  return children;
}
