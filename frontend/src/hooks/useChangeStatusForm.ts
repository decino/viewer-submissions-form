import { type SubmitEvent, useState } from "react";
import { STATUS_OPTIONS } from "../domain/submission/labels";
import type { AdminSubmission, SubmissionStatusChange, SubmissionStatusName } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useAddRandomEntry } from "./mutations/round";
import { useChangeStatus } from "./mutations/submission";

export function useChangeStatusForm(submission: AdminSubmission, onSaved: () => void) {
    const changeStatus = useChangeStatus();
    const addRandomEntry = useAddRandomEntry();
    const [status, setStatus] = useState<SubmissionStatusName>(submission.status?.status ?? "Queued");
    const [comments, setComments] = useState(submission.status?.additionalInfo ?? "");
    const [pickAnother, setPickAnother] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function chooseStatus(value: string) {
        const chosen = STATUS_OPTIONS.find(option => option === value);

        if (!chosen) {
            return;
        }

        setStatus(chosen);
        setPickAnother(false);
    }

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const change: SubmissionStatusChange = { submissionId: submission.id, status };
        if (comments.trim()) {
            change.additionalInfo = comments;
        }

        try {
            await changeStatus.mutateAsync(change);
        } catch (failure) {
            setError(errorMessage(failure, "The status could not be changed."));
            return;
        }

        if (status === "Rejected" && pickAnother) {
            try {
                await addRandomEntry.mutateAsync(submission.submissionRoundId);
            } catch (failure) {
                const reason = errorMessage(failure, "no reason was given.");
                setError(`The status was changed, but no other entry could be picked: ${reason}`);
                return;
            }
        }

        onSaved();
    }

    return {
        status,
        chooseStatus,
        comments,
        setComments,
        canPickAnother: status === "Rejected",
        pickAnother,
        setPickAnother,
        error,
        saving: changeStatus.isPending || addRandomEntry.isPending,
        submit,
    };
}
