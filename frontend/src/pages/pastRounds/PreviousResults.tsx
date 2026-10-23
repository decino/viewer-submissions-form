import { DataTable, type DataTableColumn } from "../../components/DataTable/DataTable";
import { DownloadLink } from "../../components/DownloadLink/DownloadLink";
import { Panel } from "../../components/Panel/Panel";
import { RoundTabs } from "../../components/RoundTabs/RoundTabs";
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
import { chosenInPlayOrder, notChosen } from "../../domain/round/results";
import type { PreviousRound, PublicSubmission } from "../../types/api";
import styles from "./PreviousResults.module.css";

interface PreviousResultsProps {
    rounds: readonly PreviousRound[];
}

const RESULT_COLUMNS: readonly DataTableColumn<PublicSubmission>[] = [
    playOrderColumn,
    wadColumn,
    levelColumn,
    submitterColumn,
    { key: "download", header: "Download", render: submission => <DownloadLink url={submission.downloadUrl} /> },
    statusColumn,
    commentsColumn,
    formatColumn,
];

const OTHER_COLUMNS: readonly DataTableColumn<PublicSubmission>[] = [numberColumn, wadColumn, levelColumn];

export function PreviousResults({ rounds }: PreviousResultsProps) {
    return (
        <Panel title="Past rounds">
            <RoundTabs rounds={rounds} idPrefix="previous-results" ariaLabel="Previous rounds">
                {(round, showAll) => (
                    <>
                        <DataTable
                            label={`Results of ${round.name}`}
                            rows={chosenInPlayOrder(round.submissions)}
                            columns={RESULT_COLUMNS}
                            rowKey={submission => submission.id}
                            emptyMessage="No entries were picked in this round"
                        />

                        {showAll && (
                            <section className={styles.others}>
                                <h3 className={styles.othersTitle}>Submissions that weren't picked</h3>
                                <DataTable
                                    label={`Submissions to ${round.name} that weren't picked`}
                                    rows={notChosen(round.submissions)}
                                    columns={OTHER_COLUMNS}
                                    rowKey={submission => submission.id}
                                    emptyMessage="Every submission in this round was picked"
                                />
                            </section>
                        )}
                    </>
                )}
            </RoundTabs>
        </Panel>
    );
}
