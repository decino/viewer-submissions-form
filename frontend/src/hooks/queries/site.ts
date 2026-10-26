import { useQuery } from "@tanstack/react-query";
import { getCaptchaConfig, getUploadConfig } from "../../api/endpoints/config";
import { getRoundStats } from "../../api/endpoints/stats";
import { queryKeys } from "../../api/queryKeys";
import { errorMessage } from "../../utils/errorMessage";

export function useCaptchaConfig() {
    const q = useQuery({
        queryKey: queryKeys.config.captcha(),
        queryFn: getCaptchaConfig,
        staleTime: Infinity,
    });
    return {
        captcha: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the captcha settings.") : null,
    };
}

export function useUploadConfig() {
    const q = useQuery({
        queryKey: queryKeys.config.upload(),
        queryFn: getUploadConfig,
    });
    return {
        upload: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the upload settings.") : null,
    };
}

export function useRoundStats(roundId: number) {
    const q = useQuery({
        queryKey: queryKeys.stats.round(roundId),
        queryFn: () => getRoundStats(roundId),
    });
    return {
        stats: q.data ?? null,
        loading: q.isLoading,
        error: q.error ? errorMessage(q.error, "Could not load the round statistics.") : null,
    };
}
