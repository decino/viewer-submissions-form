import { beforeEach, describe, vi } from "vitest";
import * as api from "./roundResult";
import { fetchMock, postMock, type RequestCase, resetTransports, runRequestCases } from "./testHarness";

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

describe("the round result API", () => {
    const cases: RequestCase[] = [
        {
            name: "buildResultSet posts with no body",
            call: () => api.buildResultSet(),
            transport: postMock,
            request: ["/submissionRoundResult/buildResultSet"],
            strict: true,
        },
        {
            name: "generateEntries asks for the number of random entries in the query string",
            call: () => api.generateEntries(3),
            transport: fetchMock,
            request: ["/submissionRoundResult/generateEntries?count=3"],
            strict: true,
        },
        {
            name: "submitEntries posts the chosen ids in play order",
            call: () => api.submitEntries([4, 2, 7]),
            transport: postMock,
            request: ["/submissionRoundResult/submitEntries", [4, 2, 7]],
            strict: true,
        },
        {
            name: "addRandomEntry names the round in the query string and posts no body",
            call: () => api.addRandomEntry(5),
            transport: postMock,
            request: ["/submissionRoundResult/addRandomEntry?roundId=5"],
            strict: true,
        },
    ];

    runRequestCases(cases);
});
