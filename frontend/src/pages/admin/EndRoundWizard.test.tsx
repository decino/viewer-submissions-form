import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PickedEntry, useEndRoundWizard } from "../../hooks/useEndRoundWizard";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminRound, AdminSubmission } from "../../types/api";
import { EndRoundWizard } from "./EndRoundWizard";

type EndRoundWizardState = ReturnType<typeof useEndRoundWizard>;

const mocks = vi.hoisted(() => ({
    useEndRoundWizard: vi.fn(),
    pause: vi.fn(),
    select: vi.fn(),
    addRandom: vi.fn(),
    rerollSelected: vi.fn(),
    removeSelected: vi.fn(),
    back: vi.fn(),
    next: vi.fn(),
}));

vi.mock("../../hooks/useEndRoundWizard", async importOriginal => {
    const actual = await importOriginal<typeof import("../../hooks/useEndRoundWizard")>();
    return {
        ...actual,
        useEndRoundWizard: mocks.useEndRoundWizard,
    };
});

function makeSubmission(id: number, overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: `WAD ${id}`,
        level: `MAP0${id}`,
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

function makeRound(overrides: Partial<AdminRound> = {}): AdminRound {
    return {
        id: 5,
        created: "2026-10-20T12:00:00.000Z",
        updated: "2026-10-20T12:00:00.000Z",
        active: true,
        name: "Round 5",
        paused: true,
        endDate: null,
        submissions: [],
        ...overrides,
    };
}

function picksOf(entries: readonly AdminSubmission[]): PickedEntry[] {
    return entries.map((entry, index) => ({ key: index + 1, entry }));
}

function stubWizard(overrides: Partial<EndRoundWizardState> = {}): void {
    const state: EndRoundWizardState = {
        step: "pause",
        error: null,
        pause: mocks.pause,
        pausing: false,
        picks: [],
        selected: new Set<number>(),
        select: mocks.select,
        duplicates: new Set<number>(),
        addRandom: mocks.addRandom,
        rerollSelected: mocks.rerollSelected,
        removeSelected: mocks.removeSelected,
        generating: false,
        blocker: null,
        back: mocks.back,
        next: mocks.next,
        nextDisabled: false,
        ...overrides,
    };

    mocks.useEndRoundWizard.mockReturnValue(state);
}

function renderWizard(round: AdminRound = makeRound(), onClose = vi.fn()) {
    renderWithProviders(<EndRoundWizard open onClose={onClose} round={round} />);
    return { onClose };
}

function cellsOf(row: HTMLElement): string[] {
    return within(row)
        .getAllByRole("cell")
        .map(cell => cell.textContent ?? "")
        .filter(text => text !== "");
}

function rowsOf(label: string): string[][] {
    return within(screen.getByRole("table", { name: label }))
        .getAllByRole("row")
        .slice(1)
        .map(cellsOf);
}

beforeEach(() => {
    vi.resetAllMocks();
    stubWizard();
});

describe("EndRoundWizard", () => {
    it("keeps the wizard going while the dialog is closed so nothing is lost", () => {
        // when
        renderWithProviders(<EndRoundWizard open={false} onClose={vi.fn()} round={makeRound()} />);

        // then
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(mocks.useEndRoundWizard).toHaveBeenCalled();
    });

    it("tells the wizard which round it ends, whether it is paused, and closes once the round is finished", () => {
        // given
        const onClose = vi.fn();

        // when
        renderWizard(makeRound({ paused: false }), onClose);

        // then
        expect(mocks.useEndRoundWizard).toHaveBeenCalledWith(5, false, onClose);
    });

    it("names the three steps and marks the one the admin is on", () => {
        // given
        stubWizard({ step: "pick" });

        // when
        renderWizard();

        // then
        expect(screen.getByRole("heading", { name: "End round" })).toBeInTheDocument();
        expect(screen.getByText("Pause round").closest("li")).not.toHaveAttribute("aria-current");
        expect(screen.getByText("Pick winners").closest("li")).toHaveAttribute("aria-current", "step");
        expect(screen.getByText("Review")).toBeInTheDocument();
    });

    it("asks for the round to be paused before anything else", () => {
        // given
        stubWizard({ nextDisabled: true });

        // when
        renderWizard(makeRound({ paused: false }));

        // then
        expect(screen.getByText("Pause the round before picking winners.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("pauses the round from the first step", async () => {
        // given
        const user = userEvent.setup();
        renderWizard(makeRound({ paused: false }));

        // when
        await user.click(screen.getByRole("button", { name: "Pause round" }));

        // then
        expect(mocks.pause).toHaveBeenCalledOnce();
    });

    it("cannot pause the round again while it is being paused", () => {
        // given
        stubWizard({ pausing: true });

        // when
        renderWizard(makeRound({ paused: false }));

        // then
        expect(screen.getByRole("button", { name: "Pause round" })).toBeDisabled();
    });

    it("lets the admin carry on once the round is paused", () => {
        // when
        renderWizard();

        // then
        expect(screen.getByText("The round is paused, so no new entries can come in.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Pause round" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    });

    it("shows what went wrong", () => {
        // given
        stubWizard({ error: "There are no entries in this round!" });

        // when
        renderWizard();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("There are no entries in this round!");
    });

    it("moves on and back when the admin asks", async () => {
        // given
        stubWizard({ step: "pick", picks: picksOf([makeSubmission(1)]) });
        const user = userEvent.setup();
        renderWizard();

        // when
        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Back" }));

        // then
        expect(mocks.next).toHaveBeenCalledOnce();
        expect(mocks.back).toHaveBeenCalledOnce();
    });

    it("lists each picked entry with its WAD, level, submitter and authorship", () => {
        // given
        stubWizard({
            step: "pick",
            picks: picksOf([makeSubmission(1, { author: true }), makeSubmission(2, { authorName: null })]),
        });

        // when
        renderWizard();

        // then
        expect(rowsOf("Picked entries")).toEqual([
            ["WAD 1", "MAP01", "doomguy", "Yes"],
            ["WAD 2", "MAP02", "anonymous", "No"],
        ]);
    });

    it("says when no entry has been picked yet", () => {
        // given
        stubWizard({ step: "pick" });

        // when
        renderWizard();

        // then
        expect(screen.getByText("No entries picked yet")).toBeInTheDocument();
    });

    it("draws a random entry when asked", async () => {
        // given
        stubWizard({ step: "pick" });
        const user = userEvent.setup();
        renderWizard();

        // when
        await user.click(screen.getByRole("button", { name: "Add random entry" }));

        // then
        expect(mocks.addRandom).toHaveBeenCalledOnce();
    });

    it("tells the wizard which entries the admin selects", async () => {
        // given
        stubWizard({ step: "pick", picks: picksOf([makeSubmission(1), makeSubmission(2)]) });
        const user = userEvent.setup();
        renderWizard();

        // when
        await user.click(screen.getByRole("row", { name: /WAD 2/ }));

        // then
        expect(mocks.select).toHaveBeenCalledWith(new Set([2]));
    });

    it("re-rolls and removes the selected entries when asked", async () => {
        // given
        stubWizard({
            step: "pick",
            picks: picksOf([makeSubmission(1), makeSubmission(2)]),
            selected: new Set([1]),
        });
        const user = userEvent.setup();
        renderWizard();

        // when
        await user.click(screen.getByRole("button", { name: "Re-roll selected" }));
        await user.click(screen.getByRole("button", { name: "Remove selected" }));

        // then
        expect(mocks.rerollSelected).toHaveBeenCalledOnce();
        expect(mocks.removeSelected).toHaveBeenCalledOnce();
    });

    it("cannot re-roll or remove while nothing is selected", () => {
        // given
        stubWizard({ step: "pick", picks: picksOf([makeSubmission(1)]) });

        // when
        renderWizard();

        // then
        expect(screen.getByRole("button", { name: "Add random entry" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Re-roll selected" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Remove selected" })).toBeDisabled();
    });

    it("holds back every change to the picks while entries are being drawn", () => {
        // given
        stubWizard({
            step: "pick",
            picks: picksOf([makeSubmission(1)]),
            selected: new Set([1]),
            generating: true,
        });

        // when
        renderWizard();

        // then
        expect(screen.getByRole("button", { name: "Add random entry" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Re-roll selected" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Remove selected" })).toBeDisabled();
    });

    it("marks duplicate entries apart from the others", () => {
        // given
        stubWizard({
            step: "pick",
            picks: picksOf([makeSubmission(1), makeSubmission(2), makeSubmission(2)]),
            duplicates: new Set([2]),
        });

        // when
        renderWizard();

        // then
        const rows = within(screen.getByRole("table", { name: "Picked entries" }))
            .getAllByRole("row")
            .slice(1);
        expect(rows[1].className).toBe(rows[2].className);
        expect(rows[1].className).not.toBe(rows[0].className);
    });

    it("says why the admin cannot move on yet", () => {
        // given
        stubWizard({ step: "pick", blocker: "Remove duplicate entries before continuing", nextDisabled: true });

        // when
        renderWizard();

        // then
        expect(screen.getByText("Remove duplicate entries before continuing")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("reviews the winners numbered in play order", () => {
        // given
        stubWizard({ step: "review", picks: picksOf([makeSubmission(4), makeSubmission(2)]) });

        // when
        renderWizard();

        // then
        expect(rowsOf("Winners in play order")).toEqual([
            ["1", "WAD 4", "MAP04", "doomguy", "No"],
            ["2", "WAD 2", "MAP02", "doomguy", "No"],
        ]);
        expect(screen.getByRole("button", { name: "Finish round" })).toBeEnabled();
    });

    it("finishes the round when the admin confirms the review", async () => {
        // given
        stubWizard({ step: "review", picks: picksOf([makeSubmission(4)]) });
        const user = userEvent.setup();
        renderWizard();

        // when
        await user.click(screen.getByRole("button", { name: "Finish round" }));

        // then
        expect(mocks.next).toHaveBeenCalledOnce();
    });
});
