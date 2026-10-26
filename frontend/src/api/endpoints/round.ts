import { apiFetch } from "../client";
import type { CurrentRound, PreviousRound } from "../../types/api";

export async function getCurrentRound(): Promise<CurrentRound | null> {
    const round = await apiFetch<CurrentRound | undefined>("/round/current");
    return round ?? null;
}

export async function getPreviousRounds(): Promise<PreviousRound[]> {
    return apiFetch<PreviousRound[]>("/round/previous");
}
