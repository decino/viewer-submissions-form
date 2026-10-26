import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Panel } from "../../components/Panel/Panel";
import { splitLatestRound } from "../../domain/round/results";
import { useCurrentRound, usePreviousRounds } from "../../hooks/queries/round";
import { usePageTitle } from "../../hooks/usePageTitle";
import { PreviousResults } from "./PreviousResults";

export function PastRoundsPage() {
    usePageTitle("Past rounds");
    const current = useCurrentRound();
    const { rounds, loading, error } = usePreviousRounds();

    if (loading || current.loading) {
        return <div className="loading">Loading the past rounds...</div>;
    }

    if (error) {
        return <ErrorBanner message={error} />;
    }

    const shown = current.round || current.error ? rounds : splitLatestRound(rounds).older;

    if (shown.length === 0) {
        return (
            <Panel title="Past rounds">
                <p className="empty-state">
                    {rounds.length === 0
                        ? "No round has finished yet."
                        : "The latest round is on This round. Older rounds show up here."}
                </p>
            </Panel>
        );
    }

    return <PreviousResults rounds={shown} />;
}
