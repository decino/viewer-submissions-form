import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient, providerWrapper } from "../../../test-utils/render";
import type { CurrentRound } from "../../../types/api";
import { queryKeys } from "../../queryKeys";
import { dispatch } from "../bus";
import type { RealtimeEvent } from "../events";
import { useCurrentRoundSync } from "./useCurrentRoundSync";

const epoch = vi.hoisted(() => ({ value: 0 }));

vi.mock("../useRealtime", async importOriginal => {
    const actual = await importOriginal<typeof import("../useRealtime")>();
    return {
        ...actual,
        useRealtimeStatus: () => epoch.value,
    };
});

function emit(event: RealtimeEvent): void {
    act(() => {
        dispatch(event);
    });
}

function makeRound(ids: number[]): CurrentRound {
    return {
        id: 3,
        name: "Round 3",
        paused: false,
        created: "2026-10-01T12:00:00.000Z",
        endDate: null,
        submissions: ids.map(id => ({ id, WADName: `wad ${id}`, level: "MAP01" })),
    };
}

function cachedIds(queryClient: ReturnType<typeof createTestQueryClient>): number[] | undefined {
    return queryClient
        .getQueryData<CurrentRound | null>(queryKeys.round.current())
        ?.submissions.map(submission => submission.id);
}

describe("useCurrentRoundSync", () => {
    it("adds a newly verified submission to the cached round in the REST shape", () => {
        // given
        epoch.value = 1;
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(queryKeys.round.current(), makeRound([1]));
        renderHook(() => useCurrentRoundSync(), { wrapper: providerWrapper({ queryClient }) });

        // when
        emit({ type: "newSubmission", data: { id: 2, wadName: "Sunlust", wadLevel: "MAP12" } });

        // then
        const round = queryClient.getQueryData<CurrentRound | null>(queryKeys.round.current());
        expect(round?.submissions).toContainEqual({ id: 2, WADName: "Sunlust", level: "MAP12" });
        expect(cachedIds(queryClient)).toEqual([1, 2]);
    });

    it("removes deleted submissions from the cached round", () => {
        // given
        epoch.value = 1;
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(queryKeys.round.current(), makeRound([1, 2, 3]));
        renderHook(() => useCurrentRoundSync(), { wrapper: providerWrapper({ queryClient }) });

        // when
        emit({ type: "deleteSubmission", data: [1, 3] });

        // then
        expect(cachedIds(queryClient)).toEqual([2]);
    });

    it("leaves the cache alone when there is no active round", () => {
        // given
        epoch.value = 1;
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(queryKeys.round.current(), null);
        renderHook(() => useCurrentRoundSync(), { wrapper: providerWrapper({ queryClient }) });

        // when
        emit({ type: "newSubmission", data: { id: 2, wadName: "Sunlust", wadLevel: "MAP12" } });

        // then
        expect(queryClient.getQueryData(queryKeys.round.current())).toBeNull();
    });

    it("does not refetch on the first connection", () => {
        // given
        epoch.value = 1;
        const queryClient = createTestQueryClient();
        vi.spyOn(queryClient, "invalidateQueries");

        // when
        renderHook(() => useCurrentRoundSync(), { wrapper: providerWrapper({ queryClient }) });

        // then
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    it("refetches the round after a reconnect, because events were missed while offline", () => {
        // given
        epoch.value = 2;
        const queryClient = createTestQueryClient();
        vi.spyOn(queryClient, "invalidateQueries");

        // when
        renderHook(() => useCurrentRoundSync(), { wrapper: providerWrapper({ queryClient }) });

        // then
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.round.current() });
    });
});
