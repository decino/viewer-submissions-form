import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { CaptchaConfig } from "../../types/api";
import { Button } from "../Button/Button";
import { Captcha } from "./Captcha";

const mocks = vi.hoisted(() => ({
    useCaptchaConfig: vi.fn(),
    mounted: vi.fn(),
}));

interface TurnstileStubProps {
    siteKey: string;
    options?: { theme?: string };
    onSuccess?: (token: string) => void;
    onExpire?: (token: string) => void;
    onError?: (error: string) => void;
}

function TurnstileStub({ siteKey, options, onSuccess, onExpire, onError }: TurnstileStubProps) {
    useEffect(() => {
        mocks.mounted();
    }, []);

    return (
        <div data-testid="turnstile" data-site-key={siteKey} data-theme={options?.theme}>
            <Button type="button" onClick={() => onSuccess?.("turnstile-token")}>
                pass verification
            </Button>
            <Button type="button" onClick={() => onExpire?.("turnstile-token")}>
                expire verification
            </Button>
            <Button type="button" onClick={() => onError?.("110200")}>
                fail verification
            </Button>
        </div>
    );
}

vi.mock("@marsidev/react-turnstile", () => ({ Turnstile: TurnstileStub }));

vi.mock("../../hooks/queries/site", () => ({ useCaptchaConfig: mocks.useCaptchaConfig }));

function stubCaptcha(captcha: CaptchaConfig | null, loading = false): void {
    mocks.useCaptchaConfig.mockReturnValue({ captcha, loading });
}

beforeEach(() => {
    mocks.mounted.mockClear();
    stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
});

describe("Captcha", () => {
    it("renders the turnstile widget with the configured site key in the dark theme", () => {
        // when
        renderWithProviders(<Captcha onToken={vi.fn()} />);

        // then
        const widget = screen.getByTestId("turnstile");
        expect(widget).toHaveAttribute("data-site-key", "0x4AAA");
        expect(widget).toHaveAttribute("data-theme", "dark");
    });

    it("renders nothing when the server has no captcha switched on", () => {
        // given
        stubCaptcha({ captchaType: null, siteKey: null });

        // when
        const { container } = renderWithProviders(<Captcha onToken={vi.fn()} />);

        // then
        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when turnstile is switched on without a site key", () => {
        // given
        stubCaptcha({ captchaType: "turnstile", siteKey: null });

        // when
        const { container } = renderWithProviders(<Captcha onToken={vi.fn()} />);

        // then
        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing while the captcha settings are still loading", () => {
        // given
        stubCaptcha(null, true);

        // when
        const { container } = renderWithProviders(<Captcha onToken={vi.fn()} />);

        // then
        expect(container).toBeEmptyDOMElement();
    });

    it("hands over the token once the visitor passes the challenge", async () => {
        // given
        const onToken = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<Captcha onToken={onToken} />);

        // when
        await user.click(screen.getByRole("button", { name: "pass verification" }));

        // then
        expect(onToken).toHaveBeenCalledWith("turnstile-token");
    });

    it("clears the token when the challenge expires", async () => {
        // given
        const onToken = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<Captcha onToken={onToken} />);

        // when
        await user.click(screen.getByRole("button", { name: "expire verification" }));

        // then
        expect(onToken).toHaveBeenCalledWith(null);
    });

    it("clears the token when the challenge fails", async () => {
        // given
        const onToken = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<Captcha onToken={onToken} />);

        // when
        await user.click(screen.getByRole("button", { name: "fail verification" }));

        // then
        expect(onToken).toHaveBeenCalledWith(null);
    });

    it("starts a fresh challenge when it is given a new reset key", () => {
        // given
        const onToken = vi.fn();
        const { rerender } = renderWithProviders(<Captcha onToken={onToken} resetKey={0} />);

        // when
        rerender(<Captcha onToken={onToken} resetKey={1} />);

        // then
        expect(mocks.mounted).toHaveBeenCalledTimes(2);
    });

    it("keeps the same challenge while the reset key stays the same", () => {
        // given
        const onToken = vi.fn();
        const { rerender } = renderWithProviders(<Captcha onToken={onToken} resetKey={0} />);

        // when
        rerender(<Captcha onToken={onToken} resetKey={0} />);

        // then
        expect(mocks.mounted).toHaveBeenCalledOnce();
    });
});
