import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useChangeDetailsForm } from "../../hooks/useChangeDetailsForm";
import { renderWithProviders } from "../../test-utils/render";
import { AccountSettings } from "./AccountSettings";

const mocks = vi.hoisted(() => ({
    useChangeDetailsForm: vi.fn(),
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setConfirmation: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("../../hooks/useChangeDetailsForm", () => ({ useChangeDetailsForm: mocks.useChangeDetailsForm }));

type ChangeDetailsForm = ReturnType<typeof useChangeDetailsForm>;

function stubForm(overrides: Partial<ChangeDetailsForm> = {}): void {
    const form: ChangeDetailsForm = {
        email: "decino@example.test",
        setEmail: mocks.setEmail,
        password: "",
        setPassword: mocks.setPassword,
        confirmation: "",
        setConfirmation: mocks.setConfirmation,
        error: null,
        saved: false,
        saving: false,
        submit: mocks.submit,
        ...overrides,
    };
    mocks.useChangeDetailsForm.mockReturnValue(form);
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.submit.mockImplementation((event: { preventDefault: () => void }) => event.preventDefault());
    stubForm();
});

describe("AccountSettings", () => {
    it("shows the email address and passwords typed so far", () => {
        // given
        stubForm({ password: "cyberdemon", confirmation: "cyberdem" });

        // when
        renderWithProviders(<AccountSettings />);

        // then
        expect(screen.getByLabelText("Email address")).toHaveValue("decino@example.test");
        expect(screen.getByLabelText("New password")).toHaveValue("cyberdemon");
        expect(screen.getByLabelText("Confirm new password")).toHaveValue("cyberdem");
    });

    it("passes on each field as it is typed", () => {
        // given
        renderWithProviders(<AccountSettings />);

        // when
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "doomguy@example.test" } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "cyberdemon" } });
        fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "spidermastermind" } });

        // then
        expect(mocks.setEmail).toHaveBeenCalledWith("doomguy@example.test");
        expect(mocks.setPassword).toHaveBeenCalledWith("cyberdemon");
        expect(mocks.setConfirmation).toHaveBeenCalledWith("spidermastermind");
    });

    it("saves the details when the button is pressed", async () => {
        // given
        const typist = userEvent.setup();
        renderWithProviders(<AccountSettings />);

        // when
        await typist.click(screen.getByRole("button", { name: "Save details" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("confirms the details were changed", () => {
        // given
        stubForm({ saved: true });

        // when
        renderWithProviders(<AccountSettings />);

        // then
        expect(screen.getByRole("status")).toHaveTextContent("Your login details were changed.");
    });

    it("says nothing about the change before it is saved", () => {
        // when
        renderWithProviders(<AccountSettings />);

        // then
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows why the change was refused", () => {
        // given
        stubForm({ error: "Email is already in use" });

        // when
        renderWithProviders(<AccountSettings />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Email is already in use");
    });

    it("disables saving while the details are being sent", () => {
        // given
        stubForm({ saving: true });

        // when
        renderWithProviders(<AccountSettings />);

        // then
        expect(screen.getByRole("button", { name: "Save details" })).toBeDisabled();
    });
});
