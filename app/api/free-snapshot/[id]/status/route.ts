import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import { getFreeSnapshotStatus } from "@/features/free-snapshot/services/freeSnapshotStatusService";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  const { id } = await context.params;
  const result = await getFreeSnapshotStatus(id);

  if (!result.ok) {
    return errorResponse(
      result.status === 404 ? "not_found" : "internal_error",
      result.error,
      result.status,
      { requestId, headers: { "x-request-id": requestId } },
    );
  }

  return NextResponse.json(result.data, {
    status: 200,
    headers: { "x-request-id": requestId },
  });
}
