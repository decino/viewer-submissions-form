import { describe, expect, it } from "vitest";
import { isDeleteSubmissionPayload, isNewSubmissionPayload } from "./events";

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
