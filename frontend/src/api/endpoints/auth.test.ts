import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../client";
import * as api from "./auth";
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

describe("the auth API", () => {
    const cases: RequestCase[] = [
        {
            name: "login posts the credentials with the captcha token under the field the server reads",
            call: () => api.login({ email: "admin@example.test", password: "hunter2", turnstileToken: "token-1" }),
            transport: postMock,
            request: [
                "/auth/login",
                { email: "admin@example.test", password: "hunter2", "cf-turnstile-response": "token-1" },
            ],
            strict: true,
        },
        {
            name: "login leaves the captcha token unset when the site has no captcha",
            call: () => api.login({ email: "admin@example.test", password: "hunter2" }),
            transport: postMock,
            request: [
                "/auth/login",
                { email: "admin@example.test", password: "hunter2", "cf-turnstile-response": undefined },
            ],
            strict: true,
        },
        {
            name: "getCurrentUser reads the signed in admin",
            call: () => api.getCurrentUser(),
            transport: fetchMock,
            request: ["/auth/current_user"],
            strict: true,
        },
        {
            name: "changeDetails posts the new email and password",
            call: () => api.changeDetails({ email: "admin@example.test", password: "correct horse" }),
            transport: postMock,
            request: ["/auth/changeDetails", { email: "admin@example.test", password: "correct horse" }],
            strict: true,
        },
    ];

    runRequestCases(cases);
});

describe("getCurrentUser", () => {
    it("hands back the signed in admin", async () => {
        // given
        fetchMock.mockResolvedValue({ id: "1", email: "admin@example.test" });

        // when
        const user = await api.getCurrentUser();

        // then
        expect(user).toEqual({ id: "1", email: "admin@example.test" });
    });

    it("reports nobody signed in when the server answers 401", async () => {
        // given
        fetchMock.mockRejectedValue(new ApiError(401, "Unauthorized", null));

        // when
        const user = await api.getCurrentUser();

        // then
        expect(user).toBeNull();
    });

    it("passes every other failure on so it is not mistaken for a signed out visitor", async () => {
        // given
        fetchMock.mockRejectedValue(new ApiError(500, "The database is unreachable", null));

        // when
        const failure = api.getCurrentUser();

        // then
        await expect(failure).rejects.toMatchObject({ status: 500, message: "The database is unreachable" });
    });
});

describe("LOGOUT_URL", () => {
    it("points at the server's logout route under the REST mount", () => {
        // then
        expect(api.LOGOUT_URL).toBe("/rest/auth/logout");
    });
});
