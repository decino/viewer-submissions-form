import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../components/Button/Button";
import { useAuth } from "../hooks/useAuth";
import { renderWithProviders } from "../test-utils/render";
import type { SessionUser } from "../types/api";
import { AuthProvider } from "./AuthContext";

const mocks = vi.hoisted(() => ({
    useMe: vi.fn(),
    refresh: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
}));

vi.mock("../hooks/queries/auth", () => ({ useMe: mocks.useMe }));

vi.mock("../hooks/mutations/auth", () => ({
    useLogin: () => ({ mutateAsync: mocks.login }),
    useLogout: () => mocks.logout,
}));

const admin: SessionUser = { id: "1", email: "admin@example.test" };

function Probe() {
    const { user, loading, error, loginUser, logoutUser } = useAuth();
    const [outcome, setOutcome] = useState("idle");

    function run(work: Promise<void>) {
        work.then(() => setOutcome("settled")).catch(() => setOutcome("rejected"));
    }

    return (
        <div>
            <p>{`user: ${user?.email ?? "nobody"}`}</p>
            <p>{`loading: ${String(loading)}`}</p>
            <p>{`error: ${error ?? "none"}`}</p>
            <p>{`outcome: ${outcome}`}</p>
            <Button type="button" onClick={() => run(loginUser("admin@example.test", "hunter2", "token-1"))}>
                log in
            </Button>
            <Button type="button" onClick={() => run(loginUser("admin@example.test", "hunter2"))}>
                log in without a captcha
            </Button>
            <Button type="button" onClick={logoutUser}>
                log out
            </Button>
        </div>
    );
}

function renderProvider(me: SessionUser | null, loading = false, error: string | null = null) {
    mocks.useMe.mockReturnValue({ me, loading, error, refresh: mocks.refresh });

    return renderWithProviders(
        <AuthProvider>
            <Probe />
        </AuthProvider>,
    );
}

beforeEach(() => {
    mocks.refresh.mockResolvedValue(undefined);
    mocks.login.mockResolvedValue({ success: true, description: "Logged in" });
});

describe("AuthProvider", () => {
    it("hands the signed in admin down to its children", () => {
        // when
        renderProvider(admin);

        // then
        expect(screen.getByText("user: admin@example.test")).toBeInTheDocument();
    });

    it("reports nobody signed in when the session came back empty", () => {
        // when
        renderProvider(null);

        // then
        expect(screen.getByText("user: nobody")).toBeInTheDocument();
    });

    it("passes a failed session check through as an error", () => {
        // when
        renderProvider(null, false, "Could not check whether you are logged in.");

        // then
        expect(screen.getByText("error: Could not check whether you are logged in.")).toBeInTheDocument();
    });

    it("passes the loading flag of the session query straight through", () => {
        // when
        renderProvider(null, true);

        // then
        expect(screen.getByText("loading: true")).toBeInTheDocument();
    });

    it("sends the email, the password and the captcha token to the login mutation", async () => {
        // given
        const user = userEvent.setup();
        renderProvider(null);

        // when
        await user.click(screen.getByRole("button", { name: "log in" }));

        // then
        expect(await screen.findByText("outcome: settled")).toBeInTheDocument();
        expect(mocks.login).toHaveBeenCalledWith({
            email: "admin@example.test",
            password: "hunter2",
            turnstileToken: "token-1",
        });
    });

    it("leaves the captcha token out when the form did not collect one", async () => {
        // given
        const user = userEvent.setup();
        renderProvider(null);

        // when
        await user.click(screen.getByRole("button", { name: "log in without a captcha" }));

        // then
        expect(await screen.findByText("outcome: settled")).toBeInTheDocument();
        expect(mocks.login).toHaveBeenCalledWith({
            email: "admin@example.test",
            password: "hunter2",
            turnstileToken: undefined,
        });
    });

    it("refetches the session only after the login has gone through", async () => {
        // given
        const user = userEvent.setup();
        renderProvider(null);

        // when
        await user.click(screen.getByRole("button", { name: "log in" }));

        // then
        expect(await screen.findByText("outcome: settled")).toBeInTheDocument();
        expect(mocks.refresh).toHaveBeenCalledOnce();
        expect(mocks.refresh.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.login.mock.invocationCallOrder[0]);
    });

    it("hands a refused login back to the caller without refetching the session", async () => {
        // given
        mocks.login.mockRejectedValue(new Error("Incorrect email/password"));
        const user = userEvent.setup();
        renderProvider(null);

        // when
        await user.click(screen.getByRole("button", { name: "log in" }));

        // then
        expect(await screen.findByText("outcome: rejected")).toBeInTheDocument();
        expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it("logs out through the logout handler", async () => {
        // given
        const user = userEvent.setup();
        renderProvider(admin);

        // when
        await user.click(screen.getByRole("button", { name: "log out" }));

        // then
        expect(mocks.logout).toHaveBeenCalledOnce();
    });
});
