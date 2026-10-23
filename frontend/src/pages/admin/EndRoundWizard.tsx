import { Button } from "../../components/Button/Button";
import { DataTable, type DataTableColumn } from "../../components/DataTable/DataTable";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Modal } from "../../components/Modal/Modal";
import { Wizard } from "../../components/Wizard/Wizard";
import { submitterLabel, yesNo } from "../../domain/submission/labels";
import { END_ROUND_STEPS, type EndRoundStep, type PickedEntry, useEndRoundWizard } from "../../hooks/useEndRoundWizard";
import type { AdminRound } from "../../types/api";
import styles from "./EndRoundWizard.module.css";

interface EndRoundWizardProps {
    open: boolean;
    onClose: () => void;
    round: AdminRound;
}

type EndRoundStepsProps = {
    paused: boolean;
    wizard: ReturnType<typeof useEndRoundWizard>;
};

const STEP_LABELS: Record<EndRoundStep, string> = {
    pause: "Pause round",
    pick: "Pick winners",
    review: "Review",
};

const pickColumns: DataTableColumn<PickedEntry>[] = [
    { key: "wad", header: "WAD", render: pick => pick.entry.WADName },
    { key: "level", header: "Level", render: pick => pick.entry.level },
    { key: "submitter", header: "Submitter", render: pick => submitterLabel(pick.entry.authorName) },
    { key: "author", header: "Author", render: pick => yesNo(pick.entry.author) },
];

const reviewColumns: DataTableColumn<PickedEntry>[] = [
    { key: "number", header: "No.", render: (_pick, index) => index + 1 },
    ...pickColumns,
];

function EndRoundSteps({ paused, wizard }: EndRoundStepsProps) {
    const nothingSelected = wizard.selected.size === 0;

    return (
        <Wizard
            steps={END_ROUND_STEPS.map(step => STEP_LABELS[step])}
            current={END_ROUND_STEPS.indexOf(wizard.step)}
            onBack={wizard.back}
            onNext={wizard.next}
            nextLabel={wizard.step === "review" ? "Finish round" : "Next"}
            nextDisabled={wizard.nextDisabled}
        >
            <div className={styles.step}>
                <ErrorBanner message={wizard.error} />

                {wizard.step === "pause" && paused && (
                    <p className={styles.ready}>The round is paused, so no new entries can come in.</p>
                )}

                {wizard.step === "pause" && !paused && (
                    <div className={styles.pause}>
                        <p>Pause the round before picking winners.</p>
                        <Button type="button" variant="primary" onClick={wizard.pause} disabled={wizard.pausing}>
                            Pause round
                        </Button>
                    </div>
                )}

                {wizard.step === "pick" && (
                    <>
                        <p className={styles.hint}>
                            Draw entries at random until you have your winners. Each WAD can only be drawn once.
                        </p>
                        <div className={styles.table}>
                            <DataTable
                                label="Picked entries"
                                rows={wizard.picks}
                                columns={pickColumns}
                                rowKey={pick => pick.key}
                                emptyMessage="No entries picked yet"
                                selection="multi"
                                selectedKeys={wizard.selected}
                                onSelectionChange={wizard.select}
                                rowTone={pick => (wizard.duplicates.has(pick.entry.id) ? "danger" : undefined)}
                                toolbar={
                                    <>
                                        <Button
                                            type="button"
                                            size="small"
                                            onClick={wizard.addRandom}
                                            disabled={wizard.generating}
                                        >
                                            Add random entry
                                        </Button>
                                        <Button
                                            type="button"
                                            size="small"
                                            onClick={wizard.rerollSelected}
                                            disabled={wizard.generating || nothingSelected}
                                        >
                                            Re-roll selected
                                        </Button>
                                        <Button
                                            type="button"
                                            size="small"
                                            variant="danger"
                                            onClick={wizard.removeSelected}
                                            disabled={wizard.generating || nothingSelected}
                                        >
                                            Remove selected
                                        </Button>
                                    </>
                                }
                            />
                        </div>
                        {wizard.blocker && <p className={styles.blocker}>{wizard.blocker}</p>}
                    </>
                )}

                {wizard.step === "review" && (
                    <>
                        <p className={styles.hint}>
                            The winners are played in this order. Finish round saves them and ends the round.
                        </p>
                        <div className={styles.table}>
                            <DataTable
                                label="Winners in play order"
                                rows={wizard.picks}
                                columns={reviewColumns}
                                rowKey={pick => pick.key}
                                emptyMessage="No entries picked"
                            />
                        </div>
                    </>
                )}
            </div>
        </Wizard>
    );
}

export function EndRoundWizard({ open, onClose, round }: EndRoundWizardProps) {
    const wizard = useEndRoundWizard(round.id, round.paused, onClose);

    return (
        <Modal isOpen={open} onClose={onClose} title="End round">
            <EndRoundSteps paused={round.paused} wizard={wizard} />
        </Modal>
    );
}
