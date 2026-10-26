import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { CaptchaConfig, SessionUser } from "../types/api";
import { useLoginForm } from "./useLoginForm";

const mocks = vi.hoisted(() => ({
    useCaptchaConfig: vi.fn(),
    loginUser: vi.fn<(email: string, password: string, turnstileToken?: string) => Promise<void>>(),
}));

vi.mock("./queries/site", () => ({ useCaptchaConfig: mocks.useCaptchaConfig }));

const admin: SessionUser = { id: "1", email: "admin@example.test" };

function stubCaptcha(captcha: CaptchaConfig | null, error: string | null = null): void {
    mocks.useCaptchaConfig.mockReturnValue({ captcha, loading: false, error });
}

function setup(user: SessionUser | null = null) {
    return renderHook(() => useLoginForm(), {
        wrapper: providerWrapper({ user, auth: { loginUser: mocks.loginUser } }),
    });
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function fillCredentials(result: { current: ReturnType<typeof useLoginForm> }): void {
    act(() => result.current.setEmail("admin@example.test"));
    act(() => result.current.setPassword("hunter2"));
}

beforeEach(() => {
    mocks.loginUser.mockReset();
    mocks.loginUser.mockResolvedValue(undefined);
    stubCaptcha({ captchaType: null, siteKey: null });
});

describe("useLoginForm", () => {
    it("starts with empty credentials and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.email).toBe("");
        expect(result.current.password).toBe("");
        expect(result.current.error).toBeNull();
        expect(result.current.sending).toBe(false);
        expect(result.current.loggedIn).toBe(false);
    });

    it("keeps the email address and password the admin types", () => {
        // given
        const { result } = setup();

        // when
        fillCredentials(result);

        // then
        expect(result.current.email).toBe("admin@example.test");
        expect(result.current.password).toBe("hunter2");
    });

    it("reports an admin who is already logged in", () => {
        // when
        const { result } = setup(admin);

        // then
        expect(result.current.loggedIn).toBe(true);
    });

    it("hands the typed email and password to the login", async () => {
        // given
        const { result } = setup();
        fillCredentials(result);
        const event = submitEvent();

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalled();
        expect(mocks.loginUser).toHaveBeenCalledWith("admin@example.test", "hunter2", undefined);
        expect(result.current.error).toBeNull();
    });

    it("shows the reason the server refused the login", async () => {
        // given
        mocks.loginUser.mockRejectedValue(new Error("Incorrect email/password"));
        const { result } = setup();
        fillCredentials(result);

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Incorrect email/password");
    });

    it("says the login failed when the failure carries no reason", async () => {
        // given
        mocks.loginUser.mockRejectedValue(new Error(""));
        const { result } = setup();
        fillCredentials(result);

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Could not log in. Try again.");
    });

    it("clears the previous error once a later attempt goes through", async () => {
        // given
        mocks.loginUser.mockRejectedValueOnce(new Error("Incorrect email/password"));
        const { result } = setup();
        fillCredentials(result);
        await act(() => result.current.submit(submitEvent()));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.loginUser).toHaveBeenCalledTimes(2);
        expect(result.current.error).toBeNull();
    });

    it("reports that it is sending until the login settles", async () => {
        // given
        const login = { finish: () => {}, attempt: Promise.resolve() };
        mocks.loginUser.mockReturnValue(
            new Promise<void>(resolve => {
                login.finish = resolve;
            }),
        );
        const { result } = setup();
        fillCredentials(result);

        // when
        act(() => {
            login.attempt = result.current.submit(submitEvent());
        });

        // then
        expect(result.current.sending).toBe(true);
        login.finish();
        await act(() => login.attempt);
        expect(result.current.sending).toBe(false);
    });

    it("shows why the captcha settings could not be loaded", () => {
        // given
        stubCaptcha(null, "Could not load the captcha settings.");

        // when
        const { result } = setup();

        // then
        expect(result.current.captchaError).toBe("Could not load the captcha settings.");
    });

    it("keeps the captcha settings error alongside a refused login", async () => {
        // given
        stubCaptcha(null, "Could not load the captcha settings.");
        mocks.loginUser.mockRejectedValue(new Error("Incorrect email/password"));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Incorrect email/password");
        expect(result.current.captchaError).toBe("Could not load the captcha settings.");
    });
});

describe("useLoginForm captcha", () => {
    it("asks for the captcha first and sends nothing when the captcha is switched on", async () => {
        // given
        stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
        const { result } = setup();
        fillCredentials(result);

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Complete the captcha first");
        expect(mocks.loginUser).not.toHaveBeenCalled();
    });

    it("sends the captcha token along with the credentials", async () => {
        // given
        stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
        const { result } = setup();
        fillCredentials(result);
        act(() => result.current.captcha.onToken("turnstile-token"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.loginUser).toHaveBeenCalledWith("admin@example.test", "hunter2", "turnstile-token");
    });

    it("needs a fresh captcha after a refused login, because each token works once", async () => {
        // given
        stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
        mocks.loginUser.mockRejectedValue(new Error("Incorrect email/password"));
        const { result } = setup();
        fillCredentials(result);
        act(() => result.current.captcha.onToken("turnstile-token"));
        await act(() => result.current.submit(submitEvent()));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.captcha.resetKey).toBe(1);
        expect(result.current.error).toBe("Complete the captcha first");
        expect(mocks.loginUser).toHaveBeenCalledOnce();
    });
});
