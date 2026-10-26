import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubmissionTableId, useSubmissionTableActions } from "../../hooks/useSubmissionTableActions";
import { makeAdminRound, makeAdminSubmission } from "../../test-utils/fixtures";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminSubmission } from "../../types/api";
import { SubmissionTables } from "./SubmissionTables";

type TableActions = ReturnType<typeof useSubmissionTableActions>;
type TableState = TableActions["unverified"];

const mocks = vi.hoisted(() => ({
    useSubmissionTableActions: vi.fn(),
    select: vi.fn(),
    ask: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
}));

vi.mock("../../hooks/useSubmissionTableActions", () => ({
    useSubmissionTableActions: mocks.useSubmissionTableActions,
}));
vi.mock("./ModifySubmissionModal", () => ({
    ModifySubmissionModal: ({ submissionId }: { submissionId: number | null }) =>
        submissionId === null ? null : <p>{`Changes to submission ${submissionId}`}</p>,
}));
vi.mock("./SetFileModal", () => ({
    SetFileModal: ({ submission }: { submission: AdminSubmission | null }) =>
        submission ? <p>{`File for ${submission.WADName}`}</p> : null,
}));

const round = makeAdminRound({ id: 4, name: "Round 4" });

const scythe = makeAdminSubmission({
    id: 1,
    WADName: "Scythe",
    authorName: "Erik",
    verified: false,
    created: "2026-10-02T10:00:00.000Z",
});
const alienVendetta = makeAdminSubmission({
    id: 3,
    WADName: "Alien Vendetta",
    verified: false,
    created: "2026-10-03T10:00:00.000Z",
});
const sunlust = makeAdminSubmission({ id: 5, WADName: "Sunlust", email: "sunlust@example.test" });

function makeTable(overrides: Partial<TableState> = {}): TableState {
    return { rows: [], selectedKeys: new Set(), selected: [], error: null, ...overrides };
}

function stubActions(overrides: Partial<TableActions> = {}): void {
    const actions: TableActions = {
        unverified: makeTable({ rows: [scythe, alienVendetta] }),
        current: makeTable({ rows: [sunlust] }),
        select: mocks.select,
        pending: null,
        ask: mocks.ask,
        confirm: mocks.confirm,
        cancel: mocks.cancel,
        busy: false,
        dialog: null,
        openDialog: mocks.openDialog,
        closeDialog: mocks.closeDialog,
        ...overrides,
    };
    mocks.useSubmissionTableActions.mockReturnValue(actions);
}

function wadNames(table: string): string[] {
    const grid = within(screen.getByRole("table", { name: table }));
    const wadIndex = grid.getAllByRole("columnheader").findIndex(header => header.textContent === "WAD");

    return grid
        .getAllByRole("row")
        .slice(1)
        .map(row => within(row).getAllByRole("cell")[wadIndex]?.textContent ?? "");
}

function setup(table: SubmissionTableId = "unverified", streaming = false) {
    const user = userEvent.setup();
    renderWithProviders(<SubmissionTables round={round} table={table} streaming={streaming} />);

    return { user };
}

beforeEach(() => {
    vi.resetAllMocks();
    stubActions();
});

