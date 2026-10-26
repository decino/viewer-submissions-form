import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Panel } from "../../components/Panel/Panel";
import { usePreviousRounds } from "../../hooks/queries/round";
import { PreviousResults } from "../pastRounds/PreviousResults";
import styles from "./HomePage.module.css";

export function NoOpenRound() {
    const { rounds, loading, error } = usePreviousRounds();

    if (loading) {
        return <div className="loading">Loading the past rounds...</div>;
    }

    return (
        <div className={styles.page}>
            <Panel title="No round is open">
                <p>
                    {rounds.length === 0 && !error
                        ? "No submission rounds have taken place yet. Come back when one is announced."
                        : "WADs can't be submitted right now. Submissions open again when decino announces the next round."}
                </p>
            </Panel>
            {error ? <ErrorBanner message={error} /> : rounds.length > 0 && <PreviousResults rounds={rounds} />}
        </div>
    );
}
