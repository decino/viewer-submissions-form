import { apiFetch, apiPost, buildQueryString } from "../client";
import type { AdminSubmission, SuccessResponse } from "../../types/api";

export async function buildResultSet(): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/submissionRoundResult/buildResultSet");
}

export async function generateEntries(count: number): Promise<AdminSubmission[]> {
    const qs = buildQueryString({ count });
    return apiFetch<AdminSubmission[]>(`/submissionRoundResult/generateEntries${qs}`);
}

export async function submitEntries(ids: number[]): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/submissionRoundResult/submitEntries", ids);
}

export async function addRandomEntry(roundId: number): Promise<AdminSubmission> {
    const qs = buildQueryString({ roundId });
    return apiPost<AdminSubmission>(`/submissionRoundResult/addRandomEntry${qs}`);
}
