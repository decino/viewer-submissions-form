import { useQuery } from "@tanstack/react-query";
import { confirmSubmission } from "../../api/endpoints/submission";
import { fetchThroughProxy } from "../../api/endpoints/utils";
import { queryKeys } from "../../api/queryKeys";
import { extractIdgamesTitle } from "../../domain/wad/doomworld";
import { errorMessage } from "../../utils/errorMessage";

export function useSubmissionConfirmation(uid: string | null) {
    const q = useQuery({
        queryKey: queryKeys.submission.confirmation(uid ?? ""),
        queryFn: () => confirmSubmission(uid ?? ""),
        enabled: uid !== null,
        retry: false,
        staleTime: Infinity,
    });
    return {
        result: q.data ?? null,
        error: q.error ? errorMessage(q.error, "This submission could not be confirmed.") : null,
        loading: q.isLoading,
    };
}

export function useIdgamesTitle(url: string | null) {
    const q = useQuery({
        queryKey: queryKeys.submission.doomworldPage(url ?? ""),
        queryFn: () => fetchThroughProxy(url ?? ""),
        enabled: url !== null,
        retry: false,
        staleTime: Infinity,
        select: extractIdgamesTitle,
    });
    return { title: q.data ?? null, loading: q.isLoading && url !== null };
}
