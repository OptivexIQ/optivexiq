import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/services/supabase/server";

export async function requireApiUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: data.user, response: null };
}
