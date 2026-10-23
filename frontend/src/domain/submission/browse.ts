import type { AdminSubmission } from "../../types/api";
import { submitterLabel } from "./labels";

export type EntryOrder = "newest" | "oldest" | "wad" | "sender";

type Comparator = (a: AdminSubmission, b: AdminSubmission) => number;

export const ENTRY_ORDERS: readonly { value: EntryOrder; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "wad", label: "WAD name" },
    { value: "sender", label: "Sender" },
];

const byText = (text: (submission: AdminSubmission) => string): Comparator => {
    return (a, b) => text(a).localeCompare(text(b), undefined, { sensitivity: "base" }) || a.id - b.id;
};

const COMPARATORS: Record<EntryOrder, Comparator> = {
    newest: (a, b) => Date.parse(b.created) - Date.parse(a.created) || b.id - a.id,
    oldest: (a, b) => Date.parse(a.created) - Date.parse(b.created) || a.id - b.id,
    wad: byText(submission => submission.WADName),
    sender: byText(submission => submitterLabel(submission.authorName)),
};

export function isEntryOrder(value: unknown): value is EntryOrder {
    return ENTRY_ORDERS.some(order => order.value === value);
}

export function browseEntries(
    submissions: readonly AdminSubmission[],
    search: string,
    order: EntryOrder,
): AdminSubmission[] {
    const needle = search.trim().toLowerCase();

    return submissions
        .filter(submission =>
            [submission.WADName, submission.level, submitterLabel(submission.authorName)].some(text =>
                text.toLowerCase().includes(needle),
            ),
        )
        .sort(COMPARATORS[order]);
}
