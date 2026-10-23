import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import { useCreateRoundForm } from "./useCreateRoundForm";

const mocks = vi.hoisted(() => ({
    createRound: vi.fn(),
    creating: false,
}));

vi.mock("./mutations/round", () => ({
    useCreateRound: () => ({ mutateAsync: mocks.createRound, isPending: mocks.creating }),
}));

function setup(onCreated = vi.fn()) {
    return renderHook(() => useCreateRoundForm(onCreated), { wrapper: providerWrapper() });
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function sentRound(): unknown {
    return mocks.createRound.mock.calls[0][0];
}

beforeEach(() => {
    mocks.creating = false;
    mocks.createRound.mockReset();
    mocks.createRound.mockResolvedValue({ id: 43 });
});

describe("useCreateRoundForm", () => {
    it("starts with an empty name and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.name).toBe("");
        expect(result.current.error).toBeNull();
        expect(result.current.creating).toBe(false);
    });

    it("keeps the name as it is typed", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.setName("Round 43"));

        // then
        expect(result.current.name).toBe("Round 43");
    });

    it("creates the round with its trimmed name and the picked deadline, then reports it created", async () => {
        // given
        const onCreated = vi.fn();
        const { result } = setup(onCreated);
        const event = submitEvent();
        act(() => result.current.setName("  Round 43 "));
        act(() => result.current.pickEndDate(Date.UTC(2026, 11, 25)));

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalled();
        expect(sentRound()).toEqual({ name: "Round 43", endDate: Date.UTC(2026, 11, 25) });
        expect(onCreated).toHaveBeenCalledOnce();
    });

    it("creates the round without a deadline when none is picked", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setName("Round 43"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(sentRound()).toEqual({ name: "Round 43", endDate: undefined });
    });

    it("drops the deadline again once the date is cleared", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setName("Round 43"));
        act(() => result.current.pickEndDate(Date.UTC(2026, 11, 25)));
        act(() => result.current.pickEndDate(Number.NaN));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(sentRound()).toEqual({ name: "Round 43", endDate: undefined });
    });

    it("refuses a round without a name", async () => {
        // given
        const onCreated = vi.fn();
        const { result } = setup(onCreated);
        act(() => result.current.setName("   "));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Give the round a name");
        expect(mocks.createRound).not.toHaveBeenCalled();
        expect(onCreated).not.toHaveBeenCalled();
    });

    it("hands back the server's reason and stays open when the round is refused", async () => {
        // given
        mocks.createRound.mockRejectedValue(new Error("The deadline can't be in the past"));
        const onCreated = vi.fn();
        const { result } = setup(onCreated);
        act(() => result.current.setName("Round 43"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("The deadline can't be in the past");
        expect(onCreated).not.toHaveBeenCalled();
    });

    it("says the round could not be created when the failure carries no message", async () => {
        // given
        mocks.createRound.mockRejectedValue({});
        const { result } = setup();
        act(() => result.current.setName("Round 43"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Could not create the round.");
    });

    it("forgets the missing name message once a named round is sent", async () => {
        // given
        const { result } = setup();
        await act(() => result.current.submit(submitEvent()));
        act(() => result.current.setName("Round 43"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBeNull();
    });

    it("reports creating while the request is in flight", () => {
        // given
        mocks.creating = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.creating).toBe(true);
    });
});
