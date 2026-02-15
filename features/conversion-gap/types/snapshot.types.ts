import type { HeroOutput } from "@/features/conversion-gap/types/gap.types";

export type SnapshotResult = {
  weaknesses: string[];
  hero: HeroOutput;
  uncoveredObjection: string;
};
