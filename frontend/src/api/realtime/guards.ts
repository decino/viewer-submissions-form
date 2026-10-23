import type {
    DeleteSubmissionPayload,
    NewSubmissionPayload,
    RealtimeEvent,
    RealtimeEventName,
    RealtimeEventPayload,
} from "./events";

type RealtimeEventGuard<K extends RealtimeEventName> = (data: unknown) => data is RealtimeEventPayload<K>;

type RealtimeGuardTable = { [K in RealtimeEventName]: RealtimeEventGuard<K> };

function asRecord(data: unknown): Record<string, unknown> | null {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return null;
    }

    return data as Record<string, unknown>;
}

function isSubmissionId(value: unknown): boolean {
    return typeof value === "number" && Number.isInteger(value);
}

export function isNewSubmissionPayload(data: unknown): data is NewSubmissionPayload {
    const record = asRecord(data);
    if (record === null) {
        return false;
    }

    return isSubmissionId(record.id) && typeof record.wadName === "string" && typeof record.wadLevel === "string";
}

export function isDeleteSubmissionPayload(data: unknown): data is DeleteSubmissionPayload {
    return Array.isArray(data) && data.every(isSubmissionId);
}

const REALTIME_EVENT_GUARDS = {
    newSubmission: isNewSubmissionPayload,
    deleteSubmission: isDeleteSubmissionPayload,
} as const satisfies RealtimeGuardTable;

const EVENT_NAMES: ReadonlySet<string> = new Set<string>(Object.keys(REALTIME_EVENT_GUARDS));

export function passesRealtimeGuard(event: RealtimeEvent): boolean {
    const guard: (data: unknown) => boolean = REALTIME_EVENT_GUARDS[event.type];

    return guard(event.data);
}

export function toRealtimeEvent(name: string, data: unknown): RealtimeEvent | null {
    if (!EVENT_NAMES.has(name)) {
        return null;
    }

    const event = { type: name, data } as RealtimeEvent;

    return passesRealtimeGuard(event) ? event : null;
}
