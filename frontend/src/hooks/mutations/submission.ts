import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    changeStatus,
    deleteEntries,
    modifyEntry,
    setYoutubeLink,
    submitEntry,
    verifyEntries,
} from "../../api/endpoints/submission";
import { invalidateViews } from "../../api/cache/invalidate";

export function useSubmitEntry() {
    return useMutation({
        mutationFn: submitEntry,
    });
}

export function useModifyEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: modifyEntry,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useChangeStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: changeStatus,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useSetYoutubeLink() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number; link: string | null }) => setYoutubeLink(data.id, data.link),
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useVerifyEntries() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: verifyEntries,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}

export function useDeleteEntries() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteEntries,
        onSuccess: () => invalidateViews(qc, "round"),
    });
}
