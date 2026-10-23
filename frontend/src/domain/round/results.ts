const UNPLAYED = Number.MAX_SAFE_INTEGER;

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
