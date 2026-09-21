import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/AppHeader";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();

  const displayName = profile?.display_name ?? user.email ?? "utilisateur";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader displayName={displayName} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
