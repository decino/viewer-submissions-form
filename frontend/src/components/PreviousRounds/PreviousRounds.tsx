import { useState } from "react";
import Card, { CardBody, CardHeader } from "../Card/Card";
import type { SubmissionModel, SubmissionRoundModel } from "../../types";
import styles from "./PreviousRounds.module.scss";

interface PreviousRoundsProps {
    rounds: SubmissionRoundModel[];
}

function formatDate(timestamp?: number): string {
    if (!timestamp) {
        return "N/A";
    }
    return new Date(timestamp).toLocaleString();
}

interface RoundTabContentProps {
    round: SubmissionRoundModel;
}

function RoundTabContent({ round }: RoundTabContentProps) {
    const [showAllSubmissions, setShowAllSubmissions] = useState(false);

    const resultsSubmissions = round.submissions
        .filter(sub => sub.isChosen)
        .sort((a, b) => (a.playOrder ?? 0) - (b.playOrder ?? 0));

    const allSubmissions = round.submissions.filter(sub => !sub.isChosen).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

    const getStatusClass = (status?: string) => {
        switch (status) {
            case "Rejected":
                return "text-danger";
            case "In Progress":
                return "text-info";
            case "Completed":
                return "text-success";
            case "Queued":
                return "text-warning";
            default:
                return "";
        }
    };

    const renderTable = (submissions: SubmissionModel[], isResults: boolean) => (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>{isResults ? "Play order" : "No."}</th>
                    <th>WAD</th>
                    <th>Level</th>
                    {isResults && <th>Submitter name</th>}
                    <th>Download</th>
                    {isResults && (
                        <>
                            <th>Status</th>
                            <th>Comments</th>
                        </>
                    )}
                    {isResults && <th>Format</th>}
                </tr>
            </thead>
            <tbody>
                {submissions.map((submission, idx) => (
                    <tr key={submission.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{submission.wadName}</td>
                        <td>{submission.wadLevel}</td>
                        {isResults && <td>{submission.submitterName ?? "anonymous"}</td>}
                        <td>
                            {submission.downloadToken ? (
                                <a
                                    href={`/rest/submissions/${submission.id}/download/${submission.downloadToken}`}
                                    className={styles.downloadButton}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Download
                                </a>
                            ) : (
                                "N/A"
                            )}
                        </td>
                        {isResults && (
                            <>
                                <td className={getStatusClass(submission.status?.status)}>
                                    {submission.youtubeLink && submission.status?.status ? (
                                        <a
                                            href={submission.youtubeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.statusLink}
                                            title="Watch playthrough"
                                        >
                                            {submission.status.status}
                                        </a>
                                    ) : (
                                        (submission.status?.status ?? "")
                                    )}
                                </td>
                                <td>{submission.status?.additionalInfo ?? ""}</td>
                            </>
                        )}
                        {isResults && <td>{submission.recordedFormat}</td>}
                    </tr>
                ))}
                {submissions.length === 0 && (
                    <tr>
                        <td colSpan={isResults ? 8 : 5} className={styles.noData}>
                            No submissions
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    return (
        <div className={styles.tabContent}>
            <div className={styles.controls}>
                <label className={styles.switchLabel}>
                    <input
                        type="checkbox"
                        checked={showAllSubmissions}
                        onChange={e => setShowAllSubmissions(e.target.checked)}
                        className={styles.switch}
                    />
                    <span className={styles.switchSlider}></span>
                    <span className={styles.switchText}>All submissions</span>
                </label>
            </div>
            <p className={styles.roundDate}>Start: {formatDate(round.endDate)}</p>
            <div className={styles.tableWrapper}>
                {!showAllSubmissions ? (
                    <>
                        <h4 className={styles.tableTitle}>Selected Maps</h4>
                        {renderTable(resultsSubmissions, true)}
                    </>
                ) : (
                    <>
                        <h4 className={styles.tableTitle}>All Submissions</h4>
                        {renderTable(allSubmissions, false)}
                    </>
                )}
            </div>
        </div>
    );
}

export default function PreviousRounds({ rounds }: PreviousRoundsProps) {
    const [activeTab, setActiveTab] = useState(0);

    if (rounds.length === 0) {
        return null;
    }

    return (
        <div className={styles.section}>
            <Card borderPrimary>
                <CardHeader>
                    <div className={styles.tabsContainer}>
                        <div className={styles.tabs}>
                            {rounds.map((round, index) => (
                                <button
                                    key={round.id}
                                    className={`${styles.tab} ${activeTab === index ? styles.active : ""}`}
                                    onClick={() => setActiveTab(index)}
                                    type="button"
                                >
                                    {round.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardBody style={{ overflowX: "auto" }}>
                    {rounds.map((round, index) => (
                        <div
                            key={round.id}
                            className={`${styles.tabPanel} ${activeTab === index ? styles.active : ""}`}
                        >
                            {activeTab === index && <RoundTabContent round={round} />}
                        </div>
                    ))}
                </CardBody>
            </Card>
        </div>
    );
}
