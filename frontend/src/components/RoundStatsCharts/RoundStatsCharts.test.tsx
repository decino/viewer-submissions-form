import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { RoundStats } from "../../types/api";
import { RoundStatsCharts } from "./RoundStatsCharts";

const mocks = vi.hoisted(() => ({
    useRoundStats: vi.fn(),
}));

vi.mock("../../hooks/queries/site", () => ({ useRoundStats: mocks.useRoundStats }));

function makeStats(overrides: Partial<RoundStats> = {}): RoundStats {
    return {
        recordFormat: { Practised: 3, Blind: 1 },
        isAuthor: { Yes: 1, No: 1 },
        distributable: { Yes: 1, No: 4 },
        ...overrides,
    };
}

function stubStats(stats: RoundStats | null, loading = false, error: string | null = null): void {
    mocks.useRoundStats.mockReturnValue({ stats, loading, error });
}

function chart(title: string): HTMLElement {
    const figure = screen.getByText(title).closest("figure");
    if (!figure) {
        throw new Error(`the ${title} chart is missing`);
    }

    return figure;
}

beforeEach(() => {
    stubStats(makeStats());
});

describe("RoundStatsCharts", () => {
    it("asks for the statistics of the round it is given", () => {
        // when
        renderWithProviders(<RoundStatsCharts roundId={7} />);

        // then
        expect(mocks.useRoundStats).toHaveBeenCalledWith(7);
    });

    it("charts the recorded format, map author and distributable breakdowns", () => {
        // when
        renderWithProviders(<RoundStatsCharts roundId={7} />);

        // then
        expect(
            within(chart("Recorded format"))
                .getAllByRole("listitem")
                .map(item => item.textContent),
        ).toEqual(["Practised3 (75%)", "Blind1 (25%)"]);
        expect(
            within(chart("Map author"))
                .getAllByRole("listitem")
                .map(item => item.textContent),
        ).toEqual(["Yes1 (50%)", "No1 (50%)"]);
        expect(
            within(chart("Distributable"))
                .getAllByRole("listitem")
                .map(item => item.textContent),
        ).toEqual(["Yes1 (20%)", "No4 (80%)"]);
    });

    it("treats a breakdown the server left out as having no data", () => {
        // given
        stubStats(makeStats({ distributable: null }));

        // when
        renderWithProviders(<RoundStatsCharts roundId={7} />);

        // then
        expect(within(chart("Distributable")).getByText("No verified submissions yet")).toBeInTheDocument();
        expect(within(chart("Map author")).queryByText("No verified submissions yet")).not.toBeInTheDocument();
    });

    it("says there are no verified submissions when the round has no statistics", () => {
        // given
        stubStats(null);

        // when
        renderWithProviders(<RoundStatsCharts roundId={7} />);

        // then
        expect(screen.getAllByText("No verified submissions yet")).toHaveLength(3);
    });

    it("says the statistics are loading instead of claiming there are none", () => {
        // given
        stubStats(null, true);

        // when
        renderWithProviders(<RoundStatsCharts roundId={7} />);

        // then
        expect(screen.getAllByText("Loading the statistics...")).toHaveLength(3);
        expect(screen.queryByText("No verified submissions yet")).not.toBeInTheDocument();
    });

    it("shows why the statistics could not be loaded instead of claiming there are none", () => {
        // given
        stubStats(null, false, "Could not load the round statistics.");

        // when
        renderWithProviders(<RoundStatsCharts roundId={7} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the round statistics.");
        expect(screen.queryByText("No verified submissions yet")).not.toBeInTheDocument();
        expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    });
});
