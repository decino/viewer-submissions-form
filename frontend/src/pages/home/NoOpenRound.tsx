import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Panel } from "../../components/Panel/Panel";
import { splitLatestRound } from "../../domain/round/results";
import { usePreviousRounds } from "../../hooks/queries/round";
import { LatestRound } from "./LatestRound";
import styles from "./HomePage.module.css";

export function NoOpenRound() {
    const { rounds, loading, error } = usePreviousRounds();

    if (loading) {
        return <div className="loading">Loading the latest round...</div>;
    }

    const { latest } = splitLatestRound(rounds);

    return (
        <div className={styles.page}>
            <Panel title="No round is open">
                <p>
                    {latest || error
                        ? "WADs can't be submitted right now. Submissions open again when decino announces the next round."
                        : "No submission rounds have taken place yet. Come back when one is announced."}
                </p>
            </Panel>

            <ErrorBanner message={error} />

            {latest && <LatestRound round={latest} />}
        </div>
    );
}
