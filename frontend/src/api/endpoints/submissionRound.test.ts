import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../client";
import * as api from "./submissionRound";
import { deleteMock, fetchMock, postMock, type RequestCase, resetTransports, runRequestCases } from "./testHarness";

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

describe("the submission round API", () => {
    const cases: RequestCase[] = [
        {
            name: "getActiveRoundForAdmin reads the active round with every submission",
            call: () => api.getActiveRoundForAdmin(),
            transport: fetchMock,
            request: ["/submissionRound/currentActiveRound"],
            strict: true,
        },
        {
            name: "getRoundsForAdmin can leave the active round out",
            call: () => api.getRoundsForAdmin(false),
            transport: fetchMock,
            request: ["/submissionRound/getAllRounds?includeActive=false"],
            strict: true,
        },
        {
            name: "getRoundsForAdmin can include the active round",
            call: () => api.getRoundsForAdmin(true),
            transport: fetchMock,
            request: ["/submissionRound/getAllRounds?includeActive=true"],
            strict: true,
        },
        {
            name: "createRound sends the name in the query string and leaves out a missing deadline",
            call: () => api.createRound({ name: "Round 5" }),
            transport: postMock,
            request: ["/submissionRound/newRound?name=Round+5"],
            strict: true,
        },
        {
            name: "createRound sends the deadline as a timestamp",
            call: () => api.createRound({ name: "Round 5", endDate: 1798675200000 }),
            transport: postMock,
            request: ["/submissionRound/newRound?name=Round+5&endDate=1798675200000"],
            strict: true,
        },
        {
            name: "pauseRound sends a pause in the query string",
            call: () => api.pauseRound(true),
            transport: postMock,
            request: ["/submissionRound/pauseRound?pause=true"],
            strict: true,
        },
        {
            name: "pauseRound sends a resume as an explicit false",
            call: () => api.pauseRound(false),
            transport: postMock,
            request: ["/submissionRound/pauseRound?pause=false"],
            strict: true,
        },
        {
            name: "deleteRound deletes the round named in the path",
            call: () => api.deleteRound(9),
            transport: deleteMock,
            request: ["/submissionRound/9/deleteRound"],
            strict: true,
        },
    ];

    runRequestCases(cases);
});

describe("getActiveRoundForAdmin", () => {
    it("reports no active round when the server answers 404", async () => {
        // given
        fetchMock.mockRejectedValue(new ApiError(404, "No active round", null));

        // when
        const round = await api.getActiveRoundForAdmin();

        // then
        expect(round).toBeNull();
    });

    it("passes every other failure on so it is not mistaken for a missing round", async () => {
        // given
        fetchMock.mockRejectedValue(new ApiError(401, "Unauthorized", null));

        // when
        const failure = api.getActiveRoundForAdmin();

        // then
        await expect(failure).rejects.toMatchObject({ status: 401, message: "Unauthorized" });
    });
});
