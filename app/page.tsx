import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { FreeAuditForm } from "@/components/FreeAuditForm";
import { ConversionEngine } from "@/components/ConversionEngine";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/layout/Footer";

function SectionDivider() {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="h-px bg-border" />
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <Hero />
      <SectionDivider />
      <Problem />
      <SectionDivider />
      <Solution />
      <SectionDivider />
      <FreeAuditForm />
      <SectionDivider />
      <ConversionEngine />
      <SectionDivider />
      <BeforeAfter />
      <SectionDivider />
      <Pricing />
      <SectionDivider />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </>
  );
}
