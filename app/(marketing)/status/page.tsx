import StatusPageClient from "@/features/status/components/StatusPageClient";

export const metadata = {
  title: "System Status | OptivexIQ",
  description: "Current availability and recent operational updates for OptivexIQ.",
};

export default function StatusPage() {
  return <StatusPageClient />;
}
