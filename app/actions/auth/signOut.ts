"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logSignOutEvent } from "@/lib/auth/audit";

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  await supabase.auth.signOut();

  if (data.user) {
    logSignOutEvent(data.user.id, data.user.email);
  }

  redirect("/login");
}
