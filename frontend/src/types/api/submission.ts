export type SubmissionStatusName = "Completed" | "Rejected" | "In Progress" | "Queued";

export type RecordedFormat = "Blind" | "Practised";

export interface SubmissionStatus {
    status: SubmissionStatusName;
    additionalInfo: string | null;
    submissionId: number;
}

export interface PublicSubmission {
    id: number;
    created: string;
    updated: string;
    WADName: string;
    level: string;
    authorName: string | null;
    submissionRoundId: number;
    playOrder: number | null;
    youtubeLink: string | null;
    status: SubmissionStatus | null;
    chosen: boolean;
    recordedFormat: RecordedFormat;
    downloadUrl: string | null;
}

export interface AdminSubmission extends PublicSubmission {
    playTestEngine: string | null;
    WAD: string | null;
    engine: number;
    gzDoomAction: number[] | null;
    author: boolean;
    distributable: boolean;
    info: string | null;
    customWad: string | null;
    email: string;
    submissionValid: boolean;
    verified: boolean;
}

export interface SubmissionStatusChange {
    submissionId: number;
    status: SubmissionStatusName;
    additionalInfo?: string;
}
