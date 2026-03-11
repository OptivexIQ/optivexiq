import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { FreeSnapshotForm } from "@/features/free-snapshot/components/FreeSnapshotForm";
import { ConversionEngine } from "@/components/ConversionEngine";
import { Methodology } from "@/components/Methodology";
import { ProofSection } from "@/components/ProofSection";
import { WhyNotChatGPT } from "@/components/WhyNotChatGPT";
import { Pricing } from "@/components/Pricing";
import { FinalCTA } from "@/components/FinalCTA";

function SectionDivider() {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="h-px bg-border" />
    </div>
  );
}

type MarketingPageProps = {
  searchParams?:
    | {
        currency?: string;
      }
    | Promise<{
        currency?: string;
      }>;
};

export default async function Page({ searchParams }: MarketingPageProps) {
  const resolvedParams = (await Promise.resolve(searchParams)) ?? {};

  return (
    <>
      <Hero />
      <SectionDivider />
      <Problem />
      <SectionDivider />
      <Solution />
      <SectionDivider />
      <FreeSnapshotForm />
      <SectionDivider />
      <ConversionEngine />
      <SectionDivider />
      <Methodology />
      <SectionDivider />
      <ProofSection />
      <SectionDivider />
      <WhyNotChatGPT />
      <SectionDivider />
      <Pricing selectedCurrency={resolvedParams.currency} />
      <SectionDivider />
      <FinalCTA />
    </>
  );
}
