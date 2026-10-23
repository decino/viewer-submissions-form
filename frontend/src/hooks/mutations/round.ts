import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRound, deleteRound, pauseRound } from "../../api/endpoints/submissionRound";
import { addRandomEntry, buildResultSet, generateEntries, submitEntries } from "../../api/endpoints/roundResult";
import { invalidateViews } from "../../api/cache/invalidate";

export function useCreateRound() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createRound,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function usePauseRound() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: pauseRound,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useDeleteRound() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteRound,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useBuildResultSet() {
    return useMutation({
        mutationFn: buildResultSet,
    });
}

export function useGenerateEntries() {
    return useMutation({
        mutationFn: generateEntries,
    });
}

export function useSubmitEntries() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: submitEntries,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useAddRandomEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: addRandomEntry,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}
