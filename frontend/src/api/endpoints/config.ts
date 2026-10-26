import { apiFetch } from "../client";
import type { CaptchaConfig, UploadConfig } from "../../types/api";

export async function getCaptchaConfig(): Promise<CaptchaConfig> {
    return apiFetch<CaptchaConfig>("/config/captcha");
}

export async function getUploadConfig(): Promise<UploadConfig> {
    return apiFetch<UploadConfig>("/config/upload");
}
