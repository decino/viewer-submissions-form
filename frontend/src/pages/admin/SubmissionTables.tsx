import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { DataTable } from "../../components/DataTable/DataTable";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Input } from "../../components/Input/Input";
import { Panel } from "../../components/Panel/Panel";
import { Select } from "../../components/Select/Select";
import { browseEntries, ENTRY_ORDERS, type EntryOrder, isEntryOrder } from "../../domain/submission/browse";
import {
    type PendingEntryAction,
    type SubmissionTableId,
    useSubmissionTableActions,
} from "../../hooks/useSubmissionTableActions";
import type { AdminRound } from "../../types/api";
import { readStored, writeStored } from "../../utils/storage";
import { SUBMISSION_COLUMNS, withoutDetails } from "./adminColumns";
import { EntryPanel } from "./EntryPanel";
import { ModifySubmissionModal } from "./ModifySubmissionModal";
import { SetFileModal } from "./SetFileModal";
import styles from "./SubmissionTables.module.css";

type SubmissionTablesProps = {
    round: AdminRound;
    table: SubmissionTableId;
    streaming: boolean;
};

const ORDER_KEY = "admin-entry-order";

const TABLE_LABELS: Record<SubmissionTableId, string> = {
    unverified: "Entries to verify",
    current: "Entries",
};

const EMPTY_MESSAGES: Record<SubmissionTableId, string> = {
    unverified: "No submissions are waiting for verification.",
    current: "No submissions have been verified yet.",
};

function storedOrder(): EntryOrder {
    const stored = readStored<unknown>("local", ORDER_KEY);

    return isEntryOrder(stored) ? stored : "newest";
}

function entriesLabel(count: number): string {
    return count === 1 ? "1 entry" : `${count} entries`;
}

function confirmBody(action: PendingEntryAction): string {
    const entries = entriesLabel(action.ids.length);

    if (action.kind === "verify") {
        return `Verify ${entries}?`;
    }

    const notice =
        action.ids.length === 1
            ? "The submitter is emailed that their entry was rejected."
            : "Each submitter is emailed that their entry was rejected.";

    return `Delete ${entries}? ${notice}`;
}

export function SubmissionTables({ round, table, streaming }: SubmissionTablesProps) {
    const actions = useSubmissionTableActions(round);
    const [search, setSearch] = useState("");
    const [order, setOrder] = useState(storedOrder);

    const state = actions[table];
    const rows = browseEntries(state.rows, search, order);
    const columns = streaming ? withoutDetails(SUBMISSION_COLUMNS) : SUBMISSION_COLUMNS;
    const [single] = state.selected;

    function changeOrder(next: string) {
        if (!isEntryOrder(next)) {
            return;
        }

        setOrder(next);
        writeStored("local", ORDER_KEY, next);
    }

    return (
        <div className={styles.tables}>
            <ErrorBanner message={state.error} />

            <div className={styles.split}>
                <div className={styles.table}>
                    <DataTable
                        label={TABLE_LABELS[table]}
                        rows={rows}
                        columns={columns}
                        rowKey={submission => submission.id}
                        emptyMessage={search.trim() === "" ? EMPTY_MESSAGES[table] : "No entries match the search."}
                        selection="multi"
                        selectedKeys={state.selectedKeys}
                        onSelectionChange={keys => actions.select(table, keys)}
                        toolbar={
                            <div className={styles.toolbar}>
                                <Input
                                    type="search"
                                    aria-label="Search entries"
                                    placeholder="Search WAD, level, sender"
                                    className={styles.search}
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                />
                                <label className={styles.sort}>
                                    Sort
                                    <Select value={order} onChange={event => changeOrder(event.target.value)}>
                                        {ENTRY_ORDERS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </label>
                            </div>
                        }
                    />
                    <p className={styles.hint}>Click a row to open it. Ctrl-click or Shift-click to pick several.</p>
                </div>

                {state.selected.length === 1 && single && (
                    <EntryPanel
                        submission={single}
                        streaming={streaming}
                        onClose={() => actions.select(table, new Set())}
                    >
                        {table === "unverified" && (
                            <Button type="button" variant="primary" onClick={() => actions.ask("verify", table)}>
                                Verify
                            </Button>
                        )}
                        <Button type="button" onClick={() => actions.openDialog("modify", table)}>
                            Edit details
                        </Button>
                        <Button type="button" onClick={() => actions.openDialog("file", table)}>
                            Replace file
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            className={styles.push}
                            onClick={() => actions.ask("delete", table)}
                        >
                            Delete
                        </Button>
                    </EntryPanel>
                )}

                {state.selected.length > 1 && (
                    <Panel
                        title={`${entriesLabel(state.selected.length)} picked`}
                        aria-label="Picked entries"
                        className={styles.bulk}
                        actions={
                            <Button
                                type="button"
                                size="small"
                                aria-label="Clear the selection"
                                onClick={() => actions.select(table, new Set())}
                            >
                                {"✕"}
                            </Button>
                        }
                    >
                        <ul className={styles.picked}>
                            {state.selected.map(submission => (
                                <li key={submission.id}>
                                    {submission.WADName} <span className={styles.level}>{submission.level}</span>
                                </li>
                            ))}
                        </ul>
                        <div className={styles.bulkActions}>
                            {table === "unverified" && (
                                <Button type="button" variant="primary" onClick={() => actions.ask("verify", table)}>
                                    Verify {state.selected.length}
                                </Button>
                            )}
                            <Button type="button" variant="danger" onClick={() => actions.ask("delete", table)}>
                                Delete {state.selected.length}
                            </Button>
                        </div>
                    </Panel>
                )}
            </div>

            <ConfirmDialog
                open={actions.pending !== null}
                title={actions.pending?.kind === "verify" ? "Verify entries" : "Delete entries"}
                body={actions.pending ? confirmBody(actions.pending) : ""}
                confirmLabel={actions.pending?.kind === "verify" ? "Verify" : "Delete"}
                destructive={actions.pending?.kind === "delete"}
                busy={actions.busy}
                onConfirm={actions.confirm}
                onCancel={actions.cancel}
            />

            <ModifySubmissionModal
                submissionId={actions.dialog?.kind === "modify" ? actions.dialog.submission.id : null}
                onClose={actions.closeDialog}
            />
            <SetFileModal
                submission={actions.dialog?.kind === "file" ? actions.dialog.submission : null}
                onClose={actions.closeDialog}
            />
        </div>
    );
}
