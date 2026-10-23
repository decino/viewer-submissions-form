import { describe, expect, it } from "vitest";
import type { AdminRound, AdminSubmission } from "../../types/api";
import {
    adminDownloadUrl,
    confirmedSubmissions,
    countMapAuthors,
    duplicateIds,
    mostRequestedWad,
    unverifiedSubmissions,
    verifiedSubmissions,
} from "./admin";

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 1,
        created: "2026-10-01T12:00:00.000Z",
        updated: "2026-10-01T12:00:00.000Z",
        WADName: "Sunlust",
        level: "MAP01",
        authorName: null,
        submissionRoundId: 7,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: null,
        WAD: null,
        engine: 0,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: null,
        email: "player@example.com",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function makeRound(submissions: AdminSubmission[]): AdminRound {
    return {
        id: 7,
        created: "2026-10-01T12:00:00.000Z",
        updated: "2026-10-01T12:00:00.000Z",
        active: true,
        name: "Round 7",
        paused: false,
        endDate: null,
        submissions,
    };
}

describe("adminDownloadUrl", () => {
    it("points an uploaded WAD at the download endpoint for its round", () => {
        // given
        const submission = makeSubmission({ id: 3, submissionRoundId: 7, customWad: "sunlust.wad" });

        // then
        expect(adminDownloadUrl(submission)).toBe("/rest/submission/download/7/3");
    });

    it("prefers the uploaded WAD over a link", () => {
        // given
        const submission = makeSubmission({ id: 3, customWad: "sunlust.wad", WAD: "https://example.com/sunlust.zip" });

        // then
        expect(adminDownloadUrl(submission)).toBe("/rest/submission/download/7/3");
    });

    it("uses the submitted link when nothing was uploaded", () => {
        // given
        const submission = makeSubmission({ WAD: "https://example.com/sunlust.zip" });

        // then
        expect(adminDownloadUrl(submission)).toBe("https://example.com/sunlust.zip");
    });

    it("has no download when there is neither an upload nor a link", () => {
        // then
        expect(adminDownloadUrl(makeSubmission())).toBeNull();
    });
});

describe("confirmedSubmissions", () => {
    it("keeps only the submissions confirmed by email", () => {
        // given
        const round = makeRound([
            makeSubmission({ id: 1, verified: false }),
            makeSubmission({ id: 2, submissionValid: false, verified: false }),
            makeSubmission({ id: 3 }),
        ]);

        // when
        const confirmed = confirmedSubmissions(round);

        // then
        expect(confirmed.map(submission => submission.id)).toEqual([1, 3]);
    });
});

describe("unverifiedSubmissions", () => {
    it("lists confirmed submissions still waiting for verification, by id", () => {
        // given
        const round = makeRound([
            makeSubmission({ id: 4, verified: false }),
            makeSubmission({ id: 2, verified: false }),
            makeSubmission({ id: 3, submissionValid: false, verified: false }),
            makeSubmission({ id: 1 }),
        ]);

        // when
        const unverified = unverifiedSubmissions(round);

        // then
        expect(unverified.map(submission => submission.id)).toEqual([2, 4]);
    });
});

describe("verifiedSubmissions", () => {
    it("lists confirmed and verified submissions, by id", () => {
        // given
        const round = makeRound([
            makeSubmission({ id: 5 }),
            makeSubmission({ id: 2 }),
            makeSubmission({ id: 3, verified: false }),
            makeSubmission({ id: 4, submissionValid: false }),
        ]);

        // when
        const verified = verifiedSubmissions(round);

        // then
        expect(verified.map(submission => submission.id)).toEqual([2, 5]);
    });

    it("does not reorder the round it was handed", () => {
        // given
        const round = makeRound([makeSubmission({ id: 2 }), makeSubmission({ id: 1 })]);

        // when
        verifiedSubmissions(round);

        // then
        expect(round.submissions.map(submission => submission.id)).toEqual([2, 1]);
    });
});

describe("mostRequestedWad", () => {
    it("has no most requested WAD when there are no submissions", () => {
        // then
        expect(mostRequestedWad([])).toBeNull();
    });

    it("counts WAD names regardless of case and keeps the first spelling", () => {
        // given
        const submissions = [{ WADName: "Sunlust" }, { WADName: "Eviternity" }, { WADName: "SUNLUST" }];

        // when
        const result = mostRequestedWad(submissions);

        // then
        expect(result).toEqual({ name: "Sunlust", percentage: 66.67 });
    });

    it("gives the share as a percentage rounded to two decimals", () => {
        // given
        const submissions = [
            { WADName: "Sunlust" },
            { WADName: "Eviternity" },
            { WADName: "Scythe" },
            { WADName: "Valiant" },
            { WADName: "Ancient Aliens" },
            { WADName: "Sunlust" },
        ];

        // when
        const result = mostRequestedWad(submissions);

        // then
        expect(result).toEqual({ name: "Sunlust", percentage: 33.33 });
    });

    it("picks the WAD that was requested first when two are tied", () => {
        // given
        const submissions = [
            { WADName: "Scythe" },
            { WADName: "Valiant" },
            { WADName: "Valiant" },
            { WADName: "Scythe" },
        ];

        // when
        const result = mostRequestedWad(submissions);

        // then
        expect(result).toEqual({ name: "Scythe", percentage: 50 });
    });
});

describe("countMapAuthors", () => {
    it("counts the submissions whose submitter made the map", () => {
        // given
        const submissions = [
            makeSubmission({ id: 1, author: true }),
            makeSubmission({ id: 2 }),
            makeSubmission({ id: 3, author: true }),
        ];

        // then
        expect(countMapAuthors(submissions)).toBe(2);
    });
});

describe("duplicateIds", () => {
    it("returns every id that appears more than once", () => {
        // then
        expect(duplicateIds([1, 2, 1, 3, 2, 1])).toEqual(new Set([1, 2]));
    });

    it("returns an empty set when every id is unique", () => {
        // then
        expect(duplicateIds([1, 2, 3]).size).toBe(0);
    });
});
