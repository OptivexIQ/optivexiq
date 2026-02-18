import { createSupabaseServerClient } from "@/services/supabase/server";
import type { ContactRequestInput } from "@/features/contact/validators/contactRequestSchema";

type SaveContactRequestParams = {
  payload: ContactRequestInput;
  ipAddress: string;
  userAgent: string;
};

type SaveContactRequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveContactRequest({
  payload,
  ipAddress,
  userAgent,
}: SaveContactRequestParams): Promise<SaveContactRequestResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_requests").insert({
    name: payload.name,
    email: payload.email,
    topic: payload.topic,
    company: payload.company || null,
    message: payload.message,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    status: "new",
  });

  if (error) {
    return { ok: false, error: "Unable to submit contact request." };
  }

  return { ok: true };
}
