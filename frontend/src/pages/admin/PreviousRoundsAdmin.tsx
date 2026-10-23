import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { DataTable } from "../../components/DataTable/DataTable";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Select } from "../../components/Select/Select";
import { ToggleSwitch } from "../../components/ToggleSwitch/ToggleSwitch";
import { formatRoundStart } from "../../domain/round/deadline";
import { roundsOldestFirst } from "../../domain/round/results";
import { useAdminPreviousRounds } from "../../hooks/queries/admin";
import { type RoundAction, usePreviousRoundActions } from "../../hooks/usePreviousRoundActions";
import type { AdminRound, AdminSubmission } from "../../types/api";
import { RESULT_COLUMNS, SUBMISSION_COLUMNS, withDetailsHidden, withoutDetails } from "./adminColumns";
import { ChangeStatusModal } from "./ChangeStatusModal";
import { EntryPanel } from "./EntryPanel";
import { ModifySubmissionModal } from "./ModifySubmissionModal";
import { SetFileModal } from "./SetFileModal";
import { YoutubeLinkModal } from "./YoutubeLinkModal";
import styles from "./PreviousRoundsAdmin.module.css";

type ConfirmCopy = {
    title: string;
    body: string;
    confirmLabel: string;
    destructive: boolean;
};

type PreviousRoundsAdminProps = {
    streaming: boolean;
};

type RoundResultsProps = {
    round: AdminRound;
    showAll: boolean;
    streaming: boolean;
};

function confirmCopy(action: RoundAction, round: AdminRound, selected: AdminSubmission | null): ConfirmCopy {
    switch (action) {
        case "delete-entry":
            return {
                title: "Delete entry",
                body: `Delete ${selected?.WADName ?? "this entry"}? It is removed from the results of ${round.name}.`,
                confirmLabel: "Delete",
                destructive: true,
            };
        case "add-random":
            return {
                title: "Add random entry",
                body: `Pick another random entry for ${round.name}?`,
                confirmLabel: "Add entry",
                destructive: false,
            };
        case "delete-round":
            return {
                title: "Delete round",
                body: `Delete ${round.name}? All of its submissions are removed.`,
                confirmLabel: "Delete round",
                destructive: true,
            };
    }
}

function RoundResults({ round, showAll, streaming }: RoundResultsProps) {
    const {
        results,
        others,
        selectedKeys,
        select,
        selected,
        pending,
        ask,
        confirm,
        cancel,
        busy,
        error,
        dialog,
        openDialog,
        closeDialog,
    } = usePreviousRoundActions(round);

    const copy = pending ? confirmCopy(pending, round, selected) : null;
    const resultColumns = streaming ? withoutDetails(RESULT_COLUMNS) : withDetailsHidden(RESULT_COLUMNS);
    const otherColumns = streaming ? withoutDetails(SUBMISSION_COLUMNS) : withDetailsHidden(SUBMISSION_COLUMNS);

    return (
        <>
            <ErrorBanner message={error} />

            <div className={styles.split}>
                <div className={styles.tables}>
                    <DataTable
                        label="Round results"
                        rows={results}
                        columns={resultColumns}
                        rowKey={submission => submission.id}
                        emptyMessage="No entries were picked in this round."
                        selection="single"
                        selectedKeys={selectedKeys}
                        onSelectionChange={select}
                        toolbar={
                            <Button type="button" size="small" onClick={() => ask("add-random")}>
                                Add random entry
                            </Button>
                        }
                    />

                    {showAll && (
                        <DataTable
                            label="Other submissions"
                            rows={others}
                            columns={otherColumns}
                            rowKey={submission => submission.id}
                            emptyMessage="Every submission to this round was picked."
                        />
                    )}

                    <div className={styles.footer}>
                        <Button type="button" variant="danger" onClick={() => ask("delete-round")}>
                            Delete round
                        </Button>
                    </div>
                </div>

                {selected && (
                    <EntryPanel submission={selected} streaming={streaming} onClose={() => select(new Set())}>
                        <Button type="button" onClick={() => openDialog("status")}>
                            Change status
                        </Button>
                        <Button type="button" onClick={() => openDialog("youtube")}>
                            YouTube link
                        </Button>
                        <Button type="button" onClick={() => openDialog("modify")}>
                            Edit details
                        </Button>
                        <Button type="button" onClick={() => openDialog("file")}>
                            Replace file
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            className={styles.push}
                            onClick={() => ask("delete-entry")}
                        >
                            Delete
                        </Button>
                    </EntryPanel>
                )}
            </div>

            <ConfirmDialog
                open={copy !== null}
                title={copy?.title ?? ""}
                body={copy?.body ?? ""}
                confirmLabel={copy?.confirmLabel}
                destructive={copy?.destructive}
                busy={busy}
                onConfirm={confirm}
                onCancel={cancel}
            />

            <ModifySubmissionModal
                submissionId={dialog?.kind === "modify" ? dialog.submission.id : null}
                onClose={closeDialog}
            />
            <SetFileModal submission={dialog?.kind === "file" ? dialog.submission : null} onClose={closeDialog} />
            <ChangeStatusModal
                submission={dialog?.kind === "status" ? dialog.submission : null}
                onClose={closeDialog}
            />
            <YoutubeLinkModal
                submission={dialog?.kind === "youtube" ? dialog.submission : null}
                onClose={closeDialog}
            />
        </>
    );
}

export function PreviousRoundsAdmin({ streaming }: PreviousRoundsAdminProps) {
    const { rounds, loading, error } = useAdminPreviousRounds();
    const [pickedId, setPickedId] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    if (loading) {
        return <p className={styles.status}>Loading the previous rounds...</p>;
    }

    if (error) {
        return <ErrorBanner message={error} />;
    }

    const newestFirst = roundsOldestFirst(rounds).reverse();
    const round = newestFirst.find(candidate => candidate.id === pickedId) ?? newestFirst[0];

    if (!round) {
        return <p className={styles.status}>No round has finished yet.</p>;
    }

    return (
        <div className={styles.rounds}>
            <div className={styles.picker}>
                <label className={styles.roundLabel}>
                    Round
                    <Select value={String(round.id)} onChange={event => setPickedId(Number(event.target.value))}>
                        {newestFirst.map(candidate => (
                            <option key={candidate.id} value={candidate.id}>
                                {candidate.name}
                            </option>
                        ))}
                    </Select>
                </label>
                <p className={styles.started}>Started on {formatRoundStart(round.created)}</p>
                <div className={styles.toggle}>
                    <ToggleSwitch enabled={showAll} onChange={setShowAll} label="Show all submissions" />
                </div>
            </div>

            <RoundResults key={round.id} round={round} showAll={showAll} streaming={streaming} />
        </div>
    );
}
