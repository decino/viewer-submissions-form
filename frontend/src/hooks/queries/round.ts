import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getPreviousRounds } from "../../api/endpoints/round";
import { queryKeys } from "../../api/queryKeys";
import { sortSubmissions } from "../../domain/round/submissions";
import { errorMessage } from "../../utils/errorMessage";

export function useCurrentRound() {
    const q = useQuery({
        queryKey: queryKeys.round.current(),
        queryFn: getCurrentRound,
        select: round => (round ? sortSubmissions(round) : null),
    });
    return {
        round: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the current round.") : null,
    };
}

export function usePreviousRounds() {
    const q = useQuery({
        queryKey: queryKeys.round.previous(),
        queryFn: getPreviousRounds,
    });
    return {
        rounds: q.data ?? [],
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the previous rounds.") : null,
    };
}
