export const REALTIME_EVENTS = {
    NEW_SUBMISSION: "newSubmission",
    DELETE_SUBMISSION: "deleteSubmission",
} as const;

export interface NewSubmissionPayload {
    id: number;
    wadName: string;
    wadLevel: string;
}

export type DeleteSubmissionPayload = number[];

export type RealtimeEvent =
    | { type: "newSubmission"; data: NewSubmissionPayload }
    | { type: "deleteSubmission"; data: DeleteSubmissionPayload };

export type RealtimeEventName = RealtimeEvent["type"];

export type RealtimeEventOf<K extends RealtimeEventName> = Extract<RealtimeEvent, { type: K }>;

export type RealtimeEventPayload<K extends RealtimeEventName> = RealtimeEventOf<K>["data"];
