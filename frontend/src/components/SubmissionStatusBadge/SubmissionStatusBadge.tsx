import { statusTone } from "../../domain/submission/labels";
import type { SubmissionStatus } from "../../types/api";
import { Badge } from "../Badge/Badge";
import styles from "./SubmissionStatusBadge.module.css";

interface SubmissionStatusBadgeProps {
    status: SubmissionStatus | null;
    youtubeLink: string | null;
}

export function SubmissionStatusBadge({ status, youtubeLink }: SubmissionStatusBadgeProps) {
    if (!status) {
        return "N/A";
    }

    const badge = <Badge tone={statusTone(status.status)}>{status.status}</Badge>;

    if (!youtubeLink) {
        return badge;
    }

    return (
        <a href={youtubeLink} target="_blank" rel="noreferrer" title="Watch the playthrough" className={styles.link}>
            {badge}
        </a>
    );
}
