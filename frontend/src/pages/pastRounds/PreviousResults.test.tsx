import { screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { PreviousRound, PublicSubmission, SubmissionStatus } from "../../types/api";
import { PreviousResults } from "./PreviousResults";

interface RoundTabsStubProps {
    rounds: readonly PreviousRound[];
    ariaLabel: string;
    children: (round: PreviousRound, showAll: boolean) => ReactNode;
}

interface StatusBadgeStubProps {
    status: SubmissionStatus | null;
    youtubeLink: string | null;
}

const mocks = vi.hoisted(() => ({
    showAll: false,
}));

vi.mock("../../components/RoundTabs/RoundTabs", () => ({
    RoundTabs: ({ rounds, ariaLabel, children }: RoundTabsStubProps) => (
        <section aria-label={ariaLabel}>
            {rounds.map(round => (
                <div key={round.id}>{children(round, mocks.showAll)}</div>
            ))}
        </section>
    ),
}));
vi.mock("../../components/SubmissionStatusBadge/SubmissionStatusBadge", () => ({
    SubmissionStatusBadge: ({ status, youtubeLink }: StatusBadgeStubProps) => (
        <span>{`status ${status?.status ?? "none"}, playthrough ${youtubeLink ?? "none"}`}</span>
    ),
}));
vi.mock("../../components/DownloadLink/DownloadLink", () => ({
    DownloadLink: ({ url }: { url: string | null }) => <span>{`download ${url ?? "none"}`}</span>,
}));

function makeSubmission(overrides: Partial<PublicSubmission> = {}): PublicSubmission {
    return {
        id: 11,
        created: "2026-09-02T18:30:00.000Z",
        updated: "2026-09-29T20:00:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: null,
        submissionRoundId: 5,
        playOrder: 2,
        youtubeLink: "https://www.youtube.com/watch?v=sunlust12",
        status: { status: "Completed", additionalInfo: "Beaten on UV", submissionId: 11 },
        chosen: true,
        recordedFormat: "Blind",
        downloadUrl: "https://example.com/sunlust.zip",
        ...overrides,
    };
}

function makeRound(overrides: Partial<PreviousRound> = {}): PreviousRound {
    return {
        id: 5,
        created: "2026-09-01T12:00:00.000Z",
        updated: "2026-09-30T12:00:00.000Z",
        active: false,
        name: "Round 5",
        paused: false,
        endDate: null,
        submissions: [
            makeSubmission(),
            makeSubmission({
                id: 12,
                WADName: "Alien Vendetta",
                level: "MAP20",
                authorName: "Anders",
                playOrder: 1,
                youtubeLink: null,
                status: { status: "Rejected", additionalInfo: "Too long for a stream", submissionId: 12 },
                recordedFormat: "Practised",
                downloadUrl: null,
            }),
            makeSubmission({ id: 14, WADName: "Eviternity", level: "MAP05", chosen: false, playOrder: null }),
            makeSubmission({ id: 13, WADName: "Scythe", level: "MAP01", chosen: false, playOrder: null }),
        ],
        ...overrides,
    };
}

function makeOlderRound(): PreviousRound {
    return makeRound({
        id: 3,
        name: "Round 3",
        created: "2026-08-01T09:05:00.000Z",
        submissions: [makeSubmission({ id: 4, WADName: "Hell Revealed", level: "MAP07", playOrder: 1 })],
    });
}

function rowsOf(tableName: string): string[][] {
    return within(screen.getByRole("table", { name: tableName }))
        .getAllByRole("row")
        .slice(1)
        .map(row =>
            within(row)
                .getAllByRole("cell")
                .map(cell => cell.textContent ?? ""),
        );
}

beforeEach(() => {
    mocks.showAll = false;
});

describe("PreviousResults", () => {
    it("hands every finished round to the round tabs under the past rounds heading", () => {
        // when
        renderWithProviders(<PreviousResults rounds={[makeRound(), makeOlderRound()]} />);

        // then
        expect(screen.getByRole("heading", { name: "Past rounds" })).toBeInTheDocument();
        const tabs = within(screen.getByRole("region", { name: "Previous rounds" }));
        expect(tabs.getByRole("table", { name: "Results of Round 5" })).toBeInTheDocument();
        expect(tabs.getByRole("table", { name: "Results of Round 3" })).toBeInTheDocument();
    });

    it("lists the picked entries in play order with who sent them and how each one went", () => {
        // when
        renderWithProviders(<PreviousResults rounds={[makeRound()]} />);

        // then
        expect(rowsOf("Results of Round 5")).toEqual([
            [
                "1",
                "Alien Vendetta",
                "MAP20",
                "Anders",
                "download none",
                "status Rejected, playthrough none",
                "Too long for a stream",
                "Practised",
            ],
            [
                "2",
                "Sunlust",
                "MAP12",
                "anonymous",
                "download https://example.com/sunlust.zip",
                "status Completed, playthrough https://www.youtube.com/watch?v=sunlust12",
                "Beaten on UV",
                "Blind",
            ],
        ]);
    });

    it("leaves the comments empty for an entry that has no status yet", () => {
        // when
        renderWithProviders(
            <PreviousResults rounds={[makeRound({ submissions: [makeSubmission({ status: null })] })]} />,
        );

        // then
        const [row] = rowsOf("Results of Round 5");
        expect(row[5]).toBe("status none, playthrough https://www.youtube.com/watch?v=sunlust12");
        expect(row[6]).toBe("");
    });

    it("says when no entry of a round was picked", () => {
        // when
        renderWithProviders(
            <PreviousResults rounds={[makeRound({ submissions: [makeSubmission({ chosen: false })] })]} />,
        );

        // then
        expect(screen.getByText("No entries were picked in this round")).toBeInTheDocument();
    });

    it("keeps the entries that were not picked out of sight until every submission is asked for", () => {
        // when
        renderWithProviders(<PreviousResults rounds={[makeRound()]} />);

        // then
        expect(
            screen.queryByRole("table", { name: "Submissions to Round 5 that weren't picked" }),
        ).not.toBeInTheDocument();
    });

    it("lists the entries that were not picked once every submission is asked for", () => {
        // given
        mocks.showAll = true;

        // when
        renderWithProviders(<PreviousResults rounds={[makeRound()]} />);

        // then
        expect(screen.getByRole("heading", { name: "Submissions that weren't picked" })).toBeInTheDocument();
        expect(rowsOf("Submissions to Round 5 that weren't picked")).toEqual([
            ["1", "Scythe", "MAP01"],
            ["2", "Eviternity", "MAP05"],
        ]);
    });

    it("says when every entry of a round was picked", () => {
        // given
        mocks.showAll = true;

        // when
        renderWithProviders(<PreviousResults rounds={[makeRound({ submissions: [makeSubmission()] })]} />);

        // then
        expect(screen.getByText("Every submission in this round was picked")).toBeInTheDocument();
    });
});
