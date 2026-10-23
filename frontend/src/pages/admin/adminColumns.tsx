import { ClampedText } from "../../components/ClampedText/ClampedText";
import type { DataTableColumn } from "../../components/DataTable/DataTable";
import { DownloadLink } from "../../components/DownloadLink/DownloadLink";
import {
    commentsColumn,
    formatColumn,
    levelColumn,
    numberColumn,
    playOrderColumn,
    statusColumn,
    submitterColumn,
    wadColumn,
} from "../../components/SubmissionColumns/submissionColumns";
import { adminDownloadUrl } from "../../domain/submission/admin";
import { engineLabel, gzActionLabels, yesNo } from "../../domain/submission/labels";
import type { AdminSubmission } from "../../types/api";

type AdminColumn = DataTableColumn<AdminSubmission>;

const DETAIL_KEYS: ReadonlySet<string> = new Set([
    "id",
    "submitter",
    "engine",
    "gzActions",
    "author",
    "distributable",
    "download",
]);

const idColumn: AdminColumn = { key: "id", header: "ID", render: submission => submission.id };
const engineColumn: AdminColumn = {
    key: "engine",
    header: "Engine",
    render: submission => engineLabel(submission.engine),
};
const gzActionsColumn: AdminColumn = {
    key: "gzActions",
    header: "GZ actions",
    render: submission => gzActionLabels(submission.gzDoomAction),
};
const authorColumn: AdminColumn = { key: "author", header: "Author", render: submission => yesNo(submission.author) };
const distributableColumn: AdminColumn = {
    key: "distributable",
    header: "Distributable",
    render: submission => yesNo(submission.distributable),
};
const infoColumn: AdminColumn = {
    key: "info",
    header: "Info",
    render: submission => <ClampedText text={submission.info} />,
};
const downloadColumn: AdminColumn = {
    key: "download",
    header: "Download",
    render: submission => <DownloadLink url={adminDownloadUrl(submission)} />,
};

export const SUBMISSION_COLUMNS: readonly AdminColumn[] = [
    idColumn,
    numberColumn,
    wadColumn,
    levelColumn,
    submitterColumn,
    engineColumn,
    gzActionsColumn,
    authorColumn,
    distributableColumn,
    infoColumn,
    downloadColumn,
    formatColumn,
];

export const RESULT_COLUMNS: readonly AdminColumn[] = [
    idColumn,
    playOrderColumn,
    wadColumn,
    levelColumn,
    submitterColumn,
    engineColumn,
    gzActionsColumn,
    authorColumn,
    distributableColumn,
    infoColumn,
    downloadColumn,
    statusColumn,
    commentsColumn,
    formatColumn,
];

export function withDetailsHidden(columns: readonly AdminColumn[]): AdminColumn[] {
    return columns.map(column => (DETAIL_KEYS.has(column.key) ? { ...column, hidden: true } : column));
}

export function withoutDetails(columns: readonly AdminColumn[]): AdminColumn[] {
    return columns.filter(column => !DETAIL_KEYS.has(column.key));
}
