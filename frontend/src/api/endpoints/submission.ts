import { apiDeleteWithBody, apiFetch, apiPost, apiPostFormData, buildQueryString } from "../client";
import type { AdminSubmission, PublicSubmission, SubmissionStatusChange, SuccessResponse } from "../../types/api";

export async function submitEntry(formData: FormData): Promise<PublicSubmission> {
    return apiPostFormData<PublicSubmission>("/submission/addEntry", formData);
}

export async function confirmSubmission(uid: string): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/submission/confirm", { uid });
}

export async function getSubmission(id: number): Promise<AdminSubmission | null> {
    const submission = await apiFetch<AdminSubmission | undefined>(`/submission/getSubmission/${id}`);
    return submission ?? null;
}

export async function modifyEntry(formData: FormData): Promise<void> {
    return apiPostFormData<void>("/submission/modifyEntry", formData);
}

export async function changeStatus(change: SubmissionStatusChange): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/submission/changeStatus", change);
}

export async function setYoutubeLink(id: number, link: string | null): Promise<SuccessResponse> {
    const qs = buildQueryString({ link: link ?? undefined });
    return apiPost<SuccessResponse>(`/submission/${id}/setYoutubeLink${qs}`);
}

export async function verifyEntries(ids: number[]): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/submission/verifyEntries", ids);
}

export async function deleteEntries(ids: number[]): Promise<SuccessResponse> {
    return apiDeleteWithBody<SuccessResponse>("/submission/deleteEntries", ids);
}
