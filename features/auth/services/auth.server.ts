import { createSupabaseServerClient } from "@/services/supabase/server";

type SignUpInput = {
  email: string;
  password: string;
  name?: string;
  emailRedirectTo?: string;
};

export async function signUpWithEmail({
  email,
  password,
  name,
  emailRedirectTo,
}: SignUpInput) {
  const supabase = await createSupabaseServerClient();

  const options = {
    data: {
      full_name: name,
    },
    ...(emailRedirectTo ? { emailRedirectTo } : {}),
  };

  return supabase.auth.signUp({
    email,
    password,
    options,
  });
}
