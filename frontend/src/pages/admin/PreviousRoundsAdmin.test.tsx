import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { usePreviousRoundActions } from "../../hooks/usePreviousRoundActions";
import { makeAdminRound, makeAdminSubmission } from "../../test-utils/fixtures";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminRound, AdminSubmission } from "../../types/api";
import { PreviousRoundsAdmin } from "./PreviousRoundsAdmin";

type RoundActions = ReturnType<typeof usePreviousRoundActions>;

const mocks = vi.hoisted(() => ({
    useAdminPreviousRounds: vi.fn(),
    usePreviousRoundActions: vi.fn(),
    select: vi.fn(),
    ask: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
}));

vi.mock("../../hooks/queries/admin", () => ({ useAdminPreviousRounds: mocks.useAdminPreviousRounds }));
vi.mock("../../hooks/usePreviousRoundActions", () => ({ usePreviousRoundActions: mocks.usePreviousRoundActions }));
vi.mock("./ModifySubmissionModal", () => ({
    ModifySubmissionModal: ({ submissionId }: { submissionId: number | null }) =>
        submissionId === null ? null : <p>{`Changes to submission ${submissionId}`}</p>,
}));
vi.mock("./SetFileModal", () => ({
    SetFileModal: ({ submission }: { submission: AdminSubmission | null }) =>
        submission ? <p>{`File for ${submission.WADName}`}</p> : null,
}));
vi.mock("./ChangeStatusModal", () => ({
    ChangeStatusModal: ({ submission }: { submission: AdminSubmission | null }) =>
        submission ? <p>{`Status of ${submission.WADName}`}</p> : null,
}));
vi.mock("./YoutubeLinkModal", () => ({
    YoutubeLinkModal: ({ submission }: { submission: AdminSubmission | null }) =>
        submission ? <p>{`Playthrough of ${submission.WADName}`}</p> : null,
}));

const sunlust = makeAdminSubmission({
    id: 12,
    WADName: "Sunlust",
    chosen: true,
    playOrder: 1,
    email: "sunlust@example.test",
    status: { status: "In Progress", additionalInfo: "Halfway through", submissionId: 12 },
});
const scythe = makeAdminSubmission({ id: 11, WADName: "Scythe", chosen: true, playOrder: 2 });
const alienVendetta = makeAdminSubmission({ id: 13, WADName: "Alien Vendetta" });

function makeRound(overrides: Partial<AdminRound> = {}): AdminRound {
    return makeAdminRound({
        id: 3,
        name: "Round 3",
        active: false,
        created: "2026-09-01T12:00:00.000Z",
        submissions: [scythe, sunlust, alienVendetta],
        ...overrides,
    });
}

function stubRounds(rounds: AdminRound[], loading = false, error: string | null = null): void {
    mocks.useAdminPreviousRounds.mockReturnValue({ rounds, loading, error });
}

function stubActions(overrides: Partial<RoundActions> = {}): void {
    const actions: RoundActions = {
        results: [sunlust, scythe],
        others: [alienVendetta],
        selectedKeys: new Set(),
        select: mocks.select,
        selected: null,
        pending: null,
        ask: mocks.ask,
        confirm: mocks.confirm,
        cancel: mocks.cancel,
        busy: false,
        error: null,
        dialog: null,
        openDialog: mocks.openDialog,
        closeDialog: mocks.closeDialog,
        ...overrides,
    };
    mocks.usePreviousRoundActions.mockReturnValue(actions);
}

function wadNames(name: string): string[] {
    const table = within(screen.getByRole("table", { name }));
    const wadIndex = table.getAllByRole("columnheader").findIndex(header => header.textContent === "WAD");

    return table
        .getAllByRole("row")
        .slice(1)
        .map(row => within(row).getAllByRole("cell")[wadIndex]?.textContent ?? "");
}

function setup(streaming = false) {
    const user = userEvent.setup();
    renderWithProviders(<PreviousRoundsAdmin streaming={streaming} />);

    return { user };
}

beforeEach(() => {
    vi.resetAllMocks();
    stubRounds([makeRound()]);
    stubActions();
});

