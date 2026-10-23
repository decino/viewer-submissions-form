import type { RecordedFormat } from "../../types/api";
import { UZDOOM_ENGINE } from "./labels";

export interface SubmissionDraft {
    mode: "url" | "upload";
    wadUrl: string;
    wadName: string;
    level: string;
    playTestEngine: string;
    engine: number;
    gzDoomActions: number[];
    authorName: string;
    author: boolean;
    distributable: boolean;
    info: string;
    email: string;
    recordedFormat: RecordedFormat;
}

export function emptyDraft(): SubmissionDraft {
    return {
        mode: "url",
        wadUrl: "",
        wadName: "",
        level: "",
        playTestEngine: "",
        engine: 0,
        gzDoomActions: [],
        authorName: "",
        author: false,
        distributable: false,
        info: "",
        email: "",
        recordedFormat: "Practised",
    };
}

export function buildSubmissionFormData(
    draft: SubmissionDraft,
    file: File | null,
    captchaToken: string | null,
): FormData {
    const formData = new FormData();

    if (draft.mode === "url") {
        formData.append("WAD", draft.wadUrl);
    }

    if (draft.mode === "upload" && file) {
        formData.append("file", file);
    }

    formData.append("WADName", draft.wadName);
    formData.append("level", draft.level);
    formData.append("playTestEngine", draft.playTestEngine);
    formData.append("engine", String(draft.engine));

    if (draft.engine === UZDOOM_ENGINE) {
        for (const action of draft.gzDoomActions) {
            formData.append("gzDoomAction[]", String(action));
        }
    }

    if (draft.authorName.trim()) {
        formData.append("authorName", draft.authorName);
    }

    formData.append("author", String(draft.author));

    if (draft.author) {
        formData.append("distributable", String(draft.distributable));
    }

    if (draft.info.trim()) {
        formData.append("info", draft.info);
    }

    formData.append("email", draft.email);
    formData.append("recordedFormat", draft.recordedFormat);

    if (captchaToken) {
        formData.append("cf-turnstile-response", captchaToken);
    }

    return formData;
}
