import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveWadValidation } from "../../api/endpoints/utils";
import { invalidateViews } from "../../api/cache/invalidate";

export function useSaveWadValidation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: saveWadValidation,
        onSuccess: () => invalidateViews(qc, "settings"),
    });
}
