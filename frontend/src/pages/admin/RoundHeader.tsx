import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Hud, HudCell } from "../../components/Hud/Hud";
import { Panel } from "../../components/Panel/Panel";
import { formatDeadline } from "../../domain/round/deadline";
import {
    confirmedSubmissions,
    countMapAuthors,
    mostRequestedWad,
    unverifiedSubmissions,
    verifiedSubmissions,
} from "../../domain/submission/admin";
import { useRoundActions } from "../../hooks/useRoundActions";
import type { AdminRound } from "../../types/api";
import styles from "./RoundHeader.module.css";

type RoundHeaderProps = {
    round: AdminRound;
    onEndRound: () => void;
};

function roundStatus(round: AdminRound): string {
    if (round.paused) {
        return "Round is paused, nobody can submit";
    }

    if (round.endDate) {
        return `Round is active until the ${formatDeadline(round.endDate)}`;
    }

    return "Round is active";
}

export function RoundHeader({ round, onEndRound }: RoundHeaderProps) {
    const actions = useRoundActions(round);

    const confirmed = confirmedSubmissions(round);
    const topWad = mostRequestedWad(verifiedSubmissions(round));
    const pauseLabel = round.paused ? "Resume round" : "Pause round";

    return (
        <Panel
            title={round.name}
            aria-label="Current round"
            actions={
                <span className={round.paused ? styles.paused : styles.open}>
                    <span className={styles.dot} aria-hidden="true" />
                    {roundStatus(round)}
                </span>
            }
            className={styles.panel}
        >
            <div className={styles.body}>
                <Hud aria-label="Round summary" className={styles.hud}>
                    <HudCell label="Entries" value={confirmed.length} />
                    <HudCell label="Made by the sender" value={countMapAuthors(confirmed)} tone="gold" />
                    <HudCell label="To verify" value={unverifiedSubmissions(round).length} />
                    <HudCell
                        label={topWad ? `Most sent, ${topWad.percentage}%` : "Most sent"}
                        value={topWad ? topWad.name : "N/A"}
                        tone="gold"
                        size="small"
                    />
                </Hud>

                <div className={styles.actions}>
                    <Button type="button" variant="primary" className={styles.end} onClick={onEndRound}>
                        End round
                    </Button>
                    <div className={styles.row}>
                        <Button type="button" onClick={() => actions.setConfirming("pause")}>
                            {pauseLabel}
                        </Button>
                        <Button type="button" variant="danger" onClick={() => actions.setConfirming("delete")}>
                            Delete round
                        </Button>
                    </div>
                </div>
            </div>

            <ErrorBanner message={actions.error} />

            <ConfirmDialog
                open={actions.confirming === "pause"}
                title={pauseLabel}
                body={
                    round.paused
                        ? "Resuming the round lets people submit entries again."
                        : "Pausing the round stops anyone from submitting entries until you resume it."
                }
                confirmLabel={pauseLabel}
                busy={actions.pausing}
                onConfirm={actions.togglePause}
                onCancel={() => actions.setConfirming(null)}
            />

            <ConfirmDialog
                open={actions.confirming === "delete"}
                title="Delete round"
                body="Delete this round? All of its submissions are removed."
                confirmLabel="Delete round"
                destructive
                busy={actions.deleting}
                onConfirm={actions.deleteRound}
                onCancel={() => actions.setConfirming(null)}
            />
        </Panel>
    );
}
