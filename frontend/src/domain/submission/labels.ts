import type { RecordedFormat, SubmissionStatusName } from "../../types/api";

interface LabelledValue<T = number> {
    value: T;
    label: string;
}

export const YES_NO: readonly LabelledValue<boolean>[] = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
];

export const RECORDED_FORMATS: readonly LabelledValue<RecordedFormat>[] = [
    { value: "Blind", label: "Blind" },
    { value: "Practised", label: "Practised" },
];

export function yesNo(value: boolean): string {
    return value ? "Yes" : "No";
}

export const UZDOOM_ENGINE = -1;

export const DOOM_ENGINES: readonly LabelledValue[] = [
    { value: 0, label: "N/A" },
    { value: 2, label: "Doom II" },
    { value: 3, label: "Ultimate Doom" },
    { value: 4, label: "Final Doom" },
    { value: 9, label: "Boom" },
    { value: 11, label: "MBF" },
    { value: 21, label: "MBF21" },
    { value: 22, label: "Doom 64" },
    { value: UZDOOM_ENGINE, label: "GZDoom/UZDoom" },
    { value: -2, label: "I don't know" },
];

export const GZ_ACTIONS: readonly LabelledValue[] = [
    { value: 0, label: "Jump" },
    { value: 1, label: "Crouch" },
    { value: 2, label: "Mouse look" },
];

export const STATUS_OPTIONS: readonly SubmissionStatusName[] = ["Queued", "In Progress", "Rejected", "Completed"];

export function engineLabel(value: number): string {
    return DOOM_ENGINES.find(engine => engine.value === value)?.label ?? `Engine ${value}`;
}

function gzActionLabel(value: number): string {
    return GZ_ACTIONS.find(action => action.value === value)?.label ?? `Action ${value}`;
}

export function gzActionLabels(values: readonly number[] | null): string {
    if (!values || values.length === 0) {
        return "None";
    }

    return values.map(gzActionLabel).join(", ");
}

export function statusTone(status: SubmissionStatusName): "danger" | "info" | "success" | "warning" {
    switch (status) {
        case "Rejected":
            return "danger";
        case "In Progress":
            return "info";
        case "Completed":
            return "success";
        case "Queued":
            return "warning";
    }
}

export function submitterLabel(name: string | null): string {
    const trimmed = name?.trim();

    return trimmed ? trimmed : "anonymous";
}
