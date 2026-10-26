import { describe, expect, it } from "vitest";
import type { CurrentRound, RoundSubmission } from "../../types/api";
import { addSubmission, removeSubmissions, sortSubmissions } from "./submissions";

function makeSubmission(id: number): RoundSubmission {
    return { id, WADName: `wad ${id}`, level: `MAP${String(id).padStart(2, "0")}` };
}

function makeRound(ids: number[]): CurrentRound {
    return {
        id: 7,
        name: "Round 7",
        paused: false,
        created: "2026-10-01T12:00:00.000Z",
        endDate: null,
        submissions: ids.map(makeSubmission),
    };
}

describe("sortSubmissions", () => {
    it("orders the submissions by id, the order they were submitted in", () => {
        // given
        const round = makeRound([5, 1, 3]);

        // when
        const sorted = sortSubmissions(round);

        // then
        expect(sorted.submissions.map(submission => submission.id)).toEqual([1, 3, 5]);
    });

    it("does not mutate the round it was handed", () => {
        // given
        const round = makeRound([2, 1]);

        // when
        sortSubmissions(round);

        // then
        expect(round.submissions.map(submission => submission.id)).toEqual([2, 1]);
    });
});

describe("addSubmission", () => {
    it("adds a newly verified submission to the end of the list", () => {
        // given
        const round = makeRound([1, 2]);

        // when
        const next = addSubmission(round, makeSubmission(3));

        // then
        expect(next.submissions.map(submission => submission.id)).toEqual([1, 2, 3]);
    });

    it("returns the same round when the submission is already listed", () => {
        // given
        const round = makeRound([1, 2]);

        // when
        const next = addSubmission(round, makeSubmission(2));

        // then
        expect(next).toBe(round);
    });

    it("does not mutate the round it was handed", () => {
        // given
        const round = makeRound([1]);

        // when
        addSubmission(round, makeSubmission(2));

        // then
        expect(round.submissions.map(submission => submission.id)).toEqual([1]);
    });
});

describe("removeSubmissions", () => {
    it("drops every deleted id and keeps the rest in order", () => {
        // given
        const round = makeRound([1, 2, 3, 4]);

        // when
        const next = removeSubmissions(round, [2, 4]);

        // then
        expect(next.submissions.map(submission => submission.id)).toEqual([1, 3]);
    });

    it("returns the same round when none of the ids are listed", () => {
        // given
        const round = makeRound([1, 2]);

        // when
        const next = removeSubmissions(round, [9]);

        // then
        expect(next).toBe(round);
    });
});
