import { type NextRequest } from "next/server";
import { withGuards } from "@/middleware/withGuards";
import { handleGenerateStream } from "@/features/ai/services/generateStreamService";

export async function POST(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) =>
    handleGenerateStream({ request, userId, requestId }),
  );
}
