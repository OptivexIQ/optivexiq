import type {
  PositioningMapData,
} from "@/features/positioning-map/types/positioningMap.types";
import { logger } from "@/lib/logger";
import { getServerUser } from "@/lib/auth/getServerUser";
import { readPositioningMapForUser } from "@/features/positioning-map/services/positioningMapReadService";

export type PositioningMapFetchResult =
  | { status: "ok"; data: PositioningMapData | null }
  | { status: "not-found"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "error"; message: string };

export async function fetchPositioningMap(
  reportId: string,
): Promise<PositioningMapFetchResult> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { status: "forbidden", message: "Forbidden." };
    }

    const result = await readPositioningMapForUser(reportId, user.id);
    if (result.status === "not-found") {
      return { status: "not-found", message: "Report not found." };
    }

    if (result.status === "forbidden") {
      return { status: "forbidden", message: "Forbidden." };
    }

    return { status: "ok", data: result.payload.positioning };
  } catch (error) {
    logger.error("Failed to fetch positioning map data.", error);
    return { status: "error", message: "Failed to load positioning data." };
  }
}
