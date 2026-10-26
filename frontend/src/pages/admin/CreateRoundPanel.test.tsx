import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useCreateRoundForm } from "../../hooks/useCreateRoundForm";
import { renderWithProviders } from "../../test-utils/render";
import { CreateRoundPanel } from "./CreateRoundPanel";

const mocks = vi.hoisted(() => ({
    useCreateRoundForm: vi.fn(),
    setName: vi.fn(),
    pickEndDate: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("../../hooks/useCreateRoundForm", () => ({ useCreateRoundForm: mocks.useCreateRoundForm }));

type CreateRoundForm = ReturnType<typeof useCreateRoundForm>;

function stubForm(overrides: Partial<CreateRoundForm> = {}): void {
    const form: CreateRoundForm = {
        name: "",
        setName: mocks.setName,
        pickEndDate: mocks.pickEndDate,
        error: null,
        creating: false,
        submit: mocks.submit,
        ...overrides,
    };
    mocks.useCreateRoundForm.mockReturnValue(form);
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.submit.mockImplementation((event: { preventDefault: () => void }) => event.preventDefault());
    stubForm();
});

describe("CreateRoundPanel", () => {
    it("says nobody can submit until a round exists", () => {
        // when
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // then
        expect(screen.getByRole("heading", { name: "No round is open" })).toBeInTheDocument();
        expect(screen.getByText("Nobody can submit a WAD until you create a round.")).toBeInTheDocument();
    });

    it("hands its created callback to the form", () => {
        // given
        const onCreated = vi.fn();

        // when
        renderWithProviders(<CreateRoundPanel onCreated={onCreated} />);

        // then
        expect(mocks.useCreateRoundForm).toHaveBeenCalledWith(onCreated);
    });

    it("shows the name typed so far", () => {
        // given
        stubForm({ name: "Round 43" });

        // when
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // then
        expect(screen.getByLabelText("Round name")).toHaveValue("Round 43");
    });

    it("passes on the name as it is typed", () => {
        // given
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // when
        fireEvent.change(screen.getByLabelText("Round name"), { target: { value: "Round 43" } });

        // then
        expect(mocks.setName).toHaveBeenCalledWith("Round 43");
    });

    it("passes on the picked deadline as a timestamp", () => {
        // given
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // when
        fireEvent.change(screen.getByLabelText("Deadline (optional)"), { target: { value: "2026-12-25" } });

        // then
        expect(mocks.pickEndDate).toHaveBeenCalledWith(Date.UTC(2026, 11, 25));
    });

    it("creates the round when the button is pressed", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // when
        await user.click(screen.getByRole("button", { name: "Create round" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("shows why the round was refused", () => {
        // given
        stubForm({ error: "The deadline can't be in the past" });

        // when
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("The deadline can't be in the past");
    });

    it("disables creating while the round is being sent", () => {
        // given
        stubForm({ creating: true });

        // when
        renderWithProviders(<CreateRoundPanel onCreated={vi.fn()} />);

        // then
        expect(screen.getByRole("button", { name: "Create round" })).toBeDisabled();
    });
});
