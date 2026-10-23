import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "../DataTable/DataTable";
import { renderWithProviders } from "../../test-utils/render";
import type { PublicSubmission, SubmissionStatus } from "../../types/api";
import {
    commentsColumn,
    formatColumn,
    levelColumn,
    numberColumn,
    playOrderColumn,
    statusColumn,
    submitterColumn,
    wadColumn,
} from "./submissionColumns";

interface FakeStatusBadgeProps {
    status: SubmissionStatus | null;
    youtubeLink: string | null;
}

vi.mock("../SubmissionStatusBadge/SubmissionStatusBadge", () => ({
    SubmissionStatusBadge: ({ status, youtubeLink }: FakeStatusBadgeProps) => (
        <span>{`${status?.status ?? "No status"} ${youtubeLink ?? "not watched"}`}</span>
    ),
}));

function makeSubmission(overrides: Partial<PublicSubmission> = {}): PublicSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: "doomguy",
        submissionRoundId: 4,
        playOrder: 1,
        youtubeLink: null,
        status: { status: "Completed", additionalInfo: "Beat it on UV", submissionId: 7 },
        chosen: true,
        recordedFormat: "Practised",
        downloadUrl: null,
        ...overrides,
    };
}

function cells(rows: PublicSubmission[]): string[][] {
    renderWithProviders(
        <DataTable
            label="Entries"
            rows={rows}
            columns={[
                numberColumn,
                playOrderColumn,
                wadColumn,
                levelColumn,
                submitterColumn,
                statusColumn,
                commentsColumn,
                formatColumn,
            ]}
            rowKey={row => row.id}
            emptyMessage="none"
        />,
    );

    return within(screen.getByRole("table", { name: "Entries" }))
        .getAllByRole("row")
        .slice(1)
        .map(row =>
            within(row)
                .getAllByRole("cell")
                .map(cell => cell.textContent ?? ""),
        );
}

describe("submission columns", () => {
    it("shows the details every submission table shares", () => {
        // when
        const rows = cells([makeSubmission({ youtubeLink: "https://youtu.be/abc" })]);

        // then
        expect(rows[0]).toEqual([
            "1",
            "1",
            "Sunlust",
            "MAP12",
            "doomguy",
            "Completed https://youtu.be/abc",
            "Beat it on UV",
            "Practised",
        ]);
    });

    it("numbers the rows from one in the order they are listed", () => {
        // when
        const rows = cells([makeSubmission({ id: 1 }), makeSubmission({ id: 2 })]);

        // then
        expect(rows.map(row => row.slice(0, 2))).toEqual([
            ["1", "1"],
            ["2", "2"],
        ]);
    });

    it("calls a submitter without a name anonymous and leaves the comments empty without a status", () => {
        // when
        const rows = cells([makeSubmission({ authorName: null, status: null })]);

        // then
        expect(rows[0][4]).toBe("anonymous");
        expect(rows[0][6]).toBe("");
    });
});
