import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../api/endpoints/auth";
import { queryKeys } from "../../api/queryKeys";
import { errorMessage } from "../../utils/errorMessage";

export function useMe() {
    const q = useQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: getCurrentUser,
    });
    return {
        me: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not check whether you are logged in.") : null,
        refresh: q.refetch,
    };
}
