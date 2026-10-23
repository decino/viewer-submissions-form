import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminSubmission } from "../types/api";
import { useYoutubeLinkForm } from "./useYoutubeLinkForm";

const mocks = vi.hoisted(() => ({
    setYoutubeLink: vi.fn<(data: { id: number; link: string | null }) => Promise<unknown>>(),
    saving: false,
}));

vi.mock("./mutations/submission", () => ({
    useSetYoutubeLink: () => ({ mutateAsync: mocks.setYoutubeLink, isPending: mocks.saving }),
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

function setup(submission: AdminSubmission = makeSubmission()) {
    const onSaved = vi.fn();
    const hook = renderHook(() => useYoutubeLinkForm(submission, onSaved), { wrapper: providerWrapper() });

    return { ...hook, onSaved };
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

beforeEach(() => {
    mocks.setYoutubeLink.mockReset();
    mocks.setYoutubeLink.mockResolvedValue({
        success: true,
        description: "Submission YouTube link has been assigned.",
    });
    mocks.saving = false;
});

describe("useYoutubeLinkForm", () => {
    it("offers the fixed YouTube address to show in front of the field", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.prefix).toBe("https://www.youtube.com/");
    });

    it("starts empty and ready to remove the link when the entry has none", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.path).toBe("");
        expect(result.current.removing).toBe(true);
    });

    it("starts from the entry's current link without the fixed address", () => {
        // when
        const { result } = setup(makeSubmission({ youtubeLink: "https://www.youtube.com/watch?v=t7BW5ZiTmrE" }));

        // then
        expect(result.current.path).toBe("watch?v=t7BW5ZiTmrE");
        expect(result.current.removing).toBe(false);
    });

    it("keeps a link from elsewhere as it is", () => {
        // when
        const { result } = setup(makeSubmission({ youtubeLink: "https://youtu.be/t7BW5ZiTmrE" }));

        // then
        expect(result.current.path).toBe("https://youtu.be/t7BW5ZiTmrE");
    });

    it("saves the full link and reports it saved", async () => {
        // given
        const { result, onSaved } = setup();
        act(() => result.current.setPath(" watch?v=t7BW5ZiTmrE "));
        const event = submitEvent();

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(mocks.setYoutubeLink).toHaveBeenCalledWith({
            id: 7,
            link: "https://www.youtube.com/watch?v=t7BW5ZiTmrE",
        });
        expect(onSaved).toHaveBeenCalledOnce();
    });

    it("does not repeat the fixed address when a whole link is pasted", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setPath("https://www.youtube.com/watch?v=t7BW5ZiTmrE"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.setYoutubeLink).toHaveBeenCalledWith({
            id: 7,
            link: "https://www.youtube.com/watch?v=t7BW5ZiTmrE",
        });
    });

    it("removes the link when the field is left blank", async () => {
        // given
        const { result } = setup(makeSubmission({ youtubeLink: "https://www.youtube.com/watch?v=t7BW5ZiTmrE" }));
        act(() => result.current.setPath("   "));
        expect(result.current.removing).toBe(true);

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.setYoutubeLink).toHaveBeenCalledWith({ id: 7, link: null });
    });

    it("reports the server's message and stays unsaved when the link is refused", async () => {
        // given
        mocks.setYoutubeLink.mockRejectedValue(new Error("Unable to find submission with id 7."));
        const { result, onSaved } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Unable to find submission with id 7.");
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("says what failed when the refusal carries no message", async () => {
        // given
        mocks.setYoutubeLink.mockRejectedValue(new Error(""));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("The YouTube link could not be saved.");
    });

    it("clears an earlier error when it saves again", async () => {
        // given
        mocks.setYoutubeLink.mockRejectedValueOnce(new Error("Unable to find submission with id 7."));
        const { result } = setup();
        await act(() => result.current.submit(submitEvent()));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBeNull();
    });

    it("reports the save as in flight while the link is being saved", () => {
        // given
        mocks.saving = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.saving).toBe(true);
    });
});
