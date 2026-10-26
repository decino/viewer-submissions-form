import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useRoundActions } from "../../hooks/useRoundActions";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminRound, AdminSubmission } from "../../types/api";
import { RoundHeader } from "./RoundHeader";

const mocks = vi.hoisted(() => ({
    useRoundActions: vi.fn(),
    setConfirming: vi.fn(),
    togglePause: vi.fn(),
    deleteRound: vi.fn(),
}));

vi.mock("../../hooks/useRoundActions", () => ({ useRoundActions: mocks.useRoundActions }));

type RoundActions = ReturnType<typeof useRoundActions>;

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 1,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
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
        name: "Round 5: slaughter season",
        paused: false,
        endDate: null,
        submissions: [
            makeSubmission({ id: 1, WADName: "Sunlust", author: true }),
            makeSubmission({ id: 2, WADName: "sunlust" }),
            makeSubmission({ id: 3, WADName: "Eviternity" }),
            makeSubmission({ id: 4, WADName: "Ancient Aliens", verified: false, author: true }),
            makeSubmission({ id: 5, WADName: "Scythe", submissionValid: false, verified: false, author: true }),
        ],
        ...overrides,
    };
}

function stubActions(overrides: Partial<RoundActions> = {}): void {
    const actions: RoundActions = {
        confirming: null,
        setConfirming: mocks.setConfirming,
        error: null,
        pausing: false,
        deleting: false,
        togglePause: mocks.togglePause,
        deleteRound: mocks.deleteRound,
        ...overrides,
    };
    mocks.useRoundActions.mockReturnValue(actions);
}

beforeEach(() => {
    vi.resetAllMocks();
    stubActions();
});

describe("RoundHeader", () => {
    it("names the round and says it is active", () => {
        // when
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // then
        expect(screen.getByRole("heading", { name: "Round 5: slaughter season" })).toBeInTheDocument();
        expect(screen.getByText("Round is active")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Pause round" })).toBeInTheDocument();
    });

    it("says a paused round is paused and offers to resume it", () => {
        // when
        renderWithProviders(<RoundHeader round={makeRound({ paused: true })} onEndRound={vi.fn()} />);

        // then
        expect(screen.getByText("Round is paused, nobody can submit")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Resume round" })).toBeInTheDocument();
    });

    it("hands the round to its actions", () => {
        // given
        const round = makeRound();

        // when
        renderWithProviders(<RoundHeader round={round} onEndRound={vi.fn()} />);

        // then
        expect(mocks.useRoundActions).toHaveBeenCalledWith(round);
    });

    it("counts confirmed entries, map authors and entries to verify, and names the most sent verified WAD", () => {
        // when
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // then
        const hud = within(screen.getByLabelText("Round summary"));
        expect(hud.getAllByRole("definition").map(value => value.textContent)).toEqual(["4", "2", "1", "Sunlust"]);
        expect(hud.getByText("Most sent, 66.67%")).toBeInTheDocument();
    });

    it("shows no most sent WAD before anything is verified", () => {
        // given
        const round = makeRound({ submissions: [makeSubmission({ verified: false })] });

        // when
        renderWithProviders(<RoundHeader round={round} onEndRound={vi.fn()} />);

        // then
        const hud = within(screen.getByLabelText("Round summary"));
        expect(hud.getAllByRole("definition").map(value => value.textContent)).toEqual(["1", "0", "1", "N/A"]);
        expect(hud.getByText("Most sent")).toBeInTheDocument();
    });

    it("says until when an active round runs", () => {
        // when
        renderWithProviders(
            <RoundHeader round={makeRound({ endDate: "2026-10-30T20:00:00.000Z" })} onEndRound={vi.fn()} />,
        );

        // then
        expect(screen.getByText("Round is active until the 30th of October 2026")).toBeInTheDocument();
    });

    it("asks to confirm the pause when pause is pressed", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // when
        await user.click(screen.getByRole("button", { name: "Pause round" }));

        // then
        expect(mocks.setConfirming).toHaveBeenCalledWith("pause");
    });

    it("asks to confirm the deletion when delete is pressed", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // when
        await user.click(screen.getByRole("button", { name: "Delete round" }));

        // then
        expect(mocks.setConfirming).toHaveBeenCalledWith("delete");
    });

    it("explains what pausing does and pauses once confirmed", async () => {
        // given
        stubActions({ confirming: "pause" });
        const user = userEvent.setup();
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);
        const dialog = within(screen.getByRole("dialog", { name: "Pause round" }));

        // when
        await user.click(dialog.getByRole("button", { name: "Pause round" }));

        // then
        expect(dialog.getByText(/stops anyone from submitting entries/)).toBeInTheDocument();
        expect(mocks.togglePause).toHaveBeenCalledOnce();
    });

    it("explains what resuming does for a paused round", () => {
        // given
        stubActions({ confirming: "pause" });

        // when
        renderWithProviders(<RoundHeader round={makeRound({ paused: true })} onEndRound={vi.fn()} />);

        // then
        const dialog = within(screen.getByRole("dialog", { name: "Resume round" }));
        expect(dialog.getByText("Resuming the round lets people submit entries again.")).toBeInTheDocument();
    });

    it("warns that deleting the round removes its submissions and deletes once confirmed", async () => {
        // given
        stubActions({ confirming: "delete" });
        const user = userEvent.setup();
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);
        const dialog = within(screen.getByRole("dialog", { name: "Delete round" }));

        // when
        await user.click(dialog.getByRole("button", { name: "Delete round" }));

        // then
        expect(dialog.getByText("Delete this round? All of its submissions are removed.")).toBeInTheDocument();
        expect(mocks.deleteRound).toHaveBeenCalledOnce();
    });

    it("drops the confirmation when it is cancelled", async () => {
        // given
        stubActions({ confirming: "delete" });
        const user = userEvent.setup();
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // when
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        // then
        expect(mocks.setConfirming).toHaveBeenCalledWith(null);
        expect(mocks.deleteRound).not.toHaveBeenCalled();
    });

    it("locks the confirmation while the pause is being sent", () => {
        // given
        stubActions({ confirming: "pause", pausing: true });

        // when
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // then
        const dialog = within(screen.getByRole("dialog", { name: "Pause round" }));
        expect(dialog.getByRole("button", { name: "Pause round" })).toBeDisabled();
    });

    it("locks the confirmation while the deletion is being sent", () => {
        // given
        stubActions({ confirming: "delete", deleting: true });

        // when
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // then
        const dialog = within(screen.getByRole("dialog", { name: "Delete round" }));
        expect(dialog.getByRole("button", { name: "Delete round" })).toBeDisabled();
    });

    it("asks for the end round wizard", async () => {
        // given
        const onEndRound = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={onEndRound} />);

        // when
        await user.click(screen.getByRole("button", { name: "End round" }));

        // then
        expect(onEndRound).toHaveBeenCalledOnce();
    });

    it("shows why the last round action failed", () => {
        // given
        stubActions({ error: "No active round to pause" });

        // when
        renderWithProviders(<RoundHeader round={makeRound()} onEndRound={vi.fn()} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("No active round to pause");
    });
});
