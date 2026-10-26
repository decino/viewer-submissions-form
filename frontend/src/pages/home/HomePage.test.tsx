import { act, screen, within } from "@testing-library/react";
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
    useRefetchRoundAfterDeadline: vi.fn(),
}));
vi.mock("../../hooks/useRealtimeConnected", () => ({ useRealtimeConnected: mocks.useRealtimeConnected }));
vi.mock("./SubmitForm", () => ({
    SubmitForm: ({ paused }: { paused: boolean }) => (
        <p>{paused ? "Paused submission form" : "Open submission form"}</p>
    ),
}));
vi.mock("../../components/RoundStatsCharts/RoundStatsCharts", () => ({
    RoundStatsCharts: ({ roundId }: { roundId: number }) => <p>Statistics of round {roundId}</p>,
}));
vi.mock("./LatestRound", () => ({
    LatestRound: ({ round }: { round: PreviousRound }) => <p>Latest round {round.name}</p>,
}));

function makePreviousRound(id: number): PreviousRound {
    return {
        id,
        created: "2026-09-01T12:00:00.000Z",
        updated: "2026-09-30T12:00:00.000Z",
        active: false,
        name: `Round ${id}`,
        paused: false,
        endDate: null,
        submissions: [],
    };
}

function stubPreviousRounds(rounds: PreviousRound[], loading = false, error: string | null = null): void {
    mocks.usePreviousRounds.mockReturnValue({ rounds, loading, error });
}

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

function stubRound(round: CurrentRound | null, loading = false): void {
    mocks.useCurrentRound.mockReturnValue({ round, loading });
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

    it("keeps loading until it knows the latest round when no round is open", () => {
        // given
        stubRound(null);
        stubPreviousRounds([], true);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Loading the latest round...")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "No round is open" })).not.toBeInTheDocument();
    });

    it("shows the latest round under the notice when no round is open", () => {
        // given
        stubRound(null);
        stubPreviousRounds([makePreviousRound(41), makePreviousRound(43), makePreviousRound(42)]);

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("heading", { name: "No round is open" })).toBeInTheDocument();
        expect(screen.getByText(/Submissions open again when decino announces the next round/)).toBeInTheDocument();
        expect(screen.getByText("Latest round Round 43")).toBeInTheDocument();
        expect(screen.queryByText(/Latest round Round 4[12]/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Open submission form/)).not.toBeInTheDocument();
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
        expect(screen.queryByText(/Latest round/)).not.toBeInTheDocument();
    });

    it("shows why the latest round could not be loaded while no round is open", () => {
        // given
        stubRound(null);
        stubPreviousRounds([], false, "Could not load the previous rounds.");

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the previous rounds.");
    });

    it("leaves the finished rounds to the past rounds page while a round is open", () => {
        // given
        mocks.usePreviousRounds.mockClear();
        stubRound(makeRound());

        // when
        renderWithProviders(<HomePage />);

        // then
        expect(screen.getByText("Open submission form")).toBeInTheDocument();
        expect(screen.queryByText(/Latest round/)).not.toBeInTheDocument();
        expect(mocks.usePreviousRounds).not.toHaveBeenCalled();
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

    it("counts down to the deadline on the status bar every second", () => {
        // given
        vi.useFakeTimers({ now: Date.parse("2099-11-01T20:00:00.000Z") });
        stubRound(makeRound({ endDate: "2099-11-03T23:59:59.000Z" }));
        renderWithProviders(<HomePage />);
        const hud = within(screen.getByLabelText("Round status"));
        expect(hud.getByText("2d 03:59:59")).toBeInTheDocument();

        // when
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        // then
        expect(hud.getByText("Time left")).toBeInTheDocument();
        expect(hud.getByText("2d 03:59:57")).toBeInTheDocument();
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
