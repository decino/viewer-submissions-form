import { useEffect, useState } from "react";
import { Card, CardBody, CardFooter, CardHeader, PreviousRounds, SubmissionForm, SubmissionsList } from "./components";
import * as submissionApi from "./utils/api/submissionApi";
import type { HomeViewModel, SubmissionRoundModel } from "./types";
import styles from "./App.module.scss";

function getEndDate(round: SubmissionRoundModel): string {
    if (!round.endDate) {
        return "";
    }
    const date = new Date(round.endDate);
    return date.toLocaleString();
}

function hasDateElapsed(round: SubmissionRoundModel): boolean {
    if (!round.endDate) {
        return false;
    }
    return Date.now() > round.endDate;
}

export default function App() {
    const [data, setData] = useState<HomeViewModel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        submissionApi
            .getHomeData()
            .then(setData)
            .catch(err => console.error("Failed to fetch home data:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading || !data) {
        return (
            <div className="container">
                <div className={styles.loading}>
                    <span className={styles.spinner} role="status"></span>
                </div>
            </div>
        );
    }

    const hasNoRounds = data.currentActiveRound === null && data.previousRounds.length === 0;
    const hasActiveRound = data.currentActiveRound !== null;
    const isPaused = data.currentActiveRound?.paused || false;

    return (
        <div className="container">
            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <h1>Viewer Map Submissions</h1>
                    <p className={styles.subtitle}>Submit your Doom maps for review</p>
                </div>

                {hasNoRounds && (
                    <Card borderPrimary>
                        <CardBody>
                            <h5>No submission rounds have taken place.</h5>
                            <p>Please come back when an announcement has been made!</p>
                        </CardBody>
                    </Card>
                )}

                {hasActiveRound && data.currentActiveRound && (
                    <div className={styles.grid}>
                        {/* Submission Form */}
                        <div className={styles.column}>
                            <Card borderPrimary>
                                <CardHeader>{data.currentActiveRound.name}</CardHeader>
                                <CardBody style={{ position: "relative" }}>
                                    {isPaused && (
                                        <div className={styles.overlay}>
                                            <h2>Submissions are paused.</h2>
                                        </div>
                                    )}
                                    <SubmissionForm
                                        doomEngines={data.doomEngines}
                                        gzActions={data.gzActions}
                                        allowedUploadExtensions={data.allowedUploadExtensions}
                                        isPaused={isPaused}
                                    />
                                </CardBody>
                                <CardFooter>
                                    <p>
                                        Please contact <a href="mailto:submissions@decino.nl">submissions@decino.nl</a>{" "}
                                        if you have any issues.
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Current Submissions */}
                        <div className={styles.column}>
                            <Card borderPrimary>
                                <CardHeader>Current submissions</CardHeader>
                                <CardBody style={{ overflowY: "auto" }}>
                                    <SubmissionsList submissions={data.currentActiveRound.submissions} isLive={true} />
                                </CardBody>
                                {data.currentActiveRound.endDate && (
                                    <CardFooter>
                                        <p>
                                            <span
                                                className={`${styles.badge} ${
                                                    hasDateElapsed(data.currentActiveRound)
                                                        ? styles.danger
                                                        : styles.info
                                                }`}
                                            >
                                                Submission deadline: {getEndDate(data.currentActiveRound)}
                                            </span>
                                        </p>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* Previous Rounds */}
                <PreviousRounds rounds={data.previousRounds} />
            </main>
        </div>
    );
}
