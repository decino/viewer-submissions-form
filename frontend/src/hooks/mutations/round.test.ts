import type { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addRandomEntry, buildResultSet, generateEntries, submitEntries } from "../../api/endpoints/roundResult";
import { createRound, deleteRound, pauseRound } from "../../api/endpoints/submissionRound";
import { expectInvalidated } from "../../test-utils/query";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { AdminRound, AdminSubmission, SuccessResponse } from "../../types/api";
import {
    useAddRandomEntry,
    useBuildResultSet,
    useCreateRound,
    useDeleteRound,
    useGenerateEntries,
    usePauseRound,
    useSubmitEntries,
} from "./round";

vi.mock("../../api/endpoints/submissionRound", () => ({
    createRound: vi.fn(),
    deleteRound: vi.fn(),
    pauseRound: vi.fn(),
}));

vi.mock("../../api/endpoints/roundResult", () => ({
    addRandomEntry: vi.fn(),
    buildResultSet: vi.fn(),
    generateEntries: vi.fn(),
    submitEntries: vi.fn(),
}));

const mockedCreateRound = vi.mocked(createRound);
const mockedDeleteRound = vi.mocked(deleteRound);
const mockedPauseRound = vi.mocked(pauseRound);
const mockedAddRandomEntry = vi.mocked(addRandomEntry);
const mockedBuildResultSet = vi.mocked(buildResultSet);
const mockedGenerateEntries = vi.mocked(generateEntries);
const mockedSubmitEntries = vi.mocked(submitEntries);

const ok: SuccessResponse = { success: true, description: "Done" };

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: "doomguy",
        submissionRoundId: 5,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: "dsda-doom",
        WAD: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        engine: 11,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: null,
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function makeRound(): AdminRound {
    return {
        id: 5,
        created: "2026-10-20T12:00:00.000Z",
        updated: "2026-10-20T12:00:00.000Z",
        active: true,
        name: "Round 5",
        paused: false,
        endDate: null,
        submissions: [],
    };
}

function setup<T>(hook: () => T) {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(hook, { wrapper: providerWrapper({ queryClient }) });

    return { result, queryClient, invalidate };
}

function expectRoundViewsInvalidated(queryClient: QueryClient): void {
    expectInvalidated(queryClient, ["round"]);
    expectInvalidated(queryClient, ["stats"]);
    expectInvalidated(queryClient, ["admin"]);
}

beforeEach(() => {
    mockedCreateRound.mockResolvedValue(makeRound());
    mockedDeleteRound.mockResolvedValue(ok);
    mockedPauseRound.mockResolvedValue(ok);
    mockedAddRandomEntry.mockResolvedValue(makeSubmission({ id: 12, chosen: true }));
    mockedBuildResultSet.mockResolvedValue(ok);
    mockedGenerateEntries.mockResolvedValue([makeSubmission({ id: 8 }), makeSubmission({ id: 9 })]);
    mockedSubmitEntries.mockResolvedValue(ok);
});

describe("useCreateRound", () => {
    it("creates the round with its name and deadline and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useCreateRound);

        // when
        await act(async () => {
            await result.current.mutateAsync({ name: "Round 5", endDate: 1798675200000 });
        });

        // then
        expect(mockedCreateRound.mock.lastCall?.[0]).toEqual({ name: "Round 5", endDate: 1798675200000 });
        expectRoundViewsInvalidated(queryClient);
    });

    it("leaves the cache alone when the server refuses the round", async () => {
        // given
        mockedCreateRound.mockRejectedValue(new Error("The deadline cannot be in the past"));
        const { result, invalidate } = setup(useCreateRound);

        // when
        await act(async () => {
            await expect(result.current.mutateAsync({ name: "Round 5", endDate: 0 })).rejects.toThrow(
                "The deadline cannot be in the past",
            );
        });

        // then
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("usePauseRound", () => {
    it("pauses the round and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(usePauseRound);

        // when
        await act(async () => {
            await result.current.mutateAsync(true);
        });

        // then
        expect(mockedPauseRound.mock.lastCall?.[0]).toBe(true);
        expectRoundViewsInvalidated(queryClient);
    });

    it("resumes the round with an explicit false", async () => {
        // given
        const { result } = setup(usePauseRound);

        // when
        await act(async () => {
            await result.current.mutateAsync(false);
        });

        // then
        expect(mockedPauseRound.mock.lastCall?.[0]).toBe(false);
    });
});

describe("useDeleteRound", () => {
    it("deletes the round it is given and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useDeleteRound);

        // when
        await act(async () => {
            await result.current.mutateAsync(9);
        });

        // then
        expect(mockedDeleteRound.mock.lastCall?.[0]).toBe(9);
        expectRoundViewsInvalidated(queryClient);
    });

    it("leaves the cache alone when the delete fails", async () => {
        // given
        mockedDeleteRound.mockRejectedValue(new Error("Round not found"));
        const { result, invalidate } = setup(useDeleteRound);

        // when
        await act(async () => {
            await expect(result.current.mutateAsync(9)).rejects.toThrow("Round not found");
        });

        // then
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("useBuildResultSet", () => {
    it("builds the result set without refreshing anything, because the wizard carries on from it", async () => {
        // given
        const { result, invalidate } = setup(useBuildResultSet);

        // when
        await act(async () => {
            await result.current.mutateAsync();
        });

        // then
        expect(mockedBuildResultSet).toHaveBeenCalledOnce();
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("useGenerateEntries", () => {
    it("asks for the number of entries it is given and hands them back without refreshing anything", async () => {
        // given
        const { result, invalidate } = setup(useGenerateEntries);

        // when
        let entries: unknown;
        await act(async () => {
            entries = await result.current.mutateAsync(2);
        });

        // then
        expect(mockedGenerateEntries.mock.lastCall?.[0]).toBe(2);
        expect(entries).toEqual([makeSubmission({ id: 8 }), makeSubmission({ id: 9 })]);
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("useSubmitEntries", () => {
    it("submits the chosen ids in play order and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useSubmitEntries);

        // when
        await act(async () => {
            await result.current.mutateAsync([4, 2, 7]);
        });

        // then
        expect(mockedSubmitEntries.mock.lastCall?.[0]).toEqual([4, 2, 7]);
        expectRoundViewsInvalidated(queryClient);
    });
});

describe("useAddRandomEntry", () => {
    it("adds a random entry to the round it is given and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useAddRandomEntry);

        // when
        let entry: unknown;
        await act(async () => {
            entry = await result.current.mutateAsync(5);
        });

        // then
        expect(mockedAddRandomEntry.mock.lastCall?.[0]).toBe(5);
        expect(entry).toEqual(makeSubmission({ id: 12, chosen: true }));
        expectRoundViewsInvalidated(queryClient);
    });
});
