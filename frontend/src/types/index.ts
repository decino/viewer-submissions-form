export interface SubmissionModel {
    id?: number;
    wadName: string;
    wadUrl?: string;
    wadLevel: string;
    playTestEngine: string;
    engine: string;
    gzDoomAction?: string[];
    authorName?: string;
    author: boolean;
    distributable?: boolean;
    info?: string;
    email?: string;
    recordedFormat: "Blind" | "Practised";
    customWadFileName?: string;
    downloadToken?: string;
    youtubeLink?: string;
    submitterName?: string;
    isChosen?: boolean;
    playOrder?: number;
    status?: SubmissionStatus;
}

export interface SubmissionStatus {
    status: "Queued" | "In Progress" | "Completed" | "Rejected";
    additionalInfo?: string;
}

export interface SubmissionRoundModel {
    id: number;
    name: string;
    endDate?: number;
    paused: boolean;
    submissions: SubmissionModel[];
    active: boolean;
}

export interface HomeViewModel {
    currentActiveRound: SubmissionRoundModel | null;
    previousRounds: SubmissionRoundModel[];
    doomEngines: Record<string, string>;
    gzActions: Record<string, string>;
    allowedUploadExtensions: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface ChartConfig {
    containerId: string;
    title: string;
}

export interface SubmissionStats {
    distributable: Record<string, number>;
    isAuthor: Record<string, number>;
    recordFormat: Record<string, number>;
}

export type CaptchaType = "turnstile" | "reCAPTCHA" | "hCaptcha" | null;

export enum DoomEngine {
    UNKNOWN = "UNKNOWN",
    NA = "NA",
    GZDoom = "GZDoom",
    Doom = "Doom",
    DoomII = "DoomII",
    FINAL_DOOM = "FINAL_DOOM",
    BOOM = "BOOM",
    MBF = "MBF",
    DOOM_64 = "DOOM_64",
}

export enum GZAction {
    JUMP = "JUMP",
    CROUCH = "CROUCH",
    MOUSE_LOOK = "MOUSE_LOOK",
}
