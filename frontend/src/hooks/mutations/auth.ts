import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeDetails, login, LOGOUT_URL } from "../../api/endpoints/auth";
import { queryKeys } from "../../api/queryKeys";

export function useLogout() {
    const qc = useQueryClient();
    return () => {
        qc.clear();
        window.location.assign(LOGOUT_URL);
    };
}

export function useLogin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: login,
        onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me() }),
    });
}

export function useChangeDetails() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: changeDetails,
        onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me() }),
    });
}
