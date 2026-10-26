import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminRound, AdminSubmission } from "../types/api";
import { usePreviousRoundActions } from "./usePreviousRoundActions";

const mocks = vi.hoisted(() => ({
    removeEntries: vi.fn<(ids: number[]) => Promise<unknown>>(),
    addRandomEntry: vi.fn<(roundId: number) => Promise<unknown>>(),
    deleteRound: vi.fn<(roundId: number) => Promise<unknown>>(),
    removingEntries: false,
    addingRandom: false,
    deletingRound: false,
}));

vi.mock("./mutations/submission", () => ({
    useDeleteEntries: () => ({ mutateAsync: mocks.removeEntries, isPending: mocks.removingEntries }),
}));

vi.mock("./mutations/round", () => ({
    useAddRandomEntry: () => ({ mutateAsync: mocks.addRandomEntry, isPending: mocks.addingRandom }),
    useDeleteRound: () => ({ mutateAsync: mocks.deleteRound, isPending: mocks.deletingRound }),
}));

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-09-02T18:30:00.000Z",
        updated: "2026-09-29T20:00:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: null,
        submissionRoundId: 3,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: null,
        WAD: null,
        engine: 11,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: "sunlust.zip",
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function makeRound(): AdminRound {
    return {
        id: 3,
        created: "2026-09-01T12:00:00.000Z",
        updated: "2026-09-30T12:00:00.000Z",
        active: false,
        name: "Round 3",
        paused: false,
        endDate: null,
        submissions: [
            makeSubmission({ id: 11, WADName: "Scythe", chosen: true, playOrder: 2 }),
            makeSubmission({ id: 14, WADName: "Plutonia 2", chosen: false }),
            makeSubmission({ id: 12, WADName: "Sunlust", chosen: true, playOrder: 1 }),
            makeSubmission({ id: 13, WADName: "Alien Vendetta", chosen: false }),
        ],
    };
}

function setup() {
    return renderHook(() => usePreviousRoundActions(makeRound()), { wrapper: providerWrapper() });
}

function wadNames(rows: readonly AdminSubmission[]): string[] {
    return rows.map(row => row.WADName);
}

beforeEach(() => {
    mocks.removeEntries.mockReset();
    mocks.removeEntries.mockResolvedValue({ success: true, description: "Entries deleted" });
    mocks.addRandomEntry.mockReset();
    mocks.addRandomEntry.mockResolvedValue(makeSubmission({ id: 15 }));
    mocks.deleteRound.mockReset();
    mocks.deleteRound.mockResolvedValue({ success: true, description: "Round deleted" });
    mocks.removingEntries = false;
    mocks.addingRandom = false;
    mocks.deletingRound = false;
});

describe("usePreviousRoundActions results", () => {
    it("lists the picked entries in play order", () => {
        // when
        const { result } = setup();

        // then
        expect(wadNames(result.current.results)).toEqual(["Sunlust", "Scythe"]);
    });

    it("lists the entries that were not picked, oldest first", () => {
        // when
        const { result } = setup();

        // then
        expect(wadNames(result.current.others)).toEqual(["Alien Vendetta", "Plutonia 2"]);
    });

    it("starts with nothing selected, nothing pending and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.selected).toBeNull();
        expect(result.current.pending).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.dialog).toBeNull();
    });

    it("knows which picked entry is selected", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.select(new Set([11])));

        // then
        expect(result.current.selected?.WADName).toBe("Scythe");
        expect(result.current.selectedKeys).toEqual(new Set([11]));
    });
});

describe("usePreviousRoundActions confirmation", () => {
    it("asks nothing about deleting an entry while none is selected", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.ask("delete-entry"));

        // then
        expect(result.current.pending).toBeNull();
    });

    it("deletes the selected entry once confirmed and clears the selection", async () => {
        // given
        const { result } = setup();
        act(() => result.current.select(new Set([12])));
        act(() => result.current.ask("delete-entry"));
        expect(result.current.pending).toBe("delete-entry");

        // when
        await act(() => result.current.confirm());

        // then
        expect(mocks.removeEntries).toHaveBeenCalledWith([12]);
        expect(result.current.selected).toBeNull();
        expect(result.current.pending).toBeNull();
    });

    it("adds a random entry to the round once confirmed", async () => {
        // given
        const { result } = setup();
        act(() => result.current.ask("add-random"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(mocks.addRandomEntry).toHaveBeenCalledWith(3);
        expect(mocks.deleteRound).not.toHaveBeenCalled();
    });

    it("deletes the round once confirmed", async () => {
        // given
        const { result } = setup();
        act(() => result.current.ask("delete-round"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(mocks.deleteRound).toHaveBeenCalledWith(3);
        expect(mocks.addRandomEntry).not.toHaveBeenCalled();
    });

    it("sends nothing when the confirmation is cancelled", () => {
        // given
        const { result } = setup();
        act(() => result.current.ask("delete-round"));

        // when
        act(() => result.current.cancel());

        // then
        expect(result.current.pending).toBeNull();
        expect(mocks.deleteRound).not.toHaveBeenCalled();
    });

    it("reports the server's message when an action fails", async () => {
        // given
        mocks.addRandomEntry.mockRejectedValue(new Error("Round 3 does not exist."));
        const { result } = setup();
        act(() => result.current.ask("add-random"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.error).toBe("Round 3 does not exist.");
        expect(result.current.pending).toBeNull();
    });

    it("keeps the selection when deleting the entry fails", async () => {
        // given
        mocks.removeEntries.mockRejectedValue(new Error("Unable to find submission 12."));
        const { result } = setup();
        act(() => result.current.select(new Set([12])));
        act(() => result.current.ask("delete-entry"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.error).toBe("Unable to find submission 12.");
        expect(result.current.selected?.WADName).toBe("Sunlust");
    });

    it("says what failed when the failure carries no message", async () => {
        // given
        mocks.deleteRound.mockRejectedValue(new Error(""));
        const { result } = setup();
        act(() => result.current.ask("delete-round"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.error).toBe("The round could not be deleted.");
    });

    it("clears an earlier error when it tries again", async () => {
        // given
        mocks.addRandomEntry.mockRejectedValueOnce(new Error("Round 3 does not exist."));
        const { result } = setup();
        act(() => result.current.ask("add-random"));
        await act(() => result.current.confirm());
        act(() => result.current.ask("add-random"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.error).toBeNull();
    });

    it("reports itself busy while a round action is in flight", () => {
        // given
        mocks.deletingRound = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.busy).toBe(true);
    });
});

describe("usePreviousRoundActions dialogs", () => {
    it("opens a dialog for the selected entry", () => {
        // given
        const { result } = setup();
        act(() => result.current.select(new Set([12])));

        // when
        act(() => result.current.openDialog("youtube"));

        // then
        expect(result.current.dialog?.kind).toBe("youtube");
        expect(result.current.dialog?.submission.id).toBe(12);
    });

    it("opens no dialog while no entry is selected", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.openDialog("status"));

        // then
        expect(result.current.dialog).toBeNull();
    });

    it("closes the open dialog", () => {
        // given
        const { result } = setup();
        act(() => result.current.select(new Set([12])));
        act(() => result.current.openDialog("modify"));

        // when
        act(() => result.current.closeDialog());

        // then
        expect(result.current.dialog).toBeNull();
    });
});
