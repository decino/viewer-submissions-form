import { apiDelete, ApiError, apiFetch, apiPost, buildQueryString } from "../client";
import type { AdminRound, SuccessResponse } from "../../types/api";

export async function getActiveRoundForAdmin(): Promise<AdminRound | null> {
    try {
        return await apiFetch<AdminRound>("/submissionRound/currentActiveRound");
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function getRoundsForAdmin(includeActive: boolean): Promise<AdminRound[]> {
    const qs = buildQueryString({ includeActive });
    return apiFetch<AdminRound[]>(`/submissionRound/getAllRounds${qs}`);
}

export async function createRound(data: { name: string; endDate?: number }): Promise<AdminRound> {
    const qs = buildQueryString({ name: data.name, endDate: data.endDate });
    return apiPost<AdminRound>(`/submissionRound/newRound${qs}`);
}

export async function pauseRound(pause: boolean): Promise<SuccessResponse> {
    const qs = buildQueryString({ pause });
    return apiPost<SuccessResponse>(`/submissionRound/pauseRound${qs}`);
}

export async function deleteRound(roundId: number): Promise<SuccessResponse> {
    return apiDelete<SuccessResponse>(`/submissionRound/${roundId}/deleteRound`);
}
