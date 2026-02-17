import { BillingReturnStatus } from "@/features/billing/components/BillingReturnStatus";

type BillingReturnPageProps = {
  searchParams?:
    | {
        checkout_ref?: string;
      }
    | Promise<{
        checkout_ref?: string;
      }>;
};

type BillingReturnSearchParams = {
  checkout_ref?: string;
};

export default async function BillingReturnPage({
  searchParams,
}: BillingReturnPageProps) {
  const resolvedParams = (await Promise.resolve(searchParams)) ?? {};
  const checkoutRef = resolvedParams?.checkout_ref ?? null;

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <BillingReturnStatus checkoutRef={checkoutRef} />
    </main>
  );
}
