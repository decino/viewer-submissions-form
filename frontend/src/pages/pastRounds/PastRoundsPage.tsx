import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Panel } from "../../components/Panel/Panel";
import { usePreviousRounds } from "../../hooks/queries/round";
import { usePageTitle } from "../../hooks/usePageTitle";
import { PreviousResults } from "./PreviousResults";

export function PastRoundsPage() {
    usePageTitle("Past rounds");
    const { rounds, loading, error } = usePreviousRounds();

    if (loading) {
        return <div className="loading">Loading the past rounds...</div>;
    }

    if (error) {
        return <ErrorBanner message={error} />;
    }

    if (rounds.length === 0) {
        return (
            <Panel title="Past rounds">
                <p className="empty-state">No round has finished yet.</p>
            </Panel>
        );
    }

    return <PreviousResults rounds={rounds} />;
}
