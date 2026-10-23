import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useChangeStatusForm } from "../../hooks/useChangeStatusForm";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminSubmission } from "../../types/api";
import { ChangeStatusModal } from "./ChangeStatusModal";

type StatusForm = ReturnType<typeof useChangeStatusForm>;

const mocks = vi.hoisted(() => ({
    useChangeStatusForm: vi.fn(),
    chooseStatus: vi.fn(),
    setComments: vi.fn(),
    setPickAnother: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("../../hooks/useChangeStatusForm", () => ({ useChangeStatusForm: mocks.useChangeStatusForm }));

const PICK_ANOTHER = "Pick another random entry for this round";

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: null,
        submissionRoundId: 4,
        playOrder: 1,
        youtubeLink: null,
        status: { status: "In Progress", additionalInfo: "Halfway through", submissionId: 7 },
        chosen: true,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: null,
        WAD: null,
        engine: 11,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: null,
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function stubForm(overrides: Partial<StatusForm> = {}): void {
    const form: StatusForm = {
        status: "In Progress",
        chooseStatus: mocks.chooseStatus,
        comments: "Halfway through",
        setComments: mocks.setComments,
        canPickAnother: false,
        pickAnother: false,
        setPickAnother: mocks.setPickAnother,
        error: null,
        saving: false,
        submit: mocks.submit,
        ...overrides,
    };
    mocks.useChangeStatusForm.mockReturnValue(form);
}

function setup(submission: AdminSubmission | null = makeSubmission()) {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChangeStatusModal submission={submission} onClose={onClose} />);

    return { onClose, user };
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.submit.mockImplementation((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
    stubForm();
});

describe("ChangeStatusModal", () => {
    it("stays closed while no submission is picked", () => {
        // when
        setup(null);

        // then
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(mocks.useChangeStatusForm).not.toHaveBeenCalled();
    });

    it("works on the submission it was given and closes once saved", () => {
        // given
        const submission = makeSubmission();

        // when
        const { onClose } = setup(submission);

        // then
        expect(mocks.useChangeStatusForm).toHaveBeenCalledWith(submission, onClose);
    });

    it("shows the status and comment of the form", () => {
        // when
        setup();

        // then
        expect(screen.getByRole("dialog", { name: "Change status" })).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toHaveValue("In Progress");
        expect(screen.getByLabelText("Comments")).toHaveValue("Halfway through");
    });

    it("offers every status", () => {
        // when
        setup();

        // then
        expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual([
            "Queued",
            "In Progress",
            "Rejected",
            "Completed",
        ]);
    });

    it("hands the picked status to the form", async () => {
        // given
        const { user } = setup();

        // when
        await user.selectOptions(screen.getByLabelText("Status"), "Rejected");

        // then
        expect(mocks.chooseStatus).toHaveBeenCalledWith("Rejected");
    });

    it("hands the edited comment to the form", async () => {
        // given
        const { user } = setup();

        // when
        await user.clear(screen.getByLabelText("Comments"));

        // then
        expect(mocks.setComments).toHaveBeenCalledWith("");
    });

    it("leaves out picking another entry until it is allowed", () => {
        // when
        setup();

        // then
        expect(screen.queryByLabelText(PICK_ANOTHER)).not.toBeInTheDocument();
    });

    it("offers to pick another entry once it is allowed and hands the choice to the form", async () => {
        // given
        stubForm({ status: "Rejected", canPickAnother: true });
        const { user } = setup();
        expect(screen.getByLabelText(PICK_ANOTHER)).not.toBeChecked();

        // when
        await user.click(screen.getByLabelText(PICK_ANOTHER));

        // then
        expect(mocks.setPickAnother).toHaveBeenCalledWith(true);
    });

    it("submits the form when the status is changed", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Change status" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("holds the button while the change is being saved", () => {
        // given
        stubForm({ saving: true });

        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Change status" })).toBeDisabled();
    });

    it("shows why the change failed", () => {
        // given
        stubForm({ error: "Unable to find submission with id 7." });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Unable to find submission with id 7.");
    });

    it("closes without saving when it is cancelled", async () => {
        // given
        const { user, onClose } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        // then
        expect(onClose).toHaveBeenCalledOnce();
        expect(mocks.submit).not.toHaveBeenCalled();
    });
});
