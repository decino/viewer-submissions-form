import { beforeEach, describe, vi } from "vitest";
import * as api from "./stats";
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

describe("the stats API", () => {
    const cases: RequestCase[] = [
        {
            name: "getRoundStats reads the charts data of the round named in the path",
            call: () => api.getRoundStats(4),
            transport: fetchMock,
            request: ["/stats/4"],
            strict: true,
        },
    ];

    runRequestCases(cases);
});