describe("PreviousRoundsAdmin", () => {
    it("says it is loading while the rounds are on their way", () => {
        // given
        stubRounds([], true);

        // when
        setup();

        // then
        expect(screen.getByText("Loading the previous rounds...")).toBeInTheDocument();
    });

    it("shows why the rounds could not be loaded", () => {
        // given
        stubRounds([], false, "Could not load the previous rounds.");

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the previous rounds.");
    });

    it("says when no round has finished yet", () => {
        // given
        stubRounds([]);

        // when
        setup();

        // then
        expect(screen.getByText("No round has finished yet.")).toBeInTheDocument();
    });

    it("opens the newest round and offers every round to pick from", () => {
        // given
        const later = makeRound({ id: 5, name: "Round 5" });
        stubRounds([makeRound(), later]);

        // when
        setup();

        // then
        const picker = screen.getByRole("combobox", { name: "Round" });
        expect(picker).toHaveValue("5");
        expect(
            within(picker)
                .getAllByRole("option")
                .map(option => option.textContent),
        ).toEqual(["Round 5", "Round 3"]);
        expect(mocks.usePreviousRoundActions).toHaveBeenCalledWith(later);
    });

    it("switches to the round that was picked", async () => {
        // given
        const first = makeRound();
        stubRounds([first, makeRound({ id: 5, name: "Round 5" })]);
        const { user } = setup();

        // when
        await user.selectOptions(screen.getByRole("combobox", { name: "Round" }), "Round 3");

        // then
        expect(mocks.usePreviousRoundActions).toHaveBeenLastCalledWith(first);
    });

    it("lists the picked entries in play order with the details tucked away", () => {
        // when
        setup();

        // then
        expect(wadNames("Round results")).toEqual(["Sunlust", "Scythe"]);
        const table = within(screen.getByRole("table", { name: "Round results" }));
        expect(table.queryByRole("columnheader", { name: "ID" })).not.toBeInTheDocument();
        expect(table.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
        expect(table.getByText("Halfway through")).toBeInTheDocument();
    });

    it("lists the entries that were not picked once every submission is asked for", async () => {
        // given
        const { user } = setup();
        expect(screen.queryByRole("table", { name: "Other submissions" })).not.toBeInTheDocument();

        // when
        await user.click(screen.getByRole("switch", { name: "Show all submissions" }));

        // then
        expect(wadNames("Other submissions")).toEqual(["Alien Vendetta"]);
    });

    it("hands the clicked row to its actions", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("row", { name: /Sunlust/ }));

        // then
        expect(mocks.select).toHaveBeenCalledWith(new Set([12]));
    });

    it("opens the picked entry with every action it can take", async () => {
        // given
        stubActions({ selectedKeys: new Set([12]), selected: sunlust });
        const { user } = setup();
        const panel = within(screen.getByRole("region", { name: "Sunlust" }));

        // when
        await user.click(panel.getByRole("button", { name: "Change status" }));
        await user.click(panel.getByRole("button", { name: "YouTube link" }));
        await user.click(panel.getByRole("button", { name: "Edit details" }));
        await user.click(panel.getByRole("button", { name: "Replace file" }));
        await user.click(panel.getByRole("button", { name: "Delete" }));

        // then
        expect(mocks.openDialog.mock.calls).toEqual([["status"], ["youtube"], ["modify"], ["file"]]);
        expect(mocks.ask).toHaveBeenCalledWith("delete-entry");
    });

    it("hides the email address of the picked entry while streaming", () => {
        // given
        stubActions({ selectedKeys: new Set([12]), selected: sunlust });

        // when
        setup(true);

        // then
        expect(screen.queryByText("sunlust@example.test")).not.toBeInTheDocument();
    });

    it("asks before adding a random entry or deleting the round", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Add random entry" }));
        await user.click(screen.getByRole("button", { name: "Delete round" }));

        // then
        expect(mocks.ask.mock.calls).toEqual([["add-random"], ["delete-round"]]);
    });

    it("names the entry and the round when asking before deleting the entry", async () => {
        // given
        stubActions({ selectedKeys: new Set([12]), selected: sunlust, pending: "delete-entry" });
        const { user } = setup();
        const dialog = within(screen.getByRole("dialog", { name: "Delete entry" }));
        expect(dialog.getByText("Delete Sunlust? It is removed from the results of Round 3.")).toBeInTheDocument();

        // when
        await user.click(dialog.getByRole("button", { name: "Delete" }));

        // then
        expect(mocks.confirm).toHaveBeenCalledOnce();
    });

    it("asks before adding a random entry to the round", async () => {
        // given
        stubActions({ pending: "add-random" });
        const { user } = setup();
        const dialog = within(screen.getByRole("dialog", { name: "Add random entry" }));
        expect(dialog.getByText("Pick another random entry for Round 3?")).toBeInTheDocument();

        // when
        await user.click(dialog.getByRole("button", { name: "Add entry" }));

        // then
        expect(mocks.confirm).toHaveBeenCalledOnce();
    });

    it("warns that deleting the round removes its submissions", () => {
        // given
        stubActions({ pending: "delete-round" });

        // when
        setup();

        // then
        const dialog = within(screen.getByRole("dialog", { name: "Delete round" }));
        expect(dialog.getByText("Delete Round 3? All of its submissions are removed.")).toBeInTheDocument();
    });

    it("cancels the confirmation when told to", async () => {
        // given
        stubActions({ pending: "delete-round" });
        const { user } = setup();

        // when
        await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

        // then
        expect(mocks.cancel).toHaveBeenCalledOnce();
        expect(mocks.confirm).not.toHaveBeenCalled();
    });

    it("holds the confirmation while the action is in flight", () => {
        // given
        stubActions({ pending: "add-random", busy: true });

        // when
        setup();

        // then
        expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Add entry" })).toBeDisabled();
    });

    it("shows why an action failed", () => {
        // given
        stubActions({ error: "Round 3 does not exist." });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Round 3 does not exist.");
    });

    it.each([
        ["modify", "Changes to submission 12"],
        ["file", "File for Sunlust"],
        ["status", "Status of Sunlust"],
        ["youtube", "Playthrough of Sunlust"],
    ] as const)("shows the %s dialog of the entry it was opened for", (kind, shown) => {
        // given
        stubActions({ dialog: { kind, submission: sunlust } });

        // when
        setup();

        // then
        expect(screen.getByText(shown)).toBeInTheDocument();
    });
});
