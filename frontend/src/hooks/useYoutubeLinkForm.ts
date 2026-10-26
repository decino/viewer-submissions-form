import { type SubmitEvent, useState } from "react";
import type { AdminSubmission } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useSetYoutubeLink } from "./mutations/submission";

const YOUTUBE_PREFIX = "https://www.youtube.com/";

function withoutPrefix(link: string): string {
    return link.startsWith(YOUTUBE_PREFIX) ? link.slice(YOUTUBE_PREFIX.length) : link;
}

export function useYoutubeLinkForm(submission: AdminSubmission, onSaved: () => void) {
    const setYoutubeLink = useSetYoutubeLink();
    const [path, setPath] = useState(() => withoutPrefix(submission.youtubeLink ?? ""));
    const [error, setError] = useState<string | null>(null);

    const trimmed = withoutPrefix(path.trim());

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        try {
            await setYoutubeLink.mutateAsync({
                id: submission.id,
                link: trimmed ? `${YOUTUBE_PREFIX}${trimmed}` : null,
            });
        } catch (failure) {
            setError(errorMessage(failure, "The YouTube link could not be saved."));
            return;
        }

        onSaved();
    }

    return {
        prefix: YOUTUBE_PREFIX,
        path,
        setPath,
        removing: trimmed === "",
        error,
        saving: setYoutubeLink.isPending,
        submit,
    };
}
