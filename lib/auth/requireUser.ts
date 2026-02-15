import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";

export async function requireUser() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
