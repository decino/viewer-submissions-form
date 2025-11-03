import type { HomeViewModel, SubmissionModel } from "../../types";

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}

class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function getHomeData(): Promise<HomeViewModel> {
    const response = await fetch(`${API_BASE}/home/data`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, error.message || "Failed to fetch home data");
    }

    return response.json();
}

export async function submitEntry(submission: SubmissionModel, file?: File): Promise<ApiResponse> {
    const formData = new FormData();

    // Add all submission fields to FormData
    Object.entries(submission).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                value.forEach(item => formData.append(key, item));
            } else {
                formData.append(key, value.toString());
            }
        }
    });

    if (file) {
        formData.append("file", file);
    }

    const response = await fetch(`${API_BASE}/submission/addEntry`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, error.message || "Failed to submit entry");
    }

    return response.json();
}

export async function getCorsProxy(url: string): Promise<string> {
    const response = await fetch(`${API_BASE}/utils/corsProxy?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
        throw new ApiError(response.status, "Failed to fetch URL");
    }

    return response.text();
}

export async function getStats(roundId: number): Promise<unknown> {
    const response = await fetch(`${API_BASE}/stats/round/${roundId}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, error.message || "Failed to fetch stats");
    }

    return response.json();
}

export function getDownloadUrl(roundId: number, submissionId: number): string {
    return `${API_BASE}/submission/download/${roundId}/${submissionId}`;
}

export { ApiError };
