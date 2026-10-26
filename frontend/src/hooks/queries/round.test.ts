import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentRound, getPreviousRounds } from "../../api/endpoints/round";
import { queryKeys } from "../../api/queryKeys";
import { expectInvalidated } from "../../test-utils/query";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { CurrentRound, PreviousRound } from "../../types/api";
import { useCurrentRound, usePreviousRounds, useRefetchRoundAfterDeadline } from "./round";

vi.mock("../../api/endpoints/round", () => ({
    getCurrentRound: vi.fn(),
    getPreviousRounds: vi.fn(),
}));

const mockedGetCurrentRound = vi.mocked(getCurrentRound);
const mockedGetPreviousRounds = vi.mocked(getPreviousRounds);

function makeRound(): CurrentRound {
    return {
        id: 4,
        name: "Round 4",
        paused: false,
        created: "2026-10-01T12:00:00.000Z",
        endDate: null,
        submissions: [],
    };
}

function makePreviousRound(): PreviousRound {
    return {
        id: 3,
        created: "2026-09-01T12:00:00.000Z",
        updated: "2026-09-30T12:00:00.000Z",
        active: false,
        name: "Round 3",
        paused: false,
        endDate: null,
        submissions: [
            {
                id: 11,
                created: "2026-09-02T18:30:00.000Z",
                updated: "2026-09-29T20:00:00.000Z",
                WADName: "Sunlust",
                level: "MAP12",
                authorName: null,
                submissionRoundId: 3,
                playOrder: 1,
                youtubeLink: null,
                status: { status: "Completed", additionalInfo: null, submissionId: 11 },
                chosen: true,
                recordedFormat: "Blind",
                downloadUrl: null,
            },
        ],
    };
}

beforeEach(() => {
    mockedGetCurrentRound.mockResolvedValue(makeRound());
    mockedGetPreviousRounds.mockResolvedValue([makePreviousRound()]);
});

describe("useCurrentRound", () => {
    it("keys the query as the current round", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useCurrentRound(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["round", "current"]);
    });

    it("hands back the active round once it has loaded", async () => {
        // when
        const { result } = renderHook(() => useCurrentRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.round).toEqual(makeRound());
    });

    it("orders the submissions by id, because the server sends them unordered", async () => {
        // given
        const unordered: CurrentRound = {
            ...makeRound(),
            submissions: [
                { id: 9, WADName: "Sunlust", level: "MAP12" },
                { id: 2, WADName: "Alien Vendetta", level: "MAP20" },
            ],
        };
        mockedGetCurrentRound.mockResolvedValue(unordered);

        // when
        const { result } = renderHook(() => useCurrentRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.round?.submissions.map(submission => submission.id)).toEqual([2, 9]);
    });

    it("reports no round when the server says none is active", async () => {
        // given
        mockedGetCurrentRound.mockResolvedValue(null);

        // when
        const { result } = renderHook(() => useCurrentRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.round).toBeNull();
    });

    it("reports loading and no round while the request is in flight", () => {
        // given
        mockedGetCurrentRound.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useCurrentRound(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ round: null, loading: true, error: null });
    });

    it("hands back the reason the round could not be loaded", async () => {
        // given
        mockedGetCurrentRound.mockRejectedValue(new Error("The server is down for maintenance."));

        // when
        const { result } = renderHook(() => useCurrentRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({ round: null, loading: false, error: "The server is down for maintenance." });
    });
});

describe("usePreviousRounds", () => {
    it("keys the query as the previous rounds", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => usePreviousRounds(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["round", "previous"]);
    });

    it("hands back the finished rounds as the server sent them", async () => {
        // when
        const { result } = renderHook(() => usePreviousRounds(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.rounds).toEqual([makePreviousRound()]);
    });

    it("hands back an empty list when no round has finished yet", async () => {
        // given
        mockedGetPreviousRounds.mockResolvedValue([]);

        // when
        const { result } = renderHook(() => usePreviousRounds(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.rounds).toEqual([]);
    });

    it("reports loading and an empty list while the request is in flight", () => {
        // given
        mockedGetPreviousRounds.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => usePreviousRounds(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ rounds: [], loading: true, error: null });
    });

    it("hands back the reason the previous rounds could not be loaded", async () => {
        // given
        mockedGetPreviousRounds.mockRejectedValue(new Error("The server is down for maintenance."));

        // when
        const { result } = renderHook(() => usePreviousRounds(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({ rounds: [], loading: false, error: "The server is down for maintenance." });
    });
});

describe("useRefetchRoundAfterDeadline", () => {
    const endDate = "2026-10-27T23:59:59.000Z";
    const deadline = Date.parse(endDate);

    function setup(now: number) {
        const queryClient = createTestQueryClient();
        vi.spyOn(queryClient, "invalidateQueries");
        const view = renderHook(({ at }) => useRefetchRoundAfterDeadline(endDate, at), {
            wrapper: providerWrapper({ queryClient }),
            initialProps: { at: now },
        });

        return { queryClient, ...view };
    }

    it("refetches the round a second after the deadline passes, once the backend has paused it", () => {
        // given
        const { queryClient, rerender } = setup(deadline - 5_000);

        // when
        rerender({ at: deadline + 999 });
        const beforeGrace = vi.mocked(queryClient.invalidateQueries).mock.calls.length;
        rerender({ at: deadline + 1_000 });

        // then
        expect(beforeGrace).toBe(0);
        expectInvalidated(queryClient, queryKeys.round.all);
    });

    it("refetches only once while the clock keeps ticking", () => {
        // given
        const { queryClient, rerender } = setup(deadline - 5_000);

        // when
        rerender({ at: deadline + 1_000 });
        rerender({ at: deadline + 2_000 });
        rerender({ at: deadline + 3_000 });

        // then
        const roundRefetches = vi
            .mocked(queryClient.invalidateQueries)
            .mock.calls.filter(([filters]) => filters?.queryKey === queryKeys.round.all);
        expect(roundRefetches).toHaveLength(1);
    });

    it("does not refetch a page opened after the deadline, which already has the paused round", () => {
        // given
        const { queryClient, rerender } = setup(deadline + 60_000);

        // when
        rerender({ at: deadline + 61_000 });

        // then
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
});
