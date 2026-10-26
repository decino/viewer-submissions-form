import { Badge } from "../../components/Badge/Badge";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Hud, HudCell } from "../../components/Hud/Hud";
import { Panel } from "../../components/Panel/Panel";
import { RoundStatsCharts } from "../../components/RoundStatsCharts/RoundStatsCharts";
import { useCurrentRound } from "../../hooks/queries/round";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useRealtimeConnected } from "../../hooks/useRealtimeConnected";
import { DeadlineCells } from "./DeadlineCells";
import styles from "./HomePage.module.css";
import { NoOpenRound } from "./NoOpenRound";
import { SubmitForm } from "./SubmitForm";

export function HomePage() {
    usePageTitle();
    const { round, loading, error } = useCurrentRound();
    const live = useRealtimeConnected();

    if (loading) {
        return <div className="loading">Loading the current round...</div>;
    }

    if (error) {
        return <ErrorBanner message={error} />;
    }

    if (!round) {
        return <NoOpenRound />;
    }

    return (
        <div className={styles.page}>
            <Hud aria-label="Round status">
                <HudCell label="This round" value={<h1 className={styles.roundName}>{round.name}</h1>} wide />
                <HudCell label="Entries" value={round.submissions.length} />
                <HudCell
                    label="Status"
                    value={round.paused ? "Paused" : "Open"}
                    tone={round.paused ? "red" : "green"}
                    size="small"
                />
                {round.endDate ? (
                    <DeadlineCells endDate={round.endDate} />
                ) : (
                    <HudCell label="Deadline" value="None set" tone="gold" size="small" />
                )}
            </Hud>

            <div className={styles.columns}>
                <div className={styles.main}>
                    <SubmitForm paused={round.paused} />
                </div>

                <aside className={styles.aside} aria-label="This round so far">
                    <Panel
                        title="In this round"
                        className={styles.listPanel}
                        actions={
                            <Badge tone={live ? "success" : "muted"}>
                                <span className={live ? styles.lampLive : styles.lamp} aria-hidden="true" />
                                {live ? "Live" : "Not live"}
                            </Badge>
                        }
                    >
                        {round.submissions.length === 0 ? (
                            <p className="empty-state">
                                No verified submissions yet. Entries show up here as soon as they're verified.
                            </p>
                        ) : (
                            <div className={styles.list}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th scope="col">No.</th>
                                            <th scope="col">WAD</th>
                                            <th scope="col">Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {round.submissions.map((submission, index) => (
                                            <tr key={submission.id}>
                                                <td className={styles.number}>{index + 1}</td>
                                                <td>{submission.WADName}</td>
                                                <td className={styles.level}>{submission.level}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>

                    <Panel title="Round statistics">
                        <RoundStatsCharts roundId={round.id} />
                    </Panel>
                </aside>
            </div>

            <p className={styles.contact}>
                Questions about your submission? Email <a href="mailto:submissions@decino.nl">submissions@decino.nl</a>
            </p>
        </div>
    );
}
