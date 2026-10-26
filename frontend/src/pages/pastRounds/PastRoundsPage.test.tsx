import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { PreviousRound } from "../../types/api";
import { PastRoundsPage } from "./PastRoundsPage";

const mocks = vi.hoisted(() => ({
    usePreviousRounds: vi.fn(),
}));

vi.mock("../../hooks/queries/round", () => ({ usePreviousRounds: mocks.usePreviousRounds }));
vi.mock("./PreviousResults", () => ({
    PreviousResults: ({ rounds }: { rounds: PreviousRound[] }) => (
        <p>Results of {rounds.map(round => round.name).join(", ")}</p>
    ),
}));

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

function stubPreviousRounds(rounds: PreviousRound[], loading = false, error: string | null = null): void {
    mocks.usePreviousRounds.mockReturnValue({ rounds, loading, error });
}

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

    it("shows the results of every finished round", () => {
        // given
        stubPreviousRounds([makePreviousRound()]);

        // when
        renderWithProviders(<PastRoundsPage />);

        // then
        expect(screen.getByText("Results of Round 41")).toBeInTheDocument();
    });
});
