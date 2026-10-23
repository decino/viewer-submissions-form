import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../components/Button/Button";
import type { useLoginForm } from "../../hooks/useLoginForm";
import { renderWithProviders } from "../../test-utils/render";
import { LoginPage } from "./LoginPage";

const mocks = vi.hoisted(() => ({
    useLoginForm: vi.fn(),
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    onToken: vi.fn(),
    submit: vi.fn((event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        return Promise.resolve();
    }),
}));

vi.mock("../../hooks/useLoginForm", () => ({ useLoginForm: mocks.useLoginForm }));
vi.mock("../../components/Captcha/Captcha", () => ({
    Captcha: ({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey?: number }) => (
        <Button type="button" onClick={() => onToken("turnstile-token")}>
            Captcha {resetKey}
        </Button>
    ),
}));

type LoginForm = ReturnType<typeof useLoginForm>;

function stubForm(overrides: Partial<LoginForm> = {}): void {
    const form: LoginForm = {
        loggedIn: false,
        email: "admin@example.test",
        setEmail: mocks.setEmail,
        password: "hunter2",
        setPassword: mocks.setPassword,
        captcha: { resetKey: 0, onToken: mocks.onToken },
        error: null,
        captchaError: null,
        sending: false,
        submit: mocks.submit,
        ...overrides,
    };

    mocks.useLoginForm.mockReturnValue(form);
}

function setup() {
    const user = userEvent.setup();
    const result = renderWithProviders(
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<p>the admin page</p>} />
        </Routes>,
        { route: "/login" },
    );

    return { user, ...result };
}

beforeEach(() => {
    stubForm();
});

describe("LoginPage", () => {
    it("asks the admin for an email address and a password", () => {
        // when
        setup();

        // then
        expect(screen.getByRole("heading", { name: "Admin login" })).toBeInTheDocument();
        expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email");
        expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
        expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("names itself in the browser tab", () => {
        // when
        setup();

        // then
        expect(document.title).toBe("Admin login | Viewer Submissions");
    });

    it("shows the email address and password the form holds", () => {
        // when
        setup();

        // then
        expect(screen.getByLabelText("Email address")).toHaveValue("admin@example.test");
        expect(screen.getByLabelText("Password")).toHaveValue("hunter2");
    });

    it("hands what the admin types to the form", async () => {
        // given
        stubForm({ email: "", password: "" });
        const { user } = setup();

        // when
        await user.type(screen.getByLabelText("Email address"), "a");
        await user.type(screen.getByLabelText("Password"), "h");

        // then
        expect(mocks.setEmail).toHaveBeenCalledWith("a");
        expect(mocks.setPassword).toHaveBeenCalledWith("h");
    });

    it("hands the login to the form when the admin logs in", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Log in" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("sends an admin who is logged in straight to the admin page", () => {
        // given
        stubForm({ loggedIn: true });

        // when
        setup();

        // then
        expect(screen.getByText("the admin page")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Admin login" })).not.toBeInTheDocument();
    });

    it("shows the error the form reports", () => {
        // given
        stubForm({ error: "Incorrect email/password" });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Incorrect email/password");
    });

    it("shows the captcha settings error next to a login error", () => {
        // given
        stubForm({ error: "Incorrect email/password", captchaError: "Could not load the captcha settings." });

        // when
        setup();

        // then
        const alerts = screen.getAllByRole("alert");
        expect(alerts).toHaveLength(2);
        expect(alerts[0]).toHaveTextContent("Could not load the captcha settings.");
        expect(alerts[1]).toHaveTextContent("Incorrect email/password");
    });

    it("locks the button while the login is in flight", () => {
        // given
        stubForm({ sending: true });

        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
    });
});

describe("LoginPage captcha", () => {
    it("starts the captcha the form asks for", () => {
        // given
        stubForm({ captcha: { resetKey: 3, onToken: mocks.onToken } });

        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Captcha 3" })).toBeInTheDocument();
    });

    it("hands the captcha token to the form", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Captcha 0" }));

        // then
        expect(mocks.onToken).toHaveBeenCalledWith("turnstile-token");
    });
});
