import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useSetFileForm } from "../../hooks/useSetFileForm";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminSubmission } from "../../types/api";
import { SetFileModal } from "./SetFileModal";

type FileForm = ReturnType<typeof useSetFileForm>;

const mocks = vi.hoisted(() => ({
    useSetFileForm: vi.fn(),
    confirmReplace: vi.fn(),
    chooseFile: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("../../hooks/useSetFileForm", () => ({ useSetFileForm: mocks.useSetFileForm }));

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: null,
        submissionRoundId: 4,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: null,
        WAD: null,
        engine: 11,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: "sunlust.zip",
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function stubForm(overrides: Partial<FileForm> = {}): void {
    const form: FileForm = {
        needsConfirmation: false,
        confirmReplace: mocks.confirmReplace,
        accept: ".wad,.zip",
        configError: null,
        chooseFile: mocks.chooseFile,
        canUpload: false,
        error: null,
        replaced: false,
        submit: mocks.submit,
        ...overrides,
    };
    mocks.useSetFileForm.mockReturnValue(form);
}

function setup(submission: AdminSubmission | null = makeSubmission()) {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<SetFileModal submission={submission} onClose={onClose} />);

    return { onClose, user };
}

const wadFile = new File(["PWAD"], "sunlust.wad", { type: "application/octet-stream" });

beforeEach(() => {
    vi.resetAllMocks();
    mocks.submit.mockImplementation((event: SubmitEvent<HTMLFormElement>) => event.preventDefault());
    stubForm();
});

describe("SetFileModal", () => {
    it("stays closed while no submission is picked", () => {
        // when
        setup(null);

        // then
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(mocks.useSetFileForm).not.toHaveBeenCalled();
    });

    it("works on the submission it was given", () => {
        // given
        const submission = makeSubmission();

        // when
        setup(submission);

        // then
        expect(mocks.useSetFileForm).toHaveBeenCalledWith(submission);
    });

    it("asks before replacing an entry's WAD URL with a file", () => {
        // given
        stubForm({ needsConfirmation: true });

        // when
        setup();

        // then
        expect(screen.getByRole("dialog", { name: "Replace the WAD URL" })).toHaveTextContent(
            "This entry links to a WAD URL. Replace it with an uploaded file?",
        );
        expect(screen.queryByLabelText("WAD file for Sunlust")).not.toBeInTheDocument();
    });

    it("accepts replacing the URL when told to", async () => {
        // given
        stubForm({ needsConfirmation: true });
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Upload a file" }));

        // then
        expect(mocks.confirmReplace).toHaveBeenCalledOnce();
    });

    it("closes without asking for a file when replacing the URL is declined", async () => {
        // given
        stubForm({ needsConfirmation: true });
        const { user, onClose } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        // then
        expect(onClose).toHaveBeenCalledOnce();
        expect(mocks.confirmReplace).not.toHaveBeenCalled();
    });

    it("accepts only the file types the form allows", () => {
        // when
        setup();

        // then
        expect(screen.getByRole("dialog", { name: "Set file" })).toBeInTheDocument();
        expect(screen.getByLabelText("WAD file for Sunlust")).toHaveAttribute("accept", ".wad,.zip");
    });

    it("shows why the upload settings could not be loaded", () => {
        // given
        stubForm({ configError: "Could not load the upload settings.", accept: undefined });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the upload settings.");
    });

    it("hands the chosen file to the form", async () => {
        // given
        const { user } = setup();

        // when
        await user.upload(screen.getByLabelText("WAD file for Sunlust"), wadFile);

        // then
        expect(mocks.chooseFile).toHaveBeenCalledWith(wadFile);
    });

    it("keeps the upload button off until the form can upload", () => {
        // when
        setup();

        // then
        expect(screen.getByRole("button", { name: "Upload file" })).toBeDisabled();
    });

    it("submits the form when the file is uploaded", async () => {
        // given
        stubForm({ canUpload: true });
        const { user } = setup();

        // when
        await user.click(screen.getByRole("button", { name: "Upload file" }));

        // then
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("says the file was replaced and offers to finish", () => {
        // given
        stubForm({ replaced: true });

        // when
        setup();

        // then
        expect(screen.getByRole("status")).toHaveTextContent("File replaced.");
        expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    });

    it("shows why the file was refused", () => {
        // given
        stubForm({ error: "Invalid WAD header" });

        // when
        setup();

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid WAD header");
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("closes when it is cancelled", async () => {
        // given
        const { user, onClose } = setup();

        // when
        await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

        // then
        expect(onClose).toHaveBeenCalledOnce();
        expect(mocks.submit).not.toHaveBeenCalled();
    });
});
