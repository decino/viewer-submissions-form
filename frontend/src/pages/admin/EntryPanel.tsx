import type { ReactNode } from "react";
import { Button } from "../../components/Button/Button";
import { DownloadLink } from "../../components/DownloadLink/DownloadLink";
import { Panel } from "../../components/Panel/Panel";
import { SubmissionStatusBadge } from "../../components/SubmissionStatusBadge/SubmissionStatusBadge";
import { formatRoundStart } from "../../domain/round/deadline";
import { adminDownloadUrl } from "../../domain/submission/admin";
import { engineLabel, gzActionLabels, submitterLabel, UZDOOM_ENGINE, yesNo } from "../../domain/submission/labels";
import type { AdminSubmission } from "../../types/api";
import styles from "./EntryPanel.module.css";

type EntryPanelProps = {
    submission: AdminSubmission;
    streaming: boolean;
    onClose: () => void;
    children: ReactNode;
};

type Fact = [label: string, value: ReactNode];

function facts(submission: AdminSubmission, streaming: boolean): Fact[] {
    const list: Fact[] = [
        ["Compatibility", engineLabel(submission.engine)],
        ["Tested on", submission.playTestEngine?.trim() || "N/A"],
        ["Format", submission.recordedFormat],
        ["Made it", yesNo(submission.author)],
        ["May share", submission.author ? yesNo(submission.distributable) : "N/A"],
        ["ID", submission.id],
    ];

    if (submission.engine === UZDOOM_ENGINE) {
        list.push(["GZDoom actions", gzActionLabels(submission.gzDoomAction)]);
    }

    if (!streaming) {
        list.push([
            "Email",
            <span className={styles.spoiler} tabIndex={0} title="Hover or focus to show the email address">
                {submission.email}
            </span>,
        ]);
    }

    return list;
}

function source(submission: AdminSubmission): { name: string; kind: string } {
    if (submission.customWad) {
        return { name: submission.customWad, kind: "Uploaded file" };
    }

    return { name: submission.WAD ?? "No file", kind: "Link" };
}

export function EntryPanel({ submission, streaming, onClose, children }: EntryPanelProps) {
    const file = source(submission);

    return (
        <Panel
            title={submission.WADName}
            aria-label={submission.WADName}
            className={styles.panel}
            actions={
                <Button type="button" size="small" aria-label="Close" onClick={onClose}>
                    {"✕"}
                </Button>
            }
        >
            <p className={styles.meta}>
                <span className={styles.level}>{submission.level}</span>
                <span>
                    sent by {submitterLabel(submission.authorName)} on {formatRoundStart(submission.created)}
                </span>
            </p>

            {submission.status && (
                <div className={styles.status}>
                    <SubmissionStatusBadge status={submission.status} youtubeLink={submission.youtubeLink} />
                    {submission.status.additionalInfo && <p>{submission.status.additionalInfo}</p>}
                </div>
            )}

            <dl className={styles.facts}>
                {facts(submission, streaming).map(([label, value]) => (
                    <div key={label} className={styles.fact}>
                        <dt className={styles.term}>{label}</dt>
                        <dd className={styles.value}>{value}</dd>
                    </div>
                ))}
            </dl>

            <div className={styles.file}>
                <div className={styles.fileText}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileKind}>{file.kind}</p>
                </div>
                <DownloadLink url={adminDownloadUrl(submission)} />
            </div>

            {submission.info && (
                <>
                    <h3 className={styles.heading}>About the level</h3>
                    <p className={styles.info}>{submission.info}</p>
                </>
            )}

            <div className={styles.actions}>{children}</div>
        </Panel>
    );
}
