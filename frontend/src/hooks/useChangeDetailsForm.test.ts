import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { SessionUser } from "../types/api";
import { useChangeDetailsForm } from "./useChangeDetailsForm";

const mocks = vi.hoisted(() => ({
    changeDetails: vi.fn(),
    saving: false,
}));

vi.mock("./mutations/auth", () => ({
    useChangeDetails: () => ({ mutateAsync: mocks.changeDetails, isPending: mocks.saving }),
}));

const admin: SessionUser = { id: "1", email: "decino@example.test" };

function setup(user: SessionUser | null = admin) {
    return renderHook(() => useChangeDetailsForm(), { wrapper: providerWrapper({ user }) });
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function typePasswords(
    result: { current: ReturnType<typeof useChangeDetailsForm> },
    password: string,
    confirmation: string,
): void {
    act(() => result.current.setPassword(password));
    act(() => result.current.setConfirmation(confirmation));
}

beforeEach(() => {
    mocks.saving = false;
    mocks.changeDetails.mockReset();
    mocks.changeDetails.mockResolvedValue({ success: true });
});

describe("useChangeDetailsForm", () => {
    it("fills in the email address the admin logs in with", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.email).toBe("decino@example.test");
        expect(result.current.password).toBe("");
        expect(result.current.confirmation).toBe("");
        expect(result.current.error).toBeNull();
        expect(result.current.saved).toBe(false);
    });

    it("starts with an empty email address when nobody is logged in", () => {
        // when
        const { result } = setup(null);

        // then
        expect(result.current.email).toBe("");
    });

    it("sends the trimmed email address and the new password once both passwords match", async () => {
        // given
        const { result } = setup();
        const event = submitEvent();
        act(() => result.current.setEmail(" doomguy@example.test "));
        typePasswords(result, "cyberdemon", "cyberdemon");

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalled();
        expect(mocks.changeDetails).toHaveBeenCalledWith({ email: "doomguy@example.test", password: "cyberdemon" });
    });

    it("empties both password fields and confirms the change once the details are changed", async () => {
        // given
        const { result } = setup();
        typePasswords(result, "cyberdemon", "cyberdemon");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.password).toBe("");
        expect(result.current.confirmation).toBe("");
        expect(result.current.saved).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("refuses an empty email address", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setEmail("  "));
        typePasswords(result, "cyberdemon", "cyberdemon");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Enter the email address you want to log in with");
        expect(mocks.changeDetails).not.toHaveBeenCalled();
    });

    it("refuses a blank password", async () => {
        // given
        const { result } = setup();
        typePasswords(result, "   ", "   ");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Enter a new password");
        expect(mocks.changeDetails).not.toHaveBeenCalled();
    });

    it("refuses passwords that do not match", async () => {
        // given
        const { result } = setup();
        typePasswords(result, "cyberdemon", "spidermastermind");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("The passwords don't match. Type the same password in both fields.");
        expect(mocks.changeDetails).not.toHaveBeenCalled();
    });

    it("hands back the server's reason and keeps the passwords when the change is refused", async () => {
        // given
        mocks.changeDetails.mockRejectedValue(new Error("Email is already in use"));
        const { result } = setup();
        typePasswords(result, "cyberdemon", "cyberdemon");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Email is already in use");
        expect(result.current.password).toBe("cyberdemon");
        expect(result.current.saved).toBe(false);
    });

    it("says the details could not be changed when the failure carries no message", async () => {
        // given
        mocks.changeDetails.mockRejectedValue({});
        const { result } = setup();
        typePasswords(result, "cyberdemon", "cyberdemon");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Could not change your login details.");
    });

    it("forgets the earlier confirmation once the details are sent again", async () => {
        // given
        const { result } = setup();
        typePasswords(result, "cyberdemon", "cyberdemon");
        await act(() => result.current.submit(submitEvent()));
        typePasswords(result, "cyberdemon", "baron");

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.saved).toBe(false);
    });

    it("reports saving while the request is in flight", () => {
        // given
        mocks.saving = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.saving).toBe(true);
    });
});
