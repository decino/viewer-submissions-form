import { Exception } from "@tsed/exceptions";
import SETTING from "../model/constants/Settings";

export type HttpErrorRenderObj<T extends Exception> = {
    status: number;
    message: string;
    internalError: T;
};

export type CaptchaResponse = {
    success: boolean;
    challenge_ts: string;
    hostname: string;
    "error-codes": string[];
};

export type ReCAPTCHAResponse = CaptchaResponse;

export type TurnstileResponse = CaptchaResponse & {
    action: string;
    cdata: string;
};

export type HcaptchaResponse = CaptchaResponse;

export type SettingsMap = Map<SETTING, string>;
