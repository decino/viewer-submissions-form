import { useState } from "react";
import { Badge } from "../../components/Badge/Badge";
import { Panel } from "../../components/Panel/Panel";
import { ToggleSwitch } from "../../components/ToggleSwitch/ToggleSwitch";
import { formatRoundStart } from "../../domain/round/deadline";
import { isBeingPlayed } from "../../domain/round/results";
import type { PreviousRound } from "../../types/api";
import { RoundResultTables } from "../pastRounds/PreviousResults";
import styles from "./HomePage.module.css";

type LatestRoundProps = {
    round: PreviousRound;
};

export function LatestRound({ round }: LatestRoundProps) {
    const [showAll, setShowAll] = useState(false);
    const playing = isBeingPlayed(round.submissions);

    return (
        <Panel
            title={round.name}
            aria-label={round.name}
            actions={<Badge tone={playing ? "info" : "muted"}>{playing ? "Now playing" : "All played"}</Badge>}
        >
            <div className={styles.results}>
                <div className={styles.meta}>
                    <p className={styles.started}>Started on {formatRoundStart(round.created)}</p>
                    <div className={styles.showAll}>
                        <ToggleSwitch label="Show all submissions" enabled={showAll} onChange={setShowAll} />
                    </div>
                </div>
                <RoundResultTables round={round} showAll={showAll} />
            </div>
        </Panel>
    );
}
