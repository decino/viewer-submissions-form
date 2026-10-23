import { type SubmitEvent, useState } from "react";
import { acceptAttribute } from "../domain/wad/upload";
import type { AdminSubmission } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useModifyEntry } from "./mutations/submission";
import { useUploadConfig } from "./queries/site";

export function useSetFileForm(submission: AdminSubmission) {
    const { upload, error: configError } = useUploadConfig();
    const modifyEntry = useModifyEntry();
    const [confirmed, setConfirmed] = useState(!submission.WAD);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [replaced, setReplaced] = useState(false);

    function chooseFile(chosen: File | null) {
        setFile(chosen);
        setReplaced(false);
    }

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!file) {
            return;
        }

        setError(null);
        setReplaced(false);

        const formData = new FormData();
        formData.append("id", String(submission.id));
        formData.append("file", file);

        try {
            await modifyEntry.mutateAsync(formData);
        } catch (failure) {
            setError(errorMessage(failure, "The file could not be uploaded."));
            return;
        }

        setReplaced(true);
    }

    return {
        needsConfirmation: !confirmed,
        confirmReplace: () => setConfirmed(true),
        accept: upload ? acceptAttribute(upload.allowedExtensions) : undefined,
        configError,
        chooseFile,
        canUpload: file !== null && !modifyEntry.isPending,
        error,
        replaced,
        submit,
    };
}
