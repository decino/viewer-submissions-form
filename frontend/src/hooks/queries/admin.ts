import { useQuery } from "@tanstack/react-query";
import { getSubmission } from "../../api/endpoints/submission";
import { getActiveRoundForAdmin, getRoundsForAdmin } from "../../api/endpoints/submissionRound";
import { getWadValidation } from "../../api/endpoints/utils";
import { queryKeys } from "../../api/queryKeys";
import { errorMessage } from "../../utils/errorMessage";

export function useAdminActiveRound() {
    const q = useQuery({
        queryKey: queryKeys.admin.activeRound(),
        queryFn: getActiveRoundForAdmin,
    });
    return {
        round: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the active round.") : null,
    };
}

export function useAdminPreviousRounds() {
    const q = useQuery({
        queryKey: queryKeys.admin.previousRounds(),
        queryFn: () => getRoundsForAdmin(false),
    });
    return {
        rounds: q.data ?? [],
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the previous rounds.") : null,
    };
}

export function useAdminSubmission(id: number | null) {
    const q = useQuery({
        queryKey: queryKeys.admin.submission(id ?? 0),
        queryFn: () => getSubmission(id ?? 0),
        enabled: id !== null,
    });
    return {
        submission: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the submission.") : null,
    };
}

export function useWadValidation() {
    const q = useQuery({
        queryKey: queryKeys.admin.wadValidation(),
        queryFn: getWadValidation,
    });
    return {
        validation: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the WAD validation rules.") : null,
    };
}
