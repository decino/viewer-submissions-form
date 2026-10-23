import type { AdminRound, AdminSubmission } from "../../types/api";

interface WadTally {
    name: string;
    count: number;
}

export function adminDownloadUrl(submission: AdminSubmission): string | null {
    if (submission.customWad) {
        return `/rest/submission/download/${submission.submissionRoundId}/${submission.id}`;
    }

    return submission.WAD ? submission.WAD : null;
}

export function confirmedSubmissions(round: AdminRound): AdminSubmission[] {
    return round.submissions.filter(submission => submission.submissionValid);
}

export function unverifiedSubmissions(round: AdminRound): AdminSubmission[] {
    return round.submissions
        .filter(submission => submission.submissionValid && !submission.verified)
        .sort((a, b) => a.id - b.id);
}

export function verifiedSubmissions(round: AdminRound): AdminSubmission[] {
    return round.submissions
        .filter(submission => submission.submissionValid && submission.verified)
        .sort((a, b) => a.id - b.id);
}

export function mostRequestedWad(
    submissions: readonly { WADName: string }[],
): { name: string; percentage: number } | null {
    const tallies = new Map<string, WadTally>();

    for (const submission of submissions) {
        const key = submission.WADName.toLowerCase();
        const tally = tallies.get(key);
        tallies.set(key, { name: tally?.name ?? submission.WADName, count: (tally?.count ?? 0) + 1 });
    }

    let top: WadTally | null = null;
    for (const tally of tallies.values()) {
        if (top === null || tally.count > top.count) {
            top = tally;
        }
    }

    if (top === null) {
        return null;
    }

    return { name: top.name, percentage: Math.round((top.count / submissions.length) * 100 * 100) / 100 };
}

export function countMapAuthors(submissions: readonly AdminSubmission[]): number {
    return submissions.filter(submission => submission.author).length;
}

export function duplicateIds(ids: readonly number[]): Set<number> {
    const seen = new Set<number>();
    const duplicates = new Set<number>();

    for (const id of ids) {
        if (seen.has(id)) {
            duplicates.add(id);
        }

        seen.add(id);
    }

    return duplicates;
}
