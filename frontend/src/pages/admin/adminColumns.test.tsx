import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableColumn } from "../../components/DataTable/DataTable";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminSubmission, SubmissionStatus } from "../../types/api";
import { RESULT_COLUMNS, SUBMISSION_COLUMNS, withDetailsHidden, withoutDetails } from "./adminColumns";

interface FakeStatusBadgeProps {
    status: SubmissionStatus | null;
    youtubeLink: string | null;
}

vi.mock("../../components/DownloadLink/DownloadLink", () => ({
    DownloadLink: ({ url }: { url: string | null }) => (
        <span>{url ? `Download from ${url}` : "Nothing to download"}</span>
    ),
}));
vi.mock("../../components/SubmissionStatusBadge/SubmissionStatusBadge", () => ({
    SubmissionStatusBadge: ({ status, youtubeLink }: FakeStatusBadgeProps) => (
        <span>{`${status?.status ?? "No status"} ${youtubeLink ? `watched at ${youtubeLink}` : "not watched"}`}</span>
    ),
}));

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
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
        status: { status: "Queued", additionalInfo: null, submissionId: 7 },
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: "dsda-doom",
        WAD: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        engine: 11,
        gzDoomAction: null,
        author: true,
        distributable: false,
        info: "Made in a week",
        customWad: null,
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function renderTable(rows: AdminSubmission[], columns: readonly DataTableColumn<AdminSubmission>[]) {
    renderWithProviders(
        <DataTable label="Entries" rows={rows} columns={columns} rowKey={row => row.id} emptyMessage="none" />,
    );
}

function headers(): string[] {
    return screen.getAllByRole("columnheader").map(header => header.textContent ?? "");
}

function cells(rowIndex: number): string[] {
    const rows = within(screen.getByRole("table", { name: "Entries" }))
        .getAllByRole("row")
        .slice(1);
    return within(rows[rowIndex])
        .getAllByRole("cell")
        .map(cell => cell.textContent ?? "");
}

describe("SUBMISSION_COLUMNS", () => {
    it("shows every detail of an entry under its own heading", () => {
        // when
        renderTable([makeSubmission()], SUBMISSION_COLUMNS);

        // then
        expect(headers()).toEqual([
            "ID",
            "No.",
            "WAD",
            "Level",
            "Submitter",
            "Engine",
            "GZ actions",
            "Author",
            "Distributable",
            "Info",
            "Download",
            "Format",
        ]);
        expect(cells(0)).toEqual([
            "7",
            "1",
            "Sunlust",
            "MAP12",
            "doomguy",
            "MBF",
            "None",
            "Yes",
            "No",
            "Made in a week",
            "Download from https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
            "Practised",
        ]);
    });

    it("numbers the entries from one in the order they are listed", () => {
        // when
        renderTable([makeSubmission({ id: 9 }), makeSubmission({ id: 3 })], SUBMISSION_COLUMNS);

        // then
        expect(cells(1).slice(0, 2)).toEqual(["3", "2"]);
    });

    it("calls a submitter without a name anonymous", () => {
        // when
        renderTable([makeSubmission({ authorName: null })], SUBMISSION_COLUMNS);

        // then
        expect(cells(0)[4]).toBe("anonymous");
    });

    it("names the GZDoom actions the submitter allowed", () => {
        // when
        renderTable([makeSubmission({ engine: -1, gzDoomAction: [0, 2] })], SUBMISSION_COLUMNS);

        // then
        expect(cells(0).slice(5, 7)).toEqual(["GZDoom/UZDoom", "Jump, Mouse look"]);
    });

    it("offers an uploaded WAD from the site's own download address", () => {
        // when
        renderTable([makeSubmission({ customWad: "sunlust.zip", WAD: null })], SUBMISSION_COLUMNS);

        // then
        expect(cells(0)[10]).toBe("Download from /rest/submission/download/4/7");
    });

    it("has nothing to offer when the entry has no WAD at all", () => {
        // when
        renderTable([makeSubmission({ customWad: null, WAD: null })], SUBMISSION_COLUMNS);

        // then
        expect(cells(0)[10]).toBe("Nothing to download");
    });

    it("shows the submitter's info as text rather than markup", () => {
        // when
        renderTable([makeSubmission({ info: "<b>bold</b>" })], SUBMISSION_COLUMNS);

        // then
        expect(screen.getByText("<b>bold</b>")).toBeInTheDocument();
    });
});

describe("RESULT_COLUMNS", () => {
    it("adds the play order, status and comments to the entry's details", () => {
        // when
        renderTable(
            [makeSubmission({ status: { status: "Rejected", additionalInfo: "Crashes on load", submissionId: 7 } })],
            RESULT_COLUMNS,
        );

        // then
        expect(headers()).toEqual([
            "ID",
            "Play order",
            "WAD",
            "Level",
            "Submitter",
            "Engine",
            "GZ actions",
            "Author",
            "Distributable",
            "Info",
            "Download",
            "Status",
            "Comments",
            "Format",
        ]);
        expect(cells(0).slice(11)).toEqual(["Rejected not watched", "Crashes on load", "Practised"]);
    });

    it("hands the status the playthrough once it is on YouTube", () => {
        // when
        renderTable([makeSubmission({ youtubeLink: "https://www.youtube.com/watch?v=t7BW5ZiTmrE" })], RESULT_COLUMNS);

        // then
        expect(cells(0)[11]).toBe("Queued watched at https://www.youtube.com/watch?v=t7BW5ZiTmrE");
    });

    it("leaves the comments empty for an entry that has no status yet", () => {
        // when
        renderTable([makeSubmission({ status: null })], RESULT_COLUMNS);

        // then
        expect(cells(0).slice(11, 13)).toEqual(["No status not watched", ""]);
    });
});

describe("withDetailsHidden", () => {
    it("hides the detail columns and keeps the rest showing", () => {
        // when
        renderTable([makeSubmission()], withDetailsHidden(RESULT_COLUMNS));

        // then
        expect(headers()).toEqual(["Play order", "WAD", "Level", "Info", "Status", "Comments", "Format"]);
    });

    it("leaves the columns it was given untouched", () => {
        // when
        withDetailsHidden(SUBMISSION_COLUMNS);

        // then
        expect(SUBMISSION_COLUMNS.some(column => column.hidden)).toBe(false);
    });
});

describe("withoutDetails", () => {
    it("drops the detail columns so they cannot be switched back on", () => {
        // when
        renderTable([makeSubmission()], withoutDetails(RESULT_COLUMNS));

        // then
        expect(headers()).toEqual(["Play order", "WAD", "Level", "Info", "Status", "Comments", "Format"]);
        expect(withoutDetails(RESULT_COLUMNS).map(column => column.key)).not.toContain("submitter");
    });
});
