import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { getBillingEntitlementState } from "@/features/billing/services/billingEntitlementService";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const entitlement = await getBillingEntitlementState(user.id);
  return NextResponse.json(entitlement);
}

