import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { PreviousRound, PublicSubmission, SubmissionStatusName } from "../../types/api";
import { LatestRound } from "./LatestRound";

vi.mock("../pastRounds/PreviousResults", () => ({
    RoundResultTables: ({ round, showAll }: { round: PreviousRound; showAll: boolean }) => (
        <p>{`Tables of ${round.name}${showAll ? " with every submission" : ""}`}</p>
    ),
}));

function picked(id: number, status: SubmissionStatusName): PublicSubmission {
    return {
        id,
        created: "2026-09-02T12:00:00.000Z",
        updated: "2026-09-02T12:00:00.000Z",
        WADName: `WAD ${id}`,
        level: "MAP01",
        authorName: null,
        submissionRoundId: 8,
        playOrder: id,
        youtubeLink: null,
        status: { status, additionalInfo: null, submissionId: id },
        chosen: true,
        recordedFormat: "Blind",
        downloadUrl: null,
    };
}

function makeRound(submissions: PublicSubmission[]): PreviousRound {
    return {
        id: 8,
        created: "2026-09-01T13:47:00.000Z",
        updated: "2026-09-30T12:00:00.000Z",
        active: false,
        name: "Round #08",
        paused: false,
        endDate: null,
        submissions,
    };
}

describe("LatestRound", () => {
    it("names the round and says it is being played while picks are still queued", () => {
        // when
        renderWithProviders(<LatestRound round={makeRound([picked(1, "Completed"), picked(2, "Queued")])} />);

        // then
        expect(screen.getByRole("heading", { name: "Round #08" })).toBeInTheDocument();
        expect(screen.getByText("Now playing")).toBeInTheDocument();
        expect(screen.getByText("Started on 1st of September 2026 at 13:47 UTC")).toBeInTheDocument();
        expect(screen.getByText("Tables of Round #08")).toBeInTheDocument();
    });

    it("says every pick was played once none is left", () => {
        // when
        renderWithProviders(<LatestRound round={makeRound([picked(1, "Completed"), picked(2, "Rejected")])} />);

        // then
        expect(screen.getByText("All played")).toBeInTheDocument();
    });

    it("shows every submission once asked to", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<LatestRound round={makeRound([picked(1, "Queued")])} />);

        // when
        await user.click(screen.getByRole("switch", { name: "Show all submissions" }));

        // then
        expect(screen.getByText("Tables of Round #08 with every submission")).toBeInTheDocument();
    });
});
