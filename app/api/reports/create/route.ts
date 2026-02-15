import { type NextRequest } from "next/server";
import { handleReportMutationRoute } from "@/features/reports/api/reportMutationRouteHandler";

export async function POST(request: NextRequest) {
  return handleReportMutationRoute(request);
}
