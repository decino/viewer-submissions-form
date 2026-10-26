import { type ReactNode, useState } from "react";
import { formatRoundStart } from "../../domain/round/deadline";
import { roundsOldestFirst } from "../../domain/round/results";
import { TabStrip } from "../Tabs/TabStrip";
import { tabId, tabPanelId } from "../Tabs/tabIds";
import { ToggleSwitch } from "../ToggleSwitch/ToggleSwitch";
import styles from "./RoundTabs.module.css";

interface TabbedRound {
    id: number;
    name: string;
    created: string;
}

interface RoundTabsProps<R extends TabbedRound> {
    rounds: readonly R[];
    idPrefix: string;
    ariaLabel: string;
    children: (round: R, showAll: boolean) => ReactNode;
}

export function RoundTabs<R extends TabbedRound>({ rounds, idPrefix, ariaLabel, children }: RoundTabsProps<R>) {
    const [pickedTab, setPickedTab] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const ordered = roundsOldestFirst(rounds);
    const round = ordered.find(candidate => String(candidate.id) === pickedTab) ?? ordered[ordered.length - 1];

    if (!round) {
        return null;
    }

    const active = String(round.id);

    return (
        <div className={styles.tabs}>
            <TabStrip
                tabs={ordered.map(candidate => ({ id: String(candidate.id), label: candidate.name }))}
                active={active}
                onSelect={setPickedTab}
                idPrefix={idPrefix}
                ariaLabel={ariaLabel}
            />

            <div
                role="tabpanel"
                id={tabPanelId(idPrefix, active)}
                aria-labelledby={tabId(idPrefix, active)}
                className={styles.panel}
            >
                <div className={styles.meta}>
                    <p className={styles.started}>Started on {formatRoundStart(round.created)}</p>
                    <div className={styles.toggle}>
                        <ToggleSwitch enabled={showAll} onChange={setShowAll} label="Show all submissions" />
                    </div>
                </div>

                {children(round, showAll)}
            </div>
        </div>
    );
}
