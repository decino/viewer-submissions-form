import { describe, expect, it } from "vitest";
import type { RealtimeEvent } from "./events";
import { isDeleteSubmissionPayload, isNewSubmissionPayload, passesRealtimeGuard, toRealtimeEvent } from "./guards";

describe("isNewSubmissionPayload", () => {
    it("accepts what the server emits on verify", () => {
        // then
        expect(isNewSubmissionPayload({ id: 4, wadName: "Sunlust", wadLevel: "MAP12" })).toBe(true);
    });

    it("rejects a payload missing the id, which the list keys rows by", () => {
        // then
        expect(isNewSubmissionPayload({ wadName: "Sunlust", wadLevel: "MAP12" })).toBe(false);
        expect(isNewSubmissionPayload({ id: "4", wadName: "Sunlust", wadLevel: "MAP12" })).toBe(false);
        expect(isNewSubmissionPayload({ id: 4.5, wadName: "Sunlust", wadLevel: "MAP12" })).toBe(false);
    });

    it("rejects a payload whose WAD or level is not text", () => {
        // then
        expect(isNewSubmissionPayload({ id: 4, wadName: null, wadLevel: "MAP12" })).toBe(false);
        expect(isNewSubmissionPayload({ id: 4, wadName: "Sunlust", wadLevel: 12 })).toBe(false);
    });

    it("rejects a payload that is not an object", () => {
        // then
        expect(isNewSubmissionPayload(null)).toBe(false);
        expect(isNewSubmissionPayload("newSubmission")).toBe(false);
        expect(isNewSubmissionPayload([{ id: 4, wadName: "Sunlust", wadLevel: "MAP12" }])).toBe(false);
    });
});

describe("isDeleteSubmissionPayload", () => {
    it("accepts a list of submission ids, including an empty one", () => {
        // then
        expect(isDeleteSubmissionPayload([1, 2, 3])).toBe(true);
        expect(isDeleteSubmissionPayload([])).toBe(true);
    });

    it("rejects anything that is not a list of integer ids", () => {
        // then
        expect(isDeleteSubmissionPayload(3)).toBe(false);
        expect(isDeleteSubmissionPayload(["3"])).toBe(false);
        expect(isDeleteSubmissionPayload([1, null])).toBe(false);
    });
});

describe("toRealtimeEvent", () => {
    it("turns a known, well-formed socket frame into a bus event", () => {
        // then
        expect(toRealtimeEvent("deleteSubmission", [3])).toEqual({ type: "deleteSubmission", data: [3] });
    });

    it("drops an event this client does not handle", () => {
        // then
        expect(toRealtimeEvent("roundPaused", {})).toBeNull();
        expect(toRealtimeEvent("toString", {})).toBeNull();
    });

    it("drops a known event whose payload is malformed", () => {
        // then
        expect(toRealtimeEvent("newSubmission", { id: "1" })).toBeNull();
    });
});

describe("passesRealtimeGuard", () => {
    it("lets a well-formed event through and stops a malformed one", () => {
        // given
        const good: RealtimeEvent = { type: "deleteSubmission", data: [1] };
        const bad = { type: "deleteSubmission", data: "1" } as unknown as RealtimeEvent;

        // then
        expect(passesRealtimeGuard(good)).toBe(true);
        expect(passesRealtimeGuard(bad)).toBe(false);
    });
});
