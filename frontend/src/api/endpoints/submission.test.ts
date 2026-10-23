import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./submission";
import {
    deleteWithBodyMock,
    fetchMock,
    postFormDataMock,
    postMock,
    type RequestCase,
    resetTransports,
    runRequestCases,
} from "./testHarness";

vi.mock("../client", async importOriginal => {
    const actual = await importOriginal<typeof import("../client")>();
    return {
        ...actual,
        apiFetch: vi.fn(),
        apiFetchText: vi.fn(),
        apiPost: vi.fn(),
        apiPostFormData: vi.fn(),
        apiDelete: vi.fn(),
        apiDeleteWithBody: vi.fn(),
    };
});

beforeEach(resetTransports);

describe("the public submission API", () => {
    const entry = new FormData();
    entry.set("WADName", "Sunlust");

    const cases: RequestCase[] = [
        {
            name: "submitEntry posts the entry form as multipart data",
            call: () => api.submitEntry(entry),
            transport: postFormDataMock,
            request: ["/submission/addEntry", entry],
            strict: true,
        },
        {
            name: "confirmSubmission posts the confirmation code from the email",
            call: () => api.confirmSubmission("uid-1"),
            transport: postMock,
            request: ["/submission/confirm", { uid: "uid-1" }],
            strict: true,
        },
    ];

    runRequestCases(cases);
});

describe("the admin submission API", () => {
    const changes = new FormData();
    changes.set("id", "7");

    const cases: RequestCase[] = [
        {
            name: "getSubmission reads one entry by id",
            call: () => api.getSubmission(7),
            transport: fetchMock,
            request: ["/submission/getSubmission/7"],
            strict: true,
        },
        {
            name: "modifyEntry posts the changed fields as multipart data",
            call: () => api.modifyEntry(changes),
            transport: postFormDataMock,
            request: ["/submission/modifyEntry", changes],
            strict: true,
        },
        {
            name: "changeStatus posts the new status with its comment",
            call: () =>
                api.changeStatus({ submissionId: 7, status: "Rejected", additionalInfo: "The map would not load" }),
            transport: postMock,
            request: [
                "/submission/changeStatus",
                { submissionId: 7, status: "Rejected", additionalInfo: "The map would not load" },
            ],
            strict: true,
        },
        {
            name: "setYoutubeLink sends the encoded link in the query string and posts no body",
            call: () => api.setYoutubeLink(7, "https://www.youtube.com/watch?v=abc123"),
            transport: postMock,
            request: ["/submission/7/setYoutubeLink?link=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc123"],
            strict: true,
        },
        {
            name: "setYoutubeLink leaves the link out to clear it",
            call: () => api.setYoutubeLink(7, null),
            transport: postMock,
            request: ["/submission/7/setYoutubeLink"],
            strict: true,
        },
        {
            name: "verifyEntries posts the ids to verify",
            call: () => api.verifyEntries([1, 2]),
            transport: postMock,
            request: ["/submission/verifyEntries", [1, 2]],
            strict: true,
        },
        {
            name: "deleteEntries deletes with the ids in the body",
            call: () => api.deleteEntries([3, 5]),
            transport: deleteWithBodyMock,
            request: ["/submission/deleteEntries", [3, 5]],
            strict: true,
        },
    ];

    runRequestCases(cases);

    it("reports a missing entry when the server answers with no content", async () => {
        // given
        fetchMock.mockResolvedValue(undefined);

        // when
        const submission = await api.getSubmission(7);

        // then
        expect(submission).toBeNull();
    });
});
