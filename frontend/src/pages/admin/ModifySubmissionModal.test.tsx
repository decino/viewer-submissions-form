import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModifyDraft, useModifySubmissionForm } from "../../hooks/useModifySubmissionForm";
import { renderWithProviders } from "../../test-utils/render";
import { ModifySubmissionModal } from "./ModifySubmissionModal";

type ModifyForm = ReturnType<typeof useModifySubmissionForm>;

const mocks = vi.hoisted(() => ({
    useModifySubmissionForm: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("../../hooks/useModifySubmissionForm", () => ({ useModifySubmissionForm: mocks.useModifySubmissionForm }));

function makeDraft(overrides: Partial<ModifyDraft> = {}): ModifyDraft {
    return {
        wadUrl: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        wadName: "Sunlust",
        level: "MAP12",
        engine: 11,
        authorName: "doomguy",
        author: true,
        distributable: false,
        recordedFormat: "Practised",
        ...overrides,
    };
}

function stubForm(overrides: Partial<ModifyForm> = {}): void {
    const form: ModifyForm = {
        loading: false,
        loadError: null,
        draft: makeDraft(),
        hasWadUrl: true,
        update: mocks.update,
        submit: mocks.submit,
        saving: false,
        error: null,
        ...overrides,
    };
    mocks.useModifySubmissionForm.mockReturnValue(form);
}

function setup(submissionId: number | null = 7) {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ModifySubmissionModal submissionId={submissionId} onClose={onClose} />);

    return { onClose, user };
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.submit.mockImplementation((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
    stubForm();
});

describe("ModifySubmissionModal", () => {
    it("stays closed and loads nothing while no submission is picked", () => {
        // when
        setup(null);

        // then
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(mocks.useModifySubmissionForm).not.toHaveBeenCalled();
    });

    it("works on the submission it was given and closes once saved", () => {
        // when
        const { onClose } = setup(12);

        // then
        expect(mocks.useModifySubmissionForm).toHaveBeenCalledWith(12, onClose);
    });

    it("says it is loading while the submission is on its way", () => {
        // given
        stubForm({ loading: true, draft: null });

        // when
        setup();

        // then
        expect(screen.getByText("Loading the submission...")).toBeInTheDocument();
    });

    it("shows why the submission could not be loaded instead of a form", () => {
        // given
        stubForm({ loadError: "Could not load the submission.", draft: null });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the submission.");
        expect(screen.queryByText(/could not be found/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    });

    it("says the submission could not be found when the server has none with that ID", () => {
        // given
        stubForm({ draft: null });

        // when
        setup();

        // then
        expect(screen.getByText("This submission could not be found.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    });

    it("fills every field from the draft", () => {
        // when
        setup();

        // then
        expect(screen.getByRole("dialog", { name: "Modify submission" })).toBeInTheDocument();
        expect(screen.getByLabelText("WAD download URL")).toHaveValue(
            "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        );
        expect(screen.getByLabelText("WAD name")).toHaveValue("Sunlust");
        expect(screen.getByLabelText("Level")).toHaveValue("MAP12");
        expect(screen.getByLabelText("Map compatibility")).toHaveValue("11");
        expect(screen.getByLabelText("Submitter name")).toHaveValue("doomguy");
        const author = within(screen.getByRole("group", { name: "Did the submitter make this level?" }));
        expect(author.getByRole("radio", { name: "Yes" })).toBeChecked();
        const sharing = within(screen.getByRole("group", { name: "May it be shared with viewers?" }));
        expect(sharing.getByRole("radio", { name: "No" })).toBeChecked();
        const format = within(screen.getByRole("group", { name: "Recording format" }));
        expect(format.getByRole("radio", { name: "Practised" })).toBeChecked();
    });

    it("leaves out the WAD URL field when the entry has an uploaded file instead", () => {
        // given
        stubForm({ hasWadUrl: false });

        // when
        setup();

        // then
        expect(screen.queryByLabelText("WAD download URL")).not.toBeInTheDocument();
    });

    it("only asks about sharing while the submitter is marked as the author", () => {
        // given
        stubForm({ draft: makeDraft({ author: false }) });

        // when
        setup();

        // then
        expect(screen.queryByRole("group", { name: "May it be shared with viewers?" })).not.toBeInTheDocument();
    });

    it("hands each choice to the draft", async () => {
        // given
        const { user } = setup();
        const author = within(screen.getByRole("group", { name: "Did the submitter make this level?" }));
        const sharing = within(screen.getByRole("group", { name: "May it be shared with viewers?" }));
        const format = within(screen.getByRole("group", { name: "Recording format" }));

        // when
        await user.click(author.getByRole("radio", { name: "No" }));
        await user.click(sharing.getByRole("radio", { name: "Yes" }));
        await user.click(format.getByRole("radio", { name: "Blind" }));
        await user.selectOptions(screen.getByLabelText("Map compatibility"), "Boom");

        // then
        expect(mocks.update.mock.calls).toEqual([
            ["author", false],
            ["distributable", true],
            ["recordedFormat", "Blind"],
            ["engine", 9],
        ]);
    });

    it("hands each typed field to the draft", async () => {
        // given
        const { user } = setup();

        // when
        await user.clear(screen.getByLabelText("WAD download URL"));
        await user.clear(screen.getByLabelText("WAD name"));
        await user.clear(screen.getByLabelText("Level"));
        await user.clear(screen.getByLabelText("Submitter name"));

        // then
        expect(mocks.update.mock.calls).toEqual([
            ["wadUrl", ""],
            ["wadName", ""],
            ["level", ""],
            ["authorName", ""],
        ]);
    });

    it("submits the form when the changes are saved", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Save changes" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("holds the save button while the changes are being saved", () => {
        // given
        stubForm({ saving: true });

        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    it("shows why the changes were refused", () => {
        // given
        stubForm({ error: "Unable to find submission of id 7." });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Unable to find submission of id 7.");
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
