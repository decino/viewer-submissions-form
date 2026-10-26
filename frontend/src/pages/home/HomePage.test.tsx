import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { CurrentRound, PreviousRound } from "../../types/api";
import { HomePage } from "./HomePage";

const mocks = vi.hoisted(() => ({
    useCurrentRound: vi.fn(),
    usePreviousRounds: vi.fn(),
    useRealtimeConnected: vi.fn(),
}));

vi.mock("../../hooks/queries/round", () => ({
    useCurrentRound: mocks.useCurrentRound,
    usePreviousRounds: mocks.usePreviousRounds,
}));
vi.mock("../../hooks/useRealtimeConnected", () => ({ useRealtimeConnected: mocks.useRealtimeConnected }));
vi.mock("./SubmitForm", () => ({
    SubmitForm: ({ paused }: { paused: boolean }) => (
        <p>{paused ? "Paused submission form" : "Open submission form"}</p>
    ),
}));
vi.mock("../pastRounds/PreviousResults", () => ({
    PreviousResults: ({ rounds }: { rounds: PreviousRound[] }) => (
        <p>Results of {rounds.map(round => round.name).join(", ")}</p>
    ),
}));
vi.mock("../../components/RoundStatsCharts/RoundStatsCharts", () => ({
    RoundStatsCharts: ({ roundId }: { roundId: number }) => <p>Statistics of round {roundId}</p>,
}));

function makeRound(overrides: Partial<CurrentRound> = {}): CurrentRound {
    return {
        id: 42,
        name: "Round 42: E1M1 enjoyers",
        paused: false,
        created: "2026-10-01T12:00:00.000Z",
        endDate: null,
        submissions: [
            { id: 1, WADName: "Sunlust", level: "MAP12" },
            { id: 2, WADName: "Alien Vendetta", level: "MAP20" },
        ],
        ...overrides,
    };
}

function makePreviousRound(): PreviousRound {
    return {
        id: 41,
        created: "2026-09-01T12:00:00.000Z",
        updated: "2026-09-30T12:00:00.000Z",
        active: false,
        name: "Round 41",
        paused: false,
        endDate: null,
        submissions: [],
    };
}

function stubRound(round: CurrentRound | null, loading = false): void {
    mocks.useCurrentRound.mockReturnValue({ round, loading });
}

function stubPreviousRounds(rounds: PreviousRound[], loading = false): void {
    mocks.usePreviousRounds.mockReturnValue({ rounds, loading });
}

beforeEach(() => {
    mocks.useRealtimeConnected.mockReturnValue(true);
    stubPreviousRounds([]);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("HomePage", () => {
    it("says it is loading while the round is on its way", () => {
        // given
        stubRound(null, true);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Loading the current round...")).toBeInTheDocument();
    });

    it("keeps loading until it knows whether any round has finished when no round is open", () => {
        // given
        stubRound(null);
        stubPreviousRounds([], true);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Loading the past rounds...")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "No round is open" })).not.toBeInTheDocument();
    });

    it("shows why the round could not be loaded instead of claiming none is open", () => {
        // given
        mocks.useCurrentRound.mockReturnValue({
            round: null,
            loading: false,
            error: "Could not load the current round.",
        });

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the current round.");
        expect(screen.queryByRole("heading", { name: "No round is open" })).not.toBeInTheDocument();
    });

    it("shows why the earlier results could not be loaded while no round is open", () => {
        // given
        stubRound(null);
        mocks.usePreviousRounds.mockReturnValue({
            rounds: [],
            loading: false,
            error: "Could not load the previous rounds.",
        });

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the previous rounds.");
    });

    it("explains that nothing can be submitted when no round is open", () => {
        // given
        stubRound(null);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("heading", { name: "No round is open" })).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("says no round has taken place yet when there has never been one", () => {
        // given
        stubRound(null);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(
            screen.getByText("No submission rounds have taken place yet. Come back when one is announced."),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Results of/)).not.toBeInTheDocument();
    });

    it("shows the results of earlier rounds while no round is open", () => {
        // given
        stubRound(null);
        stubPreviousRounds([makePreviousRound()]);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText(/Submissions open again when decino announces the next round/)).toBeInTheDocument();
        expect(screen.getByText("Results of Round 41")).toBeInTheDocument();
        expect(screen.queryByText(/Open submission form/)).not.toBeInTheDocument();
    });

    it("lists every verified submission in order with its WAD and level", () => {
        // given
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
        expect(rows.map(row => row.textContent)).toEqual(["1SunlustMAP12", "2Alien VendettaMAP20"]);
    });

    it("shows the round's name, entry count and open status on the status bar", () => {
        // given
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("heading", { name: "Round 42: E1M1 enjoyers" })).toBeInTheDocument();
        const hud = within(screen.getByLabelText("Round status"));
        expect(hud.getAllByRole("definition").map(value => value.textContent)).toEqual([
            "Round 42: E1M1 enjoyers",
            "2",
            "Open",
            "None set",
        ]);
    });

    it("counts down to the deadline on the status bar", () => {
        // given
        vi.spyOn(Date, "now").mockReturnValue(Date.parse("2099-11-01T20:00:00.000Z"));
        stubRound(makeRound({ endDate: "2099-11-03T23:59:59.000Z" }));

        // when
        renderWithProviders(<HomePage />);

        // then
        const hud = within(screen.getByLabelText("Round status"));
        expect(hud.getByText("Time left")).toBeInTheDocument();
        expect(hud.getByText("2d 03h")).toBeInTheDocument();
    });

    it("shows a paused round as paused", () => {
        // given
        stubRound(makeRound({ paused: true }));

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(within(screen.getByLabelText("Round status")).getByText("Paused")).toBeInTheDocument();
    });

    it("writes the deadline as a calendar date", () => {
        // given
        stubRound(makeRound({ endDate: "2099-11-03T23:59:59.000Z" }));

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("3rd of November 2099")).toBeInTheDocument();
    });

    it("invites a visitor to wait when the round has no verified entries yet", () => {
        // given
        stubRound(makeRound({ submissions: [] }));

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText(/No verified submissions yet/)).toBeInTheDocument();
    });

    it("tells the visitor whether the list is updating live", () => {
        // given
        stubRound(makeRound());
        mocks.useRealtimeConnected.mockReturnValue(false);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Not live")).toBeInTheDocument();
    });

    it("offers the submission form while the round is open", () => {
        // given
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Open submission form")).toBeInTheDocument();
    });

    it("tells the submission form when the round is paused", () => {
        // given
        stubRound(makeRound({ paused: true }));

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Paused submission form")).toBeInTheDocument();
    });

    it("charts the statistics of the open round", () => {
        // given
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("heading", { name: "Round statistics" })).toBeInTheDocument();
        expect(screen.getByText("Statistics of round 42")).toBeInTheDocument();
    });

    it("does not fetch earlier rounds while a round is open", () => {
        // given
        mocks.usePreviousRounds.mockClear();
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(mocks.usePreviousRounds).not.toHaveBeenCalled();
        expect(screen.queryByText(/Results of/)).not.toBeInTheDocument();
    });

    it("gives an address to write to with questions about a submission", () => {
        // given
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText(/Questions about your submission\?/)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "submissions@decino.nl" })).toHaveAttribute(
            "href",
            "mailto:submissions@decino.nl",
        );
    });
});
