export type NewSubmissionPayload = {
    id: number;
    wadName: string;
    wadLevel: string;
};

export type DeleteSubmissionPayload = number[];

function isSubmissionId(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value);
}

export function isNewSubmissionPayload(data: unknown): data is NewSubmissionPayload {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return false;
    }

    const record = data as Record<string, unknown>;

    return isSubmissionId(record.id) && typeof record.wadName === "string" && typeof record.wadLevel === "string";
}

export function isDeleteSubmissionPayload(data: unknown): data is DeleteSubmissionPayload {
    return Array.isArray(data) && data.every(isSubmissionId);
}
