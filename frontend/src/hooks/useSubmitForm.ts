import { type SubmitEvent, useEffect, useState } from "react";
import { captchaRequired } from "../domain/site/captcha";
import { buildSubmissionFormData, emptyDraft, type SubmissionDraft } from "../domain/submission/formData";
import { idgamesUrl } from "../domain/wad/doomworld";
import { acceptAttribute } from "../domain/wad/upload";
import { errorMessage } from "../utils/errorMessage";
import { readStored, removeStored, writeStored } from "../utils/storage";
import { useSubmitEntry } from "./mutations/submission";
import { useCaptchaConfig, useUploadConfig } from "./queries/site";
import { useIdgamesTitle } from "./queries/submission";
import { useWadFile } from "./useWadFile";

const DRAFT_KEY = "submission-draft";

export function useSubmitForm() {
    const { captcha, error: captchaError } = useCaptchaConfig();
    const { upload, error: uploadError } = useUploadConfig();
    const submitEntry = useSubmitEntry();
    const [draft, setDraft] = useState<SubmissionDraft>(() => ({
        ...emptyDraft(),
        ...readStored<Partial<SubmissionDraft>>("session", DRAFT_KEY),
    }));
    const [lookupUrl, setLookupUrl] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaResetKey, setCaptchaResetKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const lookup = useIdgamesTitle(lookupUrl);
    const wadFile = useWadFile({
        limitMb: upload?.fileSizeLimitMb ?? null,
        setLevel: level => update("level", level),
    });

    const wadName = lookup.title ?? draft.wadName;
    const sending = submitEntry.isPending;

    useEffect(() => {
        if (!submitted) {
            writeStored("session", DRAFT_KEY, { ...draft, wadName });
        }
    }, [draft, wadName, submitted]);

    function update<K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) {
        setDraft(previous => ({ ...previous, [key]: value }));
    }

    function toggleGzAction(action: number, allowed: boolean) {
        setDraft(previous => {
            const others = previous.gzDoomActions.filter(existing => existing !== action);

            return { ...previous, gzDoomActions: allowed ? [...others, action].sort((a, b) => a - b) : others };
        });
    }

    function chooseMode(mode: SubmissionDraft["mode"]) {
        setDraft(previous => ({ ...previous, mode, wadUrl: "" }));
        setLookupUrl(null);
        wadFile.clear();
    }

    function changeWadUrl(wadUrl: string) {
        update("wadUrl", wadUrl);
        setLookupUrl(null);
    }

    function lookUpWadName() {
        setLookupUrl(idgamesUrl(draft.wadUrl));
    }

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (captchaRequired(captcha) && !captchaToken) {
            setError("Complete the captcha first");
            return;
        }

        setError(null);

        const formData = buildSubmissionFormData({ ...draft, wadName }, wadFile.file, captchaToken);

        try {
            await submitEntry.mutateAsync(formData);
            removeStored("session", DRAFT_KEY);
            wadFile.clear();
            setSubmitted(true);
        } catch (failure) {
            setError(errorMessage(failure, "Your entry could not be sent. Try again."));
        } finally {
            setCaptchaToken(null);
            setCaptchaResetKey(key => key + 1);
        }
    }

    function reset() {
        setDraft(emptyDraft());
        setLookupUrl(null);
        wadFile.clear();
        setError(null);
        setSubmitted(false);
    }

    return {
        draft,
        update,
        toggleGzAction,
        chooseMode,
        changeWadUrl,
        lookUpWadName,
        chooseFile: wadFile.choose,
        fileInput: wadFile.fileInput,
        wadNameField: {
            value: wadName,
            readOnly: lookup.loading || lookup.title !== null,
            placeholder: lookup.loading ? "Looking up the WAD name..." : undefined,
        },
        upload: {
            accept: upload ? acceptAttribute(upload.allowedExtensions) : undefined,
            limitMb: upload?.fileSizeLimitMb ?? null,
            error: uploadError,
        },
        fileError: wadFile.error,
        mapNames: wadFile.mapNames,
        mapError: wadFile.mapError,
        captcha: {
            resetKey: captchaResetKey,
            onToken: setCaptchaToken,
            error: captchaError,
        },
        error,
        sending,
        canSubmit: !sending && !lookup.loading,
        submitted,
        submit,
        reset,
    };
}
