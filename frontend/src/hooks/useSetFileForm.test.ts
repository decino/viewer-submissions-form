import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminSubmission } from "../types/api";
import { useSetFileForm } from "./useSetFileForm";

const mocks = vi.hoisted(() => ({
    useUploadConfig: vi.fn(),
    modify: vi.fn<(formData: FormData) => Promise<void>>(),
    modifying: false,
}));

vi.mock("./queries/site", () => ({ useUploadConfig: mocks.useUploadConfig }));

vi.mock("./mutations/submission", () => ({
    useModifyEntry: () => ({ mutateAsync: mocks.modify, isPending: mocks.modifying }),
}));

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

function setup(submission: AdminSubmission = makeSubmission()) {
    return renderHook(() => useSetFileForm(submission), { wrapper: providerWrapper() });
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function sent(): FormData {
    const formData = mocks.modify.mock.lastCall?.[0];
    if (!formData) {
        throw new Error("No file was sent");
    }

    return formData;
}

const wadFile = new File(["PWAD"], "sunlust.wad", { type: "application/octet-stream" });

beforeEach(() => {
    mocks.modify.mockReset();
    mocks.modify.mockResolvedValue(undefined);
    mocks.modifying = false;
    mocks.useUploadConfig.mockReturnValue({
        upload: { fileSizeLimitMb: 100, allowedExtensions: ["wad", "zip"] },
        loading: false,
        error: null,
    });
});

describe("useSetFileForm", () => {
    it("asks before replacing an entry's WAD URL with a file", () => {
        // when
        const { result } = setup(makeSubmission({ WAD: "https://example.test/sunlust.zip", customWad: null }));

        // then
        expect(result.current.needsConfirmation).toBe(true);
    });

    it("asks for the file once replacing the URL is accepted", () => {
        // given
        const { result } = setup(makeSubmission({ WAD: "https://example.test/sunlust.zip", customWad: null }));

        // when
        act(() => result.current.confirmReplace());

        // then
        expect(result.current.needsConfirmation).toBe(false);
    });

    it("asks for the file straight away when the entry has no WAD URL", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.needsConfirmation).toBe(false);
    });

    it("accepts only the file types the site allows", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.accept).toBe(".wad,.zip");
        expect(result.current.configError).toBeNull();
    });

    it("passes on why the upload settings could not be loaded", () => {
        // given
        mocks.useUploadConfig.mockReturnValue({
            upload: null,
            loading: false,
            error: "Could not load the upload settings.",
        });

        // when
        const { result } = setup();

        // then
        expect(result.current.configError).toBe("Could not load the upload settings.");
        expect(result.current.accept).toBeUndefined();
    });

    it("cannot upload until a file is chosen", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.canUpload).toBe(false);
    });

    it("sends nothing while no file is chosen", async () => {
        // given
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.modify).not.toHaveBeenCalled();
    });

    it("uploads the chosen file for the entry and says it was replaced", async () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseFile(wadFile));
        expect(result.current.canUpload).toBe(true);
        const event = submitEvent();

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(sent().get("id")).toBe("7");
        expect(sent().get("file")).toBe(wadFile);
        expect(result.current.replaced).toBe(true);
    });

    it("forgets the earlier replacement once another file is chosen", async () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseFile(wadFile));
        await act(() => result.current.submit(submitEvent()));

        // when
        act(() => result.current.chooseFile(new File(["PK"], "sunlust.zip")));

        // then
        expect(result.current.replaced).toBe(false);
    });

    it("reports the server's message when the file is refused", async () => {
        // given
        mocks.modify.mockRejectedValue(new Error("Invalid WAD header"));
        const { result } = setup();
        act(() => result.current.chooseFile(wadFile));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Invalid WAD header");
        expect(result.current.replaced).toBe(false);
    });

    it("says what failed when the refusal carries no message", async () => {
        // given
        mocks.modify.mockRejectedValue(new Error(""));
        const { result } = setup();
        act(() => result.current.chooseFile(wadFile));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("The file could not be uploaded.");
    });

    it("clears an earlier error when it uploads again", async () => {
        // given
        mocks.modify.mockRejectedValueOnce(new Error("Invalid WAD header"));
        const { result } = setup();
        act(() => result.current.chooseFile(wadFile));
        await act(() => result.current.submit(submitEvent()));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBeNull();
        expect(result.current.replaced).toBe(true);
    });

    it("cannot upload again while the file is on its way", () => {
        // given
        mocks.modifying = true;
        const { result } = setup();

        // when
        act(() => result.current.chooseFile(wadFile));

        // then
        expect(result.current.canUpload).toBe(false);
    });
});
