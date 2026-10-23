export interface SessionUser {
    id: string;
    email: string;
}

export interface CaptchaConfig {
    captchaType: "turnstile" | null;
    siteKey: string | null;
}

export interface UploadConfig {
    fileSizeLimitMb: number;
    allowedExtensions: string[];
}

export interface SuccessResponse {
    success: boolean;
    description: string;
}

interface YesNoCount {
    Yes: number;
    No: number;
}

export interface RoundStats {
    recordFormat: { Practised: number; Blind: number } | null;
    isAuthor: YesNoCount | null;
    distributable: YesNoCount | null;
}

export interface WadValidation {
    allowedExtensions: string[];
    allowedHeaders: (string | null)[];
    allowedExtensionsZip: string[];
    allowedHeadersZip: (string | null)[];
}
