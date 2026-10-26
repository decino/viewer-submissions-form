import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminRound } from "../types/api";
import { useRoundActions } from "./useRoundActions";

const mocks = vi.hoisted(() => ({
    pause: vi.fn(),
    remove: vi.fn(),
    pausing: false,
    removing: false,
}));

vi.mock("./mutations/round", () => ({
    usePauseRound: () => ({ mutateAsync: mocks.pause, isPending: mocks.pausing }),
    useDeleteRound: () => ({ mutateAsync: mocks.remove, isPending: mocks.removing }),
}));

function makeRound(overrides: Partial<AdminRound> = {}): AdminRound {
    return {
        id: 5,
        created: "2026-10-20T12:00:00.000Z",
        updated: "2026-10-20T12:00:00.000Z",
        active: true,
        name: "Round 5: slaughter season",
        paused: false,
        endDate: null,
        submissions: [],
        ...overrides,
    };
}

function setup(round: AdminRound = makeRound()) {
    return renderHook(() => useRoundActions(round), { wrapper: providerWrapper() });
}

beforeEach(() => {
    mocks.pausing = false;
    mocks.removing = false;
    mocks.pause.mockReset();
    mocks.pause.mockResolvedValue({ success: true });
    mocks.remove.mockReset();
    mocks.remove.mockResolvedValue({ success: true });
});

describe("useRoundActions confirmation", () => {
    it("starts with nothing to confirm and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.confirming).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("remembers which action is waiting to be confirmed", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.setConfirming("delete"));

        // then
        expect(result.current.confirming).toBe("delete");
    });
});

describe("useRoundActions pause", () => {
    it("pauses an active round and closes the confirmation", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setConfirming("pause"));

        // when
        await act(() => result.current.togglePause());

        // then
        expect(mocks.pause).toHaveBeenCalledWith(true);
        expect(result.current.confirming).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("resumes a paused round", async () => {
        // given
        const { result } = setup(makeRound({ paused: true }));

        // when
        await act(() => result.current.togglePause());

        // then
        expect(mocks.pause).toHaveBeenCalledWith(false);
    });

    it("hands back the server's reason and closes the confirmation when pausing fails", async () => {
        // given
        mocks.pause.mockRejectedValue(new Error("No active round to pause"));
        const { result } = setup();
        act(() => result.current.setConfirming("pause"));

        // when
        await act(() => result.current.togglePause());

        // then
        expect(result.current.error).toBe("No active round to pause");
        expect(result.current.confirming).toBeNull();
    });

    it("says the round could not be paused when the failure carries no message", async () => {
        // given
        mocks.pause.mockRejectedValue({});
        const { result } = setup();

        // when
        await act(() => result.current.togglePause());

        // then
        expect(result.current.error).toBe("Could not pause the round.");
    });

    it("says the round could not be resumed when the failure carries no message", async () => {
        // given
        mocks.pause.mockRejectedValue({});
        const { result } = setup(makeRound({ paused: true }));

        // when
        await act(() => result.current.togglePause());

        // then
        expect(result.current.error).toBe("Could not resume the round.");
    });

    it("forgets an earlier failure once the next attempt goes through", async () => {
        // given
        mocks.pause.mockRejectedValueOnce(new Error("No active round to pause"));
        const { result } = setup();
        await act(() => result.current.togglePause());

        // when
        await act(() => result.current.togglePause());

        // then
        expect(result.current.error).toBeNull();
    });

    it("reports pausing while the request is in flight", () => {
        // given
        mocks.pausing = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.pausing).toBe(true);
        expect(result.current.deleting).toBe(false);
    });
});

describe("useRoundActions delete", () => {
    it("deletes the round by its id and closes the confirmation", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setConfirming("delete"));

        // when
        await act(() => result.current.deleteRound());

        // then
        expect(mocks.remove).toHaveBeenCalledWith(5);
        expect(result.current.confirming).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("hands back the server's reason and closes the confirmation when deleting fails", async () => {
        // given
        mocks.remove.mockRejectedValue(new Error("Round 5 could not be deleted"));
        const { result } = setup();
        act(() => result.current.setConfirming("delete"));

        // when
        await act(() => result.current.deleteRound());

        // then
        expect(result.current.error).toBe("Round 5 could not be deleted");
        expect(result.current.confirming).toBeNull();
    });

    it("says the round could not be deleted when the failure carries no message", async () => {
        // given
        mocks.remove.mockRejectedValue({});
        const { result } = setup();

        // when
        await act(() => result.current.deleteRound());

        // then
        expect(result.current.error).toBe("Could not delete the round.");
    });

    it("reports deleting while the request is in flight", () => {
        // given
        mocks.removing = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.deleting).toBe(true);
        expect(result.current.pausing).toBe(false);
    });
});
