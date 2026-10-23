import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { changeDetails, login } from "../../api/endpoints/auth";
import { expectInvalidated } from "../../test-utils/query";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { SuccessResponse } from "../../types/api";
import { useChangeDetails, useLogin, useLogout } from "./auth";

vi.mock("../../api/endpoints/auth", () => ({
    login: vi.fn(),
    changeDetails: vi.fn(),
    LOGOUT_URL: "/rest/auth/logout",
}));

const mockedLogin = vi.mocked(login);
const mockedChangeDetails = vi.mocked(changeDetails);

const ok: SuccessResponse = { success: true, description: "Done" };

function setup<T>(hook: () => T) {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const clear = vi.spyOn(queryClient, "clear");
    const { result } = renderHook(hook, { wrapper: providerWrapper({ queryClient }) });

    return { result, queryClient, invalidate, clear };
}

beforeEach(() => {
    mockedLogin.mockResolvedValue(ok);
    mockedChangeDetails.mockResolvedValue(ok);
});

describe("useLogin", () => {
    it("sends the credentials with the captcha token and refreshes the session user", async () => {
        // given
        const { result, queryClient } = setup(useLogin);

        // when
        await act(async () => {
            await result.current.mutateAsync({
                email: "admin@example.test",
                password: "hunter2",
                turnstileToken: "token-1",
            });
        });

        // then
        expect(mockedLogin.mock.lastCall?.[0]).toEqual({
            email: "admin@example.test",
            password: "hunter2",
            turnstileToken: "token-1",
        });
        expectInvalidated(queryClient, ["auth", "me"]);
    });

    it("leaves the session alone when the credentials are refused", async () => {
        // given
        mockedLogin.mockRejectedValue(new Error("Incorrect email/password"));
        const { result, invalidate } = setup(useLogin);

        // when
        await act(async () => {
            await expect(
                result.current.mutateAsync({ email: "admin@example.test", password: "wrong" }),
            ).rejects.toThrow("Incorrect email/password");
        });

        // then
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("useChangeDetails", () => {
    it("sends the new email and password and refreshes the session user", async () => {
        // given
        const { result, queryClient } = setup(useChangeDetails);

        // when
        await act(async () => {
            await result.current.mutateAsync({ email: "new@example.test", password: "correct horse" });
        });

        // then
        expect(mockedChangeDetails.mock.lastCall?.[0]).toEqual({
            email: "new@example.test",
            password: "correct horse",
        });
        expectInvalidated(queryClient, ["auth", "me"]);
    });

    it("leaves the session alone when the change is refused", async () => {
        // given
        mockedChangeDetails.mockRejectedValue(new Error("That email address is not valid"));
        const { result, invalidate } = setup(useChangeDetails);

        // when
        await act(async () => {
            await expect(
                result.current.mutateAsync({ email: "not-an-email", password: "correct horse" }),
            ).rejects.toThrow("That email address is not valid");
        });

        // then
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("useLogout", () => {
    it("throws away the whole cache before handing over to the server's logout route", () => {
        // given
        const { result, clear } = setup(useLogout);

        // when
        act(() => {
            result.current();
        });

        // then
        expect(clear).toHaveBeenCalledOnce();
    });
});
