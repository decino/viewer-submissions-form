import { useState } from "react";
import { chosenInPlayOrder, notChosen } from "../domain/round/results";
import type { AdminRound, AdminSubmission } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useAddRandomEntry, useDeleteRound } from "./mutations/round";
import { useDeleteEntries } from "./mutations/submission";

export type RoundAction = "delete-entry" | "add-random" | "delete-round";

type ResultDialog = "modify" | "file" | "status" | "youtube";

interface OpenResultDialog {
    kind: ResultDialog;
    submission: AdminSubmission;
}

const FAILURES: Record<RoundAction, string> = {
    "delete-entry": "The entry could not be deleted.",
    "add-random": "No random entry could be added.",
    "delete-round": "The round could not be deleted.",
};

export function usePreviousRoundActions(round: AdminRound) {
    const deleteEntries = useDeleteEntries();
    const addRandomEntry = useAddRandomEntry();
    const deleteRound = useDeleteRound();
    const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<number>>(() => new Set());
    const [pending, setPending] = useState<RoundAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dialog, setDialog] = useState<OpenResultDialog | null>(null);

    const results = chosenInPlayOrder(round.submissions);
    const selected = results.find(submission => selectedKeys.has(submission.id)) ?? null;

    function ask(action: RoundAction) {
        if (action === "delete-entry" && !selected) {
            return;
        }

        setPending(action);
    }

    async function perform(action: RoundAction) {
        if (action === "delete-entry" && selected) {
            await deleteEntries.mutateAsync([selected.id]);
            setSelectedKeys(new Set());
        }

        if (action === "add-random") {
            await addRandomEntry.mutateAsync(round.id);
        }

        if (action === "delete-round") {
            await deleteRound.mutateAsync(round.id);
        }
    }

    async function confirm() {
        if (!pending) {
            return;
        }

        setError(null);

        try {
            await perform(pending);
        } catch (failure) {
            setError(errorMessage(failure, FAILURES[pending]));
        } finally {
            setPending(null);
        }
    }

    function openDialog(kind: ResultDialog) {
        if (!selected) {
            return;
        }

        setDialog({ kind, submission: selected });
    }

    return {
        results,
        others: notChosen(round.submissions),
        selectedKeys,
        select: setSelectedKeys,
        selected,
        pending,
        ask,
        confirm,
        cancel: () => setPending(null),
        busy: deleteEntries.isPending || addRandomEntry.isPending || deleteRound.isPending,
        error,
        dialog,
        openDialog,
        closeDialog: () => setDialog(null),
    };
}
