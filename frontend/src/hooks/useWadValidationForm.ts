import { type SubmitEvent, useState } from "react";
import type { WadValidation } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { useSaveWadValidation } from "./mutations/settings";
import { useWadValidation } from "./queries/admin";

const ZIP_HEADER = "PK\u0003\u0004";

export type ValidationSection = "files" | "zips";

interface ValidationRow {
    extension: string;
    header: string;
}

interface ValidationRowView extends ValidationRow {
    zip: boolean;
}

type ValidationDraft = Record<ValidationSection, ValidationRow[]>;

function toRows(extensions: readonly string[], headers: readonly (string | null)[]): ValidationRow[] {
    return extensions.map((extension, index) => {
        const header = headers[index] ?? null;
        return { extension, header: header === null ? "" : decodeURIComponent(header) };
    });
}

function toDraft(validation: WadValidation | null): ValidationDraft {
    if (!validation) {
        return { files: [], zips: [] };
    }

    return {
        files: toRows(validation.allowedExtensions, validation.allowedHeaders),
        zips: toRows(validation.allowedExtensionsZip, validation.allowedHeadersZip),
    };
}

function wireHeader(row: ValidationRow): string | null {
    return row.header === "" ? null : encodeURIComponent(row.header);
}

function toValidation(draft: ValidationDraft): WadValidation {
    return {
        allowedExtensions: draft.files.map(row => row.extension.trim()),
        allowedHeaders: draft.files.map(wireHeader),
        allowedExtensionsZip: draft.zips.map(row => row.extension.trim()),
        allowedHeadersZip: draft.zips.map(wireHeader),
    };
}

function toView(row: ValidationRow): ValidationRowView {
    return { ...row, zip: row.header === ZIP_HEADER };
}

export function useWadValidationForm() {
    const { validation, loading, error: loadError } = useWadValidation();
    const saveMutation = useSaveWadValidation();
    const [draft, setDraft] = useState<ValidationDraft | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const rows = draft ?? toDraft(validation);

    function edit(section: ValidationSection, next: ValidationRow[]) {
        setDraft({ ...rows, [section]: next });
        setError(null);
        setSaved(false);
    }

    function addRow(section: ValidationSection) {
        edit(section, [...rows[section], { extension: "", header: "" }]);
    }

    function removeRow(section: ValidationSection, index: number) {
        edit(
            section,
            rows[section].filter((_, position) => position !== index),
        );
    }

    function updateRow(section: ValidationSection, index: number, patch: Partial<ValidationRow>) {
        edit(
            section,
            rows[section].map((row, position) => (position === index ? { ...row, ...patch } : row)),
        );
    }

    function toggleZip(section: ValidationSection, index: number, zip: boolean) {
        updateRow(section, index, { header: zip ? ZIP_HEADER : "" });
    }

    async function save(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const missingExtension = [...rows.files, ...rows.zips].some(row => row.extension.trim() === "");
        if (missingExtension) {
            setError("Every row needs an extension");
            return;
        }

        setError(null);
        setSaved(false);

        try {
            await saveMutation.mutateAsync(toValidation(rows));
            setSaved(true);
        } catch (failure) {
            setError(errorMessage(failure, "Could not save the validation rules."));
        }
    }

    function reset() {
        setDraft(null);
        setError(null);
        setSaved(false);
    }

    return {
        loading,
        loadError,
        rows: validation ? { files: rows.files.map(toView), zips: rows.zips.map(toView) } : null,
        dirty: draft !== null && !saved,
        error,
        saved,
        saving: saveMutation.isPending,
        addRow,
        removeRow,
        updateRow,
        toggleZip,
        save,
        reset,
    };
}
