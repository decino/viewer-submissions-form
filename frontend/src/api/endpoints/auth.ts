import { ApiError, apiFetch, apiPost } from "../client";
import type { SessionUser, SuccessResponse } from "../../types/api";

export const LOGOUT_URL = "/rest/auth/logout";

export async function login(data: {
    email: string;
    password: string;
    turnstileToken?: string;
}): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/auth/login", {
        email: data.email,
        password: data.password,
        "cf-turnstile-response": data.turnstileToken,
    });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
    try {
        return await apiFetch<SessionUser>("/auth/current_user");
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return null;
        }
        throw error;
    }
}

export async function changeDetails(data: { email: string; password: string }): Promise<SuccessResponse> {
    return apiPost<SuccessResponse>("/auth/changeDetails", data);
}
