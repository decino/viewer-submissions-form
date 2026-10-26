import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient, providerWrapper } from "../../../test-utils/render";
import type { CurrentRound } from "../../../types/api";
import { queryKeys } from "../../queryKeys";
import { useCurrentRoundSync } from "./useCurrentRoundSync";

type Listener = (data?: unknown) => void;

const socket = vi.hoisted(() => {
    const listeners = new Map<string, Listener>();
    const managerListeners = new Map<string, Listener>();

    return {
        listeners,
        managerListeners,
        fake: {
            on: (event: string, listener: Listener) => listeners.set(event, listener),
            off: (event: string) => listeners.delete(event),
            io: {
                on: (event: string, listener: Listener) => managerListeners.set(event, listener),
                off: (event: string) => managerListeners.delete(event),
            },
        },
    };
});

vi.mock("../socket", () => ({ submissionSocket: socket.fake }));

function emit(event: string, data?: unknown): void {
    act(() => {
        socket.listeners.get(event)?.(data);
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

function setup(round: CurrentRound | null) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.round.current(), round);
    const { unmount } = renderHook(() => useCurrentRoundSync(), { wrapper: providerWrapper({ queryClient }) });

    return { queryClient, unmount };
}

function cachedIds(queryClient: ReturnType<typeof createTestQueryClient>): number[] | undefined {
    return queryClient
        .getQueryData<CurrentRound | null>(queryKeys.round.current())
        ?.submissions.map(submission => submission.id);
}

beforeEach(() => {
    socket.listeners.clear();
    socket.managerListeners.clear();
});

describe("useCurrentRoundSync", () => {
    it("adds a newly verified submission to the cached round in the REST shape", () => {
        // given
        const { queryClient } = setup(makeRound([1]));

        // when
        emit("newSubmission", { id: 2, wadName: "Sunlust", wadLevel: "MAP12" });

        // then
        const round = queryClient.getQueryData<CurrentRound | null>(queryKeys.round.current());
        expect(round?.submissions).toContainEqual({ id: 2, WADName: "Sunlust", level: "MAP12" });
        expect(cachedIds(queryClient)).toEqual([1, 2]);
    });

    it("removes deleted submissions from the cached round", () => {
        // given
        const { queryClient } = setup(makeRound([1, 2, 3]));

        // when
        emit("deleteSubmission", [1, 3]);

        // then
        expect(cachedIds(queryClient)).toEqual([2]);
    });

    it("ignores a malformed payload", () => {
        // given
        const { queryClient } = setup(makeRound([1, 2]));

        // when
        emit("newSubmission", { id: "3", wadName: "Sunlust" });
        emit("deleteSubmission", "1");

        // then
        expect(cachedIds(queryClient)).toEqual([1, 2]);
    });

    it("leaves the cache alone when there is no active round", () => {
        // given
        const { queryClient } = setup(null);

        // when
        emit("newSubmission", { id: 2, wadName: "Sunlust", wadLevel: "MAP12" });

        // then
        expect(queryClient.getQueryData(queryKeys.round.current())).toBeNull();
    });

    it("refetches the round after a reconnect, because events were missed while offline", () => {
        // given
        const { queryClient } = setup(makeRound([1]));
        vi.spyOn(queryClient, "invalidateQueries");

        // when
        act(() => {
            socket.managerListeners.get("reconnect")?.();
        });

        // then
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.round.current() });
    });

    it("stops listening once it unmounts", () => {
        // given
        const { unmount } = setup(makeRound([1]));

        // when
        unmount();

        // then
        expect([...socket.listeners.keys(), ...socket.managerListeners.keys()]).toEqual([]);
    });
});
