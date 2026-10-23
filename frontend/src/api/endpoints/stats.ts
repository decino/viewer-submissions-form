import { apiFetch } from "../client";
import type { RoundStats } from "../../types/api";

export async function getRoundStats(roundId: number): Promise<RoundStats> {
    return apiFetch<RoundStats>(`/stats/${roundId}`);
}
