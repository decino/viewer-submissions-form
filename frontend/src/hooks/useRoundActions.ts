import { useState } from "react";
import type { AdminRound } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useDeleteRound, usePauseRound } from "./mutations/round";

type RoundConfirmation = "pause" | "delete";

export function useRoundActions(round: AdminRound) {
    const pauseMutation = usePauseRound();
    const deleteMutation = useDeleteRound();
    const [confirming, setConfirming] = useState<RoundConfirmation | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function togglePause() {
        setError(null);

        try {
            await pauseMutation.mutateAsync(!round.paused);
        } catch (failure) {
            setError(
                errorMessage(failure, round.paused ? "Could not resume the round." : "Could not pause the round."),
            );
        } finally {
            setConfirming(null);
        }
    }

    async function deleteRound() {
        setError(null);

        try {
            await deleteMutation.mutateAsync(round.id);
        } catch (failure) {
            setError(errorMessage(failure, "Could not delete the round."));
        } finally {
            setConfirming(null);
        }
    }

    return {
        confirming,
        setConfirming,
        error,
        pausing: pauseMutation.isPending,
        deleting: deleteMutation.isPending,
        togglePause,
        deleteRound,
    };
}
