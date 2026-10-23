import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./round";
import { fetchMock, type RequestCase, resetTransports, runRequestCases } from "./testHarness";

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

describe("the round API", () => {
    const cases: RequestCase[] = [
        {
            name: "getCurrentRound reads the public view of the active round",
            call: () => api.getCurrentRound(),
            transport: fetchMock,
            request: ["/round/current"],
            strict: true,
        },
        {
            name: "getPreviousRounds reads the public results of every finished round",
            call: () => api.getPreviousRounds(),
            transport: fetchMock,
            request: ["/round/previous"],
            strict: true,
        },
    ];

    runRequestCases(cases);

    it("reports no active round when the server answers with no content", async () => {
        // given
        fetchMock.mockResolvedValue(undefined);

        // when
        const round = await api.getCurrentRound();

        // then
        expect(round).toBeNull();
    });
});
