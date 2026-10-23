import { apiFetch, apiFetchText, apiPost, buildQueryString } from "../client";
import type { WadValidation } from "../../types/api";

export async function fetchThroughProxy(url: string): Promise<string> {
    const qs = buildQueryString({ url });
    return apiFetchText(`/utils/corsProxy${qs}`);
}

export async function getWadValidation(): Promise<WadValidation> {
    return apiFetch<WadValidation>("/utils/wadValidation");
}

export async function saveWadValidation(validation: WadValidation): Promise<void> {
    return apiPost<void>("/utils/wadValidation", validation);
}
