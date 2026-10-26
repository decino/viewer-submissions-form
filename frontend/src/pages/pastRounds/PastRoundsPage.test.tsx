import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { PreviousRound } from "../../types/api";
import { PastRoundsPage } from "./PastRoundsPage";

const mocks = vi.hoisted(() => ({
    useCurrentRound: vi.fn(),
    usePreviousRounds: vi.fn(),
}));

vi.mock("../../hooks/queries/round", () => ({
    useCurrentRound: mocks.useCurrentRound,
    usePreviousRounds: mocks.usePreviousRounds,
}));
vi.mock("./PreviousResults", () => ({
    PreviousResults: ({ rounds }: { rounds: PreviousRound[] }) => (
        <p>Results of {rounds.map(round => round.name).join(", ")}</p>
    ),
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

function stubRoundOpen(open: boolean): void {
    mocks.useCurrentRound.mockReturnValue({ round: open ? { id: 50 } : null, loading: false, error: null });
}

beforeEach(() => {
    stubRoundOpen(false);
});

describe("PastRoundsPage", () => {
    it("says it is loading while the past rounds are on their way", () => {
        // given
        stubPreviousRounds([], true);

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByText("Loading the past rounds...")).toBeInTheDocument();
    });

    it("shows why the past rounds could not be loaded", () => {
        // given
        stubPreviousRounds([], false, "Could not load the previous rounds.");

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the previous rounds.");
    });

    it("says no round has finished when there are none", () => {
        // given
        stubPreviousRounds([]);

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByRole("heading", { name: "Past rounds" })).toBeInTheDocument();
        expect(screen.getByText("No round has finished yet.")).toBeInTheDocument();
    });

    it("shows every finished round while a new round is open", () => {
        // given
        stubRoundOpen(true);
        stubPreviousRounds([makePreviousRound(42), makePreviousRound(41)]);

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByText("Results of Round 42, Round 41")).toBeInTheDocument();
    });

    it("shows every finished round except the latest, which is on This round while no round is open", () => {
        // given
        stubPreviousRounds([makePreviousRound(43), makePreviousRound(41), makePreviousRound(42)]);

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByText("Results of Round 41, Round 42")).toBeInTheDocument();
    });

    it("says older rounds show up here when only the latest round has finished", () => {
        // given
        stubPreviousRounds([makePreviousRound(41)]);

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByText("The latest round is on This round. Older rounds show up here.")).toBeInTheDocument();
        expect(screen.queryByText(/Results of/)).not.toBeInTheDocument();
    });
});
