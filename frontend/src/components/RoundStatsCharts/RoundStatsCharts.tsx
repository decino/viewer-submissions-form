import { useRoundStats } from "../../hooks/queries/site";
import { SplitBar } from "../SplitBar/SplitBar";
import { ErrorBanner } from "../ErrorBanner/ErrorBanner";
import styles from "./RoundStatsCharts.module.css";

interface RoundStatsChartsProps {
    roundId: number;
}

export function RoundStatsCharts({ roundId }: RoundStatsChartsProps) {
    const { stats, loading, error } = useRoundStats(roundId);

    if (error) {
        return <ErrorBanner message={error} />;
    }

    const recordFormat = stats?.recordFormat ?? { Practised: 0, Blind: 0 };
    const isAuthor = stats?.isAuthor ?? { Yes: 0, No: 0 };
    const distributable = stats?.distributable ?? { Yes: 0, No: 0 };
    const emptyMessage = loading ? "Loading the statistics..." : "No verified submissions yet";

    return (
        <div className={styles.grid}>
            <SplitBar
                title="Recorded format"
                emptyMessage={emptyMessage}
                slices={[
                    { label: "Practised", value: recordFormat.Practised, tone: "green" },
                    { label: "Blind", value: recordFormat.Blind, tone: "red" },
                ]}
            />
            <SplitBar
                title="Map author"
                emptyMessage={emptyMessage}
                slices={[
                    { label: "Yes", value: isAuthor.Yes, tone: "gold" },
                    { label: "No", value: isAuthor.No, tone: "steel" },
                ]}
            />
            <SplitBar
                title="Distributable"
                emptyMessage={emptyMessage}
                slices={[
                    { label: "Yes", value: distributable.Yes, tone: "blue" },
                    { label: "No", value: distributable.No, tone: "steel" },
                ]}
            />
        </div>
    );
}