describe("SubmissionTables", () => {
    it("works on the round it was given", () => {
        // when
        setup();

        // then
        expect(mocks.useSubmissionTableActions).toHaveBeenCalledWith(round);
    });

    it("lists the entries to verify, newest first", () => {
        // when
        setup("unverified");

        // then
        expect(wadNames("Entries to verify")).toEqual(["Alien Vendetta", "Scythe"]);
        expect(screen.queryByRole("table", { name: "Entries" })).not.toBeInTheDocument();
    });

    it("lists the verified entries on the entries tab", () => {
        // when
        setup("current");

        // then
        expect(wadNames("Entries")).toEqual(["Sunlust"]);
    });

    it("says when no entries are waiting", () => {
        // given
        stubActions({ unverified: makeTable() });

        // when
        setup("unverified");

        // then
        expect(screen.getByText("No submissions are waiting for verification.")).toBeInTheDocument();
    });

    it("keeps the entries that match the search", () => {
        // given
        setup("unverified");

        // when
        fireEvent.change(screen.getByRole("searchbox", { name: "Search entries" }), { target: { value: "erik" } });

        // then
        expect(wadNames("Entries to verify")).toEqual(["Scythe"]);
    });

    it("says when nothing matches the search", () => {
        // given
        setup("unverified");

        // when
        fireEvent.change(screen.getByRole("searchbox", { name: "Search entries" }), { target: { value: "plutonia" } });

        // then
        expect(screen.getByText("No entries match the search.")).toBeInTheDocument();
    });

    it("sorts by the picked order and remembers it", async () => {
        // given
        const { user } = setup("unverified");

        // when
        await user.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "Oldest first");

        // then
        expect(wadNames("Entries to verify")).toEqual(["Scythe", "Alien Vendetta"]);
        expect(localStorage.getItem("admin-entry-order")).toBe('"oldest"');
    });

    it("starts with the order picked last time", () => {
        // given
        localStorage.setItem("admin-entry-order", '"wad"');

        // when
        setup("unverified");

        // then
        expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("wad");
        expect(wadNames("Entries to verify")).toEqual(["Alien Vendetta", "Scythe"]);
    });

    it("hands a clicked entry to the table it belongs to", async () => {
        // given
        const { user } = setup("current");

        // when
        await user.click(screen.getByRole("row", { name: /Sunlust/ }));

        // then
        expect(mocks.select).toHaveBeenCalledWith("current", new Set([5]));
    });

    it("opens the one picked entry with its actions beside the table", async () => {
        // given
        stubActions({ current: makeTable({ rows: [sunlust], selectedKeys: new Set([5]), selected: [sunlust] }) });
        const { user } = setup("current");
        const panel = within(screen.getByRole("region", { name: "Sunlust" }));

        // when
        await user.click(panel.getByRole("button", { name: "Edit details" }));
        await user.click(panel.getByRole("button", { name: "Replace file" }));
        await user.click(panel.getByRole("button", { name: "Delete" }));

        // then
        expect(panel.queryByRole("button", { name: "Verify" })).not.toBeInTheDocument();
        expect(mocks.openDialog.mock.calls).toEqual([
            ["modify", "current"],
            ["file", "current"],
        ]);
        expect(mocks.ask).toHaveBeenCalledWith("delete", "current");
    });

    it("offers to verify an entry that waits for verification", async () => {
        // given
        stubActions({
            unverified: makeTable({ rows: [scythe, alienVendetta], selectedKeys: new Set([1]), selected: [scythe] }),
        });
        const { user } = setup("unverified");

        // when
        await user.click(
            within(screen.getByRole("region", { name: "Scythe" })).getByRole("button", { name: "Verify" }),
        );

        // then
        expect(mocks.ask).toHaveBeenCalledWith("verify", "unverified");
    });

    it("closes the entry by clearing the selection", async () => {
        // given
        stubActions({ current: makeTable({ rows: [sunlust], selectedKeys: new Set([5]), selected: [sunlust] }) });
        const { user } = setup("current");

        // when
        await user.click(
            within(screen.getByRole("region", { name: "Sunlust" })).getByRole("button", { name: "Close" }),
        );

        // then
        expect(mocks.select).toHaveBeenCalledWith("current", new Set());
    });

    it("hides the email address of the open entry while streaming", () => {
        // given
        stubActions({ current: makeTable({ rows: [sunlust], selectedKeys: new Set([5]), selected: [sunlust] }) });

        // when
        setup("current", true);

        // then
        expect(screen.queryByText("sunlust@example.test")).not.toBeInTheDocument();
    });

    it("drops the detail columns while streaming", () => {
        // when
        setup("current", true);

        // then
        const headers = screen.getAllByRole("columnheader").map(header => header.textContent);
        expect(headers).not.toContain("Submitter");
        expect(headers).toContain("Info");
        expect(headers).toContain("WAD");
    });

    it("acts on every picked entry at once", async () => {
        // given
        stubActions({
            unverified: makeTable({
                rows: [scythe, alienVendetta],
                selectedKeys: new Set([1, 3]),
                selected: [scythe, alienVendetta],
            }),
        });
        const { user } = setup("unverified");
        const bulk = within(screen.getByRole("region", { name: "Picked entries" }));

        // when
        await user.click(bulk.getByRole("button", { name: "Verify 2" }));
        await user.click(bulk.getByRole("button", { name: "Delete 2" }));
        await user.click(bulk.getByRole("button", { name: "Clear the selection" }));

        // then
        expect(bulk.getByRole("heading", { name: "2 entries picked" })).toBeInTheDocument();
        expect(mocks.ask.mock.calls).toEqual([
            ["verify", "unverified"],
            ["delete", "unverified"],
        ]);
        expect(mocks.select).toHaveBeenCalledWith("unverified", new Set());
    });

    it("asks before verifying and confirms when told to", async () => {
        // given
        stubActions({ pending: { kind: "verify", table: "unverified", ids: [1, 3] } });
        const { user } = setup();
        const dialog = within(screen.getByRole("dialog", { name: "Verify entries" }));
        expect(dialog.getByText("Verify 2 entries?")).toBeInTheDocument();

        // when
        await user.click(dialog.getByRole("button", { name: "Verify" }));

        // then
        expect(mocks.confirm).toHaveBeenCalledOnce();
    });

    it("warns that the submitter is emailed before deleting an entry", () => {
        // given
        stubActions({ pending: { kind: "delete", table: "current", ids: [5] } });

        // when
        setup("current");

        // then
        const dialog = within(screen.getByRole("dialog", { name: "Delete entries" }));
        expect(
            dialog.getByText("Delete 1 entry? The submitter is emailed that their entry was rejected."),
        ).toBeInTheDocument();
    });

    it("says each submitter is emailed when several entries are deleted", () => {
        // given
        stubActions({ pending: { kind: "delete", table: "unverified", ids: [1, 3] } });

        // when
        setup();

        // then
        expect(
            screen.getByText("Delete 2 entries? Each submitter is emailed that their entry was rejected."),
        ).toBeInTheDocument();
    });

    it("cancels the confirmation when told to", async () => {
        // given
        stubActions({ pending: { kind: "verify", table: "unverified", ids: [1] } });
        const { user } = setup();

        // when
        await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

        // then
        expect(mocks.cancel).toHaveBeenCalledOnce();
        expect(mocks.confirm).not.toHaveBeenCalled();
    });

    it("holds the confirmation while the action is in flight", () => {
        // given
        stubActions({ pending: { kind: "verify", table: "unverified", ids: [1] }, busy: true });

        // when
        setup();

        // then
        expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Verify" })).toBeDisabled();
    });

    it("shows the failure of the table on screen", () => {
        // given
        stubActions({ unverified: makeTable({ rows: [scythe], error: "Submission 1 does not exist" }) });

        // when
        setup("unverified");

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Submission 1 does not exist");
    });

    it("shows the modify form of the entry whose dialog is open", () => {
        // given
        stubActions({ dialog: { kind: "modify", submission: sunlust } });

        // when
        setup();

        // then
        expect(screen.getByText("Changes to submission 5")).toBeInTheDocument();
        expect(screen.queryByText(/File for/)).not.toBeInTheDocument();
    });

    it("shows the file form of the entry whose dialog is open", () => {
        // given
        stubActions({ dialog: { kind: "file", submission: sunlust } });

        // when
        setup();

        // then
        expect(screen.getByText("File for Sunlust")).toBeInTheDocument();
    });
});
