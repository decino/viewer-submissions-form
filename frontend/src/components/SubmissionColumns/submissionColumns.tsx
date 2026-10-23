import { ClampedText } from "../ClampedText/ClampedText";
import type { DataTableColumn } from "../DataTable/DataTable";
import { SubmissionStatusBadge } from "../SubmissionStatusBadge/SubmissionStatusBadge";
import { submitterLabel } from "../../domain/submission/labels";
import type { PublicSubmission } from "../../types/api";

type SubmissionColumn = DataTableColumn<PublicSubmission>;

export const numberColumn: SubmissionColumn = {
    key: "number",
    header: "No.",
    render: (_submission, index) => index + 1,
};

export const playOrderColumn: SubmissionColumn = {
    key: "playOrder",
    header: "Play order",
    render: (_submission, index) => index + 1,
};

export const wadColumn: SubmissionColumn = { key: "wad", header: "WAD", render: submission => submission.WADName };

export const levelColumn: SubmissionColumn = { key: "level", header: "Level", render: submission => submission.level };

export const submitterColumn: SubmissionColumn = {
    key: "submitter",
    header: "Submitter",
    render: submission => submitterLabel(submission.authorName),
};

export const statusColumn: SubmissionColumn = {
    key: "status",
    header: "Status",
    render: submission => <SubmissionStatusBadge status={submission.status} youtubeLink={submission.youtubeLink} />,
};

export const commentsColumn: SubmissionColumn = {
    key: "comments",
    header: "Comments",
    render: submission => <ClampedText text={submission.status?.additionalInfo ?? null} />,
};

export const formatColumn: SubmissionColumn = {
    key: "format",
    header: "Format",
    render: submission => submission.recordedFormat,
};
