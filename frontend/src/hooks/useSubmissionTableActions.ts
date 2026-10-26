import { useState } from "react";
import { notChosen } from "../domain/round/results";
import { unverifiedSubmissions, verifiedSubmissions } from "../domain/submission/admin";
import type { AdminRound, AdminSubmission } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useDeleteEntries, useVerifyEntries } from "./mutations/submission";

export type SubmissionTableId = "unverified" | "current";

type EntryAction = "verify" | "delete";

type SubmissionDialog = "modify" | "file";

export interface PendingEntryAction {
    kind: EntryAction;
    table: SubmissionTableId;
    ids: number[];
}

interface OpenSubmissionDialog {
    kind: SubmissionDialog;
    submission: AdminSubmission;
}

interface TableError {
    table: SubmissionTableId;
    message: string;
}

type Selection = Record<SubmissionTableId, ReadonlySet<number>>;

const FAILURES: Record<EntryAction, string> = {
    verify: "The entries could not be verified.",
    delete: "The entries could not be deleted.",
};

function noSelection(): Selection {
    return { unverified: new Set(), current: new Set() };
}

export function useSubmissionTableActions(round: AdminRound) {
    const verifyEntries = useVerifyEntries();
    const deleteEntries = useDeleteEntries();
    const [selection, setSelection] = useState<Selection>(noSelection);
    const [pending, setPending] = useState<PendingEntryAction | null>(null);
    const [error, setError] = useState<TableError | null>(null);
    const [dialog, setDialog] = useState<OpenSubmissionDialog | null>(null);

    const rows: Record<SubmissionTableId, AdminSubmission[]> = {
        unverified: unverifiedSubmissions(round),
        current: notChosen(verifiedSubmissions(round)),
    };

    function selectedRows(table: SubmissionTableId): AdminSubmission[] {
        return rows[table].filter(row => selection[table].has(row.id));
    }

    function tableState(table: SubmissionTableId) {
        return {
            rows: rows[table],
            selectedKeys: selection[table],
            selected: selectedRows(table),
            error: error?.table === table ? error.message : null,
        };
    }

    function select(table: SubmissionTableId, keys: ReadonlySet<number>) {
        setSelection(previous => ({ ...previous, [table]: keys }));
    }

    function ask(kind: EntryAction, table: SubmissionTableId) {
        const ids = selectedRows(table).map(row => row.id);

        if (ids.length === 0) {
            return;
        }

        setPending({ kind, table, ids });
    }

    async function confirm() {
        if (!pending) {
            return;
        }

        setError(null);

        try {
            if (pending.kind === "verify") {
                await verifyEntries.mutateAsync(pending.ids);
            } else {
                await deleteEntries.mutateAsync(pending.ids);
            }

            select(pending.table, new Set());
        } catch (failure) {
            setError({ table: pending.table, message: errorMessage(failure, FAILURES[pending.kind]) });
        } finally {
            setPending(null);
        }
    }

    function openDialog(kind: SubmissionDialog, table: SubmissionTableId) {
        const selected = selectedRows(table);

        if (selected.length !== 1) {
            return;
        }

        setDialog({ kind, submission: selected[0] });
    }

    return {
        unverified: tableState("unverified"),
        current: tableState("current"),
        select,
        pending,
        ask,
        confirm,
        cancel: () => setPending(null),
        busy: verifyEntries.isPending || deleteEntries.isPending,
        dialog,
        openDialog,
        closeDialog: () => setDialog(null),
    };
}
