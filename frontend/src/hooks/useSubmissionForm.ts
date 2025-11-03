import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import * as submissionApi from "../utils/api/submissionApi";
import type { SubmissionModel } from "../types";

interface UseSubmissionFormOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useSubmissionForm(options: UseSubmissionFormOptions = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const submitForm = useCallback(
        async (submission: SubmissionModel, file?: File) => {
            setLoading(true);
            setError(null);
            setSuccess(false);

            try {
                await submissionApi.submitEntry(submission, file);
                setSuccess(true);
                options.onSuccess?.();
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An error occurred while submitting your entry";
                setError(errorMessage);
                options.onError?.(err instanceof Error ? err : new Error(errorMessage));
            } finally {
                setLoading(false);
            }
        },
        [options],
    );

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
    }, []);

    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
    }, []);

    return {
        loading,
        error,
        success,
        submitForm,
        handleSubmit,
        reset,
        setError,
    };
}
