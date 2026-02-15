import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/services/supabase/server";

export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function requireUser() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
