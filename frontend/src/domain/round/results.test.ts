import { describe, expect, it } from "vitest";
import { chosenInPlayOrder, isBeingPlayed, notChosen, roundsOldestFirst, splitLatestRound } from "./results";

interface TestSubmission {
    id: number;
    chosen: boolean;
    playOrder: number | null;
}

function chosen(id: number, playOrder: number | null): TestSubmission {
    return { id, chosen: true, playOrder };
}

function passedOver(id: number): TestSubmission {
    return { id, chosen: false, playOrder: null };
}

describe("chosenInPlayOrder", () => {
    it("keeps the chosen submissions in the order they were played", () => {
        // given
        const submissions = [chosen(1, 3), passedOver(2), chosen(3, 1), chosen(4, 2)];

        // when
        const results = chosenInPlayOrder(submissions);

        // then
        expect(results.map(submission => submission.id)).toEqual([3, 4, 1]);
    });

    it("puts chosen submissions without a play order last, by id", () => {
        // given
        const submissions = [chosen(5, null), chosen(2, null), chosen(9, 1)];

        // when
        const results = chosenInPlayOrder(submissions);

        // then
        expect(results.map(submission => submission.id)).toEqual([9, 2, 5]);
    });

    it("does not reorder the list it was handed", () => {
        // given
        const submissions = [chosen(1, 2), chosen(2, 1)];

        // when
        chosenInPlayOrder(submissions);

        // then
        expect(submissions.map(submission => submission.id)).toEqual([1, 2]);
    });
});

describe("notChosen", () => {
    it("lists the submissions that were not picked, by id", () => {
        // given
        const submissions = [passedOver(4), chosen(1, 1), passedOver(2), passedOver(3)];

        // when
        const rest = notChosen(submissions);

        // then
        expect(rest.map(submission => submission.id)).toEqual([2, 3, 4]);
    });
});

describe("roundsOldestFirst", () => {
    it("orders the rounds by id, oldest first", () => {
        // given
        const rounds = [{ id: 3 }, { id: 1 }, { id: 2 }];

        // when
        const ordered = roundsOldestFirst(rounds);

        // then
        expect(ordered.map(round => round.id)).toEqual([1, 2, 3]);
    });

    it("does not reorder the list it was handed", () => {
        // given
        const rounds = [{ id: 2 }, { id: 1 }];

        // when
        roundsOldestFirst(rounds);

        // then
        expect(rounds.map(round => round.id)).toEqual([2, 1]);
    });
});

describe("splitLatestRound", () => {
    it("takes the newest round apart from the older ones", () => {
        // when
        const { latest, older } = splitLatestRound([{ id: 2 }, { id: 3 }, { id: 1 }]);

        // then
        expect(latest).toEqual({ id: 3 });
        expect(older.map(round => round.id)).toEqual([1, 2]);
    });

    it("has no latest round when none has finished", () => {
        // then
        expect(splitLatestRound([])).toEqual({ latest: null, older: [] });
    });
});

describe("isBeingPlayed", () => {
    it("says a round is being played while a picked entry is queued or in progress", () => {
        // then
        expect(
            isBeingPlayed([{ chosen: true, status: { status: "Queued", additionalInfo: null, submissionId: 1 } }]),
        ).toBe(true);
        expect(
            isBeingPlayed([{ chosen: true, status: { status: "In Progress", additionalInfo: null, submissionId: 1 } }]),
        ).toBe(true);
    });

    it("says a round is played once every picked entry is completed or rejected", () => {
        // then
        expect(
            isBeingPlayed([
                { chosen: true, status: { status: "Completed", additionalInfo: null, submissionId: 1 } },
                { chosen: true, status: { status: "Rejected", additionalInfo: null, submissionId: 2 } },
                { chosen: false, status: { status: "Queued", additionalInfo: null, submissionId: 3 } },
                { chosen: true, status: null },
            ]),
        ).toBe(false);
    });
});
