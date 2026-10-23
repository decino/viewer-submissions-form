import type { CurrentRound, RoundSubmission } from "../../types/api";

export function sortSubmissions(round: CurrentRound): CurrentRound {
    return { ...round, submissions: [...round.submissions].sort((a, b) => a.id - b.id) };
}

export function addSubmission(round: CurrentRound, submission: RoundSubmission): CurrentRound {
    if (round.submissions.some(existing => existing.id === submission.id)) {
        return round;
    }

    return { ...round, submissions: [...round.submissions, submission] };
}

export function removeSubmissions(round: CurrentRound, ids: readonly number[]): CurrentRound {
    const removed = new Set(ids);
    const submissions = round.submissions.filter(submission => !removed.has(submission.id));

    if (submissions.length === round.submissions.length) {
        return round;
    }

    return { ...round, submissions };
}
