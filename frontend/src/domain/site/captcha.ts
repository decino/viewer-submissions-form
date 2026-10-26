import type { CaptchaConfig } from "../../types/api";

export function captchaRequired(config: CaptchaConfig | null): boolean {
    return config?.captchaType === "turnstile" && Boolean(config.siteKey);
}
