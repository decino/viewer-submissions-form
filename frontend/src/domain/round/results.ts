import type { SubmissionStatus, SubmissionStatusName } from "../../types/api";

type StatusedSubmission = {
    chosen: boolean;
    status: SubmissionStatus | null;
};

const UNPLAYED = Number.MAX_SAFE_INTEGER;

const STILL_TO_PLAY: ReadonlySet<SubmissionStatusName> = new Set(["Queued", "In Progress"]);

export function chosenInPlayOrder<T extends { chosen: boolean; playOrder: number | null; id: number }>(
    submissions: readonly T[],
): T[] {
    return submissions
        .filter(submission => submission.chosen)
        .sort((a, b) => (a.playOrder ?? UNPLAYED) - (b.playOrder ?? UNPLAYED) || a.id - b.id);
}

export function notChosen<T extends { chosen: boolean; id: number }>(submissions: readonly T[]): T[] {
    return submissions.filter(submission => !submission.chosen).sort((a, b) => a.id - b.id);
}

export function roundsOldestFirst<T extends { id: number }>(rounds: readonly T[]): T[] {
    return [...rounds].sort((a, b) => a.id - b.id);
}

export function splitLatestRound<T extends { id: number }>(rounds: readonly T[]): { latest: T | null; older: T[] } {
    const ordered = roundsOldestFirst(rounds);

    return { latest: ordered.length > 0 ? ordered[ordered.length - 1] : null, older: ordered.slice(0, -1) };
}

export function isBeingPlayed(submissions: readonly StatusedSubmission[]): boolean {
    return submissions.some(
        submission => submission.chosen && submission.status !== null && STILL_TO_PLAY.has(submission.status.status),
    );
}
