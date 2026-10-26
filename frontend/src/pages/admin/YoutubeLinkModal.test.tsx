import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useYoutubeLinkForm } from "../../hooks/useYoutubeLinkForm";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminSubmission } from "../../types/api";
import { YoutubeLinkModal } from "./YoutubeLinkModal";

type LinkForm = ReturnType<typeof useYoutubeLinkForm>;

const mocks = vi.hoisted(() => ({
    useYoutubeLinkForm: vi.fn(),
    setPath: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("../../hooks/useYoutubeLinkForm", () => ({ useYoutubeLinkForm: mocks.useYoutubeLinkForm }));

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
        status: { status: "Completed", additionalInfo: null, submissionId: 7 },
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

function stubForm(overrides: Partial<LinkForm> = {}): void {
    const form: LinkForm = {
        prefix: "https://www.youtube.com/",
        path: "watch?v=t7BW5ZiTmrE",
        setPath: mocks.setPath,
        removing: false,
        error: null,
        saving: false,
        submit: mocks.submit,
        ...overrides,
    };
    mocks.useYoutubeLinkForm.mockReturnValue(form);
}

function setup(submission: AdminSubmission | null = makeSubmission()) {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<YoutubeLinkModal submission={submission} onClose={onClose} />);

    return { onClose, user };
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.submit.mockImplementation((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
    stubForm();
});

describe("YoutubeLinkModal", () => {
    it("stays closed while no submission is picked", () => {
        // when
        setup(null);

        // then
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(mocks.useYoutubeLinkForm).not.toHaveBeenCalled();
    });

    it("works on the submission it was given and closes once saved", () => {
        // given
        const submission = makeSubmission();

        // when
        const { onClose } = setup(submission);

        // then
        expect(mocks.useYoutubeLinkForm).toHaveBeenCalledWith(submission, onClose);
    });

    it("names the WAD whose playthrough is being added", () => {
        // when
        setup();

        // then
        expect(screen.getByRole("dialog", { name: "Set YouTube link" })).toHaveTextContent(
            "Add the playthrough of Sunlust once the video is published.",
        );
    });

    it("shows the fixed YouTube address in front of the field", () => {
        // when
        setup();

        // then
        expect(screen.getByLabelText("Video address")).toHaveAccessibleDescription("https://www.youtube.com/");
    });

    it("shows the form's link and hands every edit to it", async () => {
        // given
        const { user } = setup();
        expect(screen.getByLabelText("Video address")).toHaveValue("watch?v=t7BW5ZiTmrE");

        // when
        await user.clear(screen.getByLabelText("Video address"));

        // then
        expect(mocks.setPath).toHaveBeenCalledWith("");
    });

    it("saves the link when there is one", async () => {
        // given
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Save link" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("offers to remove the link when the field is blank", () => {
        // given
        stubForm({ path: "", removing: true });

        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Remove link" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save link" })).not.toBeInTheDocument();
    });

    it("holds the button while the link is being saved", () => {
        // given
        stubForm({ saving: true });

        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Save link" })).toBeDisabled();
    });

    it("shows why the link was refused", () => {
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
