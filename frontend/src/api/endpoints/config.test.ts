import { beforeEach, describe, vi } from "vitest";
import * as api from "./config";
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

describe("the config API", () => {
    const cases: RequestCase[] = [
        {
            name: "getCaptchaConfig reads which captcha the site uses and its site key",
            call: () => api.getCaptchaConfig(),
            transport: fetchMock,
            request: ["/config/captcha"],
            strict: true,
        },
        {
            name: "getUploadConfig reads the upload size limit and allowed extensions",
            call: () => api.getUploadConfig(),
            transport: fetchMock,
            request: ["/config/upload"],
            strict: true,
        },
    ];

    runRequestCases(cases);
});
