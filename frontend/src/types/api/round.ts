import type { AdminSubmission, PublicSubmission } from "./submission";

export interface RoundSubmission {
    id: number;
    WADName: string;
    level: string;
}

interface Round<S> {
    id: number;
    created: string;
    updated: string;
    active: boolean;
    name: string;
    paused: boolean;
    endDate: string | null;
    submissions: S[];
}

export type CurrentRound = Omit<Round<RoundSubmission>, "updated" | "active">;

export type PreviousRound = Round<PublicSubmission>;

export type AdminRound = Round<AdminSubmission>;
