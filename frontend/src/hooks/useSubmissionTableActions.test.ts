import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminRound, AdminSubmission } from "../types/api";
import { useSubmissionTableActions } from "./useSubmissionTableActions";

const mocks = vi.hoisted(() => ({
    verify: vi.fn<(ids: number[]) => Promise<unknown>>(),
    remove: vi.fn<(ids: number[]) => Promise<unknown>>(),
    verifying: false,
    removing: false,
}));

vi.mock("./mutations/submission", () => ({
    useVerifyEntries: () => ({ mutateAsync: mocks.verify, isPending: mocks.verifying }),
    useDeleteEntries: () => ({ mutateAsync: mocks.remove, isPending: mocks.removing }),
}));

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: null,
        submissionRoundId: 4,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: null,
        WAD: "https://example.test/sunlust.zip",
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
        id: 4,
        created: "2026-10-01T12:00:00.000Z",
        updated: "2026-10-01T12:00:00.000Z",
        active: true,
        name: "Round 4",
        paused: false,
        endDate: null,
        submissions: [
            makeSubmission({ id: 3, WADName: "Alien Vendetta", verified: false }),
            makeSubmission({ id: 5, WADName: "Sunlust" }),
            makeSubmission({ id: 1, WADName: "Scythe", verified: false }),
            makeSubmission({ id: 6, WADName: "Eviternity", chosen: true }),
            makeSubmission({ id: 2, WADName: "Plutonia 2" }),
            makeSubmission({ id: 8, WADName: "Unconfirmed", submissionValid: false, verified: false }),
        ],
    };
}

function setup() {
    return renderHook(() => useSubmissionTableActions(makeRound()), { wrapper: providerWrapper() });
}

function wadNames(rows: readonly AdminSubmission[]): string[] {
    return rows.map(row => row.WADName);
}

beforeEach(() => {
    mocks.verify.mockReset();
    mocks.verify.mockResolvedValue({ success: true, description: "Entries verified" });
    mocks.remove.mockReset();
    mocks.remove.mockResolvedValue({ success: true, description: "Entries deleted" });
    mocks.verifying = false;
    mocks.removing = false;
});

describe("useSubmissionTableActions tables", () => {
    it("lists the confirmed entries that still need verifying, oldest first", () => {
        // when
        const { result } = setup();

        // then
        expect(wadNames(result.current.unverified.rows)).toEqual(["Scythe", "Alien Vendetta"]);
    });

    it("lists the verified entries that have not been picked, oldest first", () => {
        // when
        const { result } = setup();

        // then
        expect(wadNames(result.current.current.rows)).toEqual(["Plutonia 2", "Sunlust"]);
    });

    it("starts with nothing selected, nothing pending and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.unverified.selected).toEqual([]);
        expect(result.current.current.selected).toEqual([]);
        expect(result.current.pending).toBeNull();
        expect(result.current.unverified.error).toBeNull();
        expect(result.current.dialog).toBeNull();
    });

    it("keeps each table's selection to itself", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.select("unverified", new Set([1, 3])));

        // then
        expect(wadNames(result.current.unverified.selected)).toEqual(["Scythe", "Alien Vendetta"]);
        expect(result.current.unverified.selectedKeys).toEqual(new Set([1, 3]));
        expect(result.current.current.selected).toEqual([]);
    });
});

describe("useSubmissionTableActions confirmation", () => {
    it("asks to verify the selected entries", () => {
        // given
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([3, 1])));

        // when
        act(() => result.current.ask("verify", "unverified"));

        // then
        expect(result.current.pending).toEqual({ kind: "verify", table: "unverified", ids: [1, 3] });
    });

    it("asks nothing while no entry is selected", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.ask("delete", "current"));

        // then
        expect(result.current.pending).toBeNull();
    });

    it("verifies the entries once confirmed and clears the selection", async () => {
        // given
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([1, 3])));
        act(() => result.current.ask("verify", "unverified"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(mocks.verify).toHaveBeenCalledWith([1, 3]);
        expect(mocks.remove).not.toHaveBeenCalled();
        expect(result.current.pending).toBeNull();
        expect(result.current.unverified.selected).toEqual([]);
    });

    it("deletes the entries once confirmed and clears only that table's selection", async () => {
        // given
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([1])));
        act(() => result.current.select("current", new Set([5])));
        act(() => result.current.ask("delete", "current"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(mocks.remove).toHaveBeenCalledWith([5]);
        expect(result.current.current.selected).toEqual([]);
        expect(wadNames(result.current.unverified.selected)).toEqual(["Scythe"]);
    });

    it("sends nothing when the confirmation is cancelled", () => {
        // given
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([1])));
        act(() => result.current.ask("verify", "unverified"));

        // when
        act(() => result.current.cancel());

        // then
        expect(result.current.pending).toBeNull();
        expect(mocks.verify).not.toHaveBeenCalled();
    });

    it("sends nothing when nothing is pending", async () => {
        // given
        const { result } = setup();

        // when
        await act(() => result.current.confirm());

        // then
        expect(mocks.verify).not.toHaveBeenCalled();
        expect(mocks.remove).not.toHaveBeenCalled();
    });

    it("reports the server's message on the table whose action failed and keeps its selection", async () => {
        // given
        mocks.verify.mockRejectedValue(new Error("Submission 1 does not exist"));
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([1])));
        act(() => result.current.ask("verify", "unverified"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.unverified.error).toBe("Submission 1 does not exist");
        expect(result.current.current.error).toBeNull();
        expect(wadNames(result.current.unverified.selected)).toEqual(["Scythe"]);
        expect(result.current.pending).toBeNull();
    });

    it("says what failed when the failure carries no message", async () => {
        // given
        mocks.remove.mockRejectedValue(new Error(""));
        const { result } = setup();
        act(() => result.current.select("current", new Set([5])));
        act(() => result.current.ask("delete", "current"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.current.error).toBe("The entries could not be deleted.");
    });

    it("clears an earlier error when it tries again", async () => {
        // given
        mocks.verify.mockRejectedValueOnce(new Error("Submission 1 does not exist"));
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([1])));
        act(() => result.current.ask("verify", "unverified"));
        await act(() => result.current.confirm());
        act(() => result.current.ask("verify", "unverified"));

        // when
        await act(() => result.current.confirm());

        // then
        expect(result.current.unverified.error).toBeNull();
    });

    it("reports itself busy while an entry action is in flight", () => {
        // given
        mocks.removing = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.busy).toBe(true);
    });
});

describe("useSubmissionTableActions dialogs", () => {
    it("opens a dialog for the one selected entry", () => {
        // given
        const { result } = setup();
        act(() => result.current.select("current", new Set([5])));

        // when
        act(() => result.current.openDialog("modify", "current"));

        // then
        expect(result.current.dialog?.kind).toBe("modify");
        expect(result.current.dialog?.submission.id).toBe(5);
    });

    it("opens no dialog while more than one entry is selected", () => {
        // given
        const { result } = setup();
        act(() => result.current.select("unverified", new Set([1, 3])));

        // when
        act(() => result.current.openDialog("modify", "unverified"));

        // then
        expect(result.current.dialog).toBeNull();
    });

    it("closes the open dialog", () => {
        // given
        const { result } = setup();
        act(() => result.current.select("current", new Set([5])));
        act(() => result.current.openDialog("file", "current"));

        // when
        act(() => result.current.closeDialog());

        // then
        expect(result.current.dialog).toBeNull();
    });
});
