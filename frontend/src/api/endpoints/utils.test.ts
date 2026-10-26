import { beforeEach, describe, vi } from "vitest";
import type { WadValidation } from "../../types/api";
import * as api from "./utils";
import { fetchMock, fetchTextMock, postMock, type RequestCase, resetTransports, runRequestCases } from "./testHarness";

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

describe("the utils API", () => {
    const validation: WadValidation = {
        allowedExtensions: ["wad", "zip"],
        allowedHeaders: ["PWAD", "PK%03%04"],
        allowedExtensionsZip: ["wad"],
        allowedHeadersZip: [null],
    };

    const cases: RequestCase[] = [
        {
            name: "fetchThroughProxy reads the page as text with its URL encoded in the query string",
            call: () => api.fetchThroughProxy("https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust"),
            transport: fetchTextMock,
            request: [
                "/utils/corsProxy?url=https%3A%2F%2Fwww.doomworld.com%2Fidgames%2Flevels%2Fdoom2%2Fmegawads%2Fsunlust",
            ],
            strict: true,
        },
        {
            name: "getWadValidation reads the upload validation rules",
            call: () => api.getWadValidation(),
            transport: fetchMock,
            request: ["/utils/wadValidation"],
            strict: true,
        },
        {
            name: "saveWadValidation posts the rules unchanged",
            call: () => api.saveWadValidation(validation),
            transport: postMock,
            request: ["/utils/wadValidation", validation],
            strict: true,
        },
    ];

    runRequestCases(cases);
});
