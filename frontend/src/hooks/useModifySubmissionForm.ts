import { type SubmitEvent, useState } from "react";
import type { AdminSubmission, RecordedFormat } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useModifyEntry } from "./mutations/submission";
import { useAdminSubmission } from "./queries/admin";

export interface ModifyDraft {
    wadUrl: string;
    wadName: string;
    level: string;
    engine: number;
    authorName: string;
    author: boolean;
    distributable: boolean;
    recordedFormat: RecordedFormat;
}

function draftFrom(submission: AdminSubmission): ModifyDraft {
    return {
        wadUrl: submission.WAD ?? "",
        wadName: submission.WADName,
        level: submission.level,
        engine: submission.engine,
        authorName: submission.authorName ?? "",
        author: submission.author,
        distributable: submission.author && submission.distributable,
        recordedFormat: submission.recordedFormat,
    };
}

function buildModifyFormData(id: number, draft: ModifyDraft, includeWadUrl: boolean): FormData {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("WADName", draft.wadName);

    if (includeWadUrl) {
        formData.append("WAD", draft.wadUrl);
    }

    formData.append("level", draft.level);
    formData.append("engine", String(draft.engine));
    formData.append("author", String(draft.author));

    if (draft.author) {
        formData.append("distributable", String(draft.distributable));
    }

    formData.append("recordedFormat", draft.recordedFormat);

    if (draft.authorName.trim()) {
        formData.append("authorName", draft.authorName);
    }

    return formData;
}

export function useModifySubmissionForm(submissionId: number, onSaved: () => void) {
    const { submission, loading, error: loadError } = useAdminSubmission(submissionId);
    const modifyEntry = useModifyEntry();
    const [changes, setChanges] = useState<Partial<ModifyDraft>>({});
    const [error, setError] = useState<string | null>(null);

    const draft = submission ? { ...draftFrom(submission), ...changes } : null;
    const hasWadUrl = Boolean(submission?.WAD);

    function update<K extends keyof ModifyDraft>(key: K, value: ModifyDraft[K]) {
        setChanges(previous => ({ ...previous, [key]: value }));
    }

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!draft) {
            return;
        }

        setError(null);

        try {
            await modifyEntry.mutateAsync(buildModifyFormData(submissionId, draft, hasWadUrl));
        } catch (failure) {
            setError(errorMessage(failure, "The changes could not be saved."));
            return;
        }

        onSaved();
    }

    return {
        loading,
        loadError,
        draft,
        hasWadUrl,
        update,
        submit,
        saving: modifyEntry.isPending,
        error,
    };
}
