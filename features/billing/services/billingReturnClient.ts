import { httpClient } from "@/lib/api/httpClient";

export type BillingEntitlementResponse = {
  isEntitled: boolean;
  plan: "starter" | "pro" | "growth" | null;
  status: string;
  currentPeriodEnd: string | null;
};

export async function fetchBillingEntitlement() {
  return httpClient<BillingEntitlementResponse>("/api/billing/entitlement", {
    method: "GET",
    cache: "no-store",
  });
}

