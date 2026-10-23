import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminSubmission } from "../types/api";
import { useModifySubmissionForm } from "./useModifySubmissionForm";

const mocks = vi.hoisted(() => ({
    useAdminSubmission: vi.fn(),
    modify: vi.fn<(formData: FormData) => Promise<void>>(),
    modifyPending: false,
}));

vi.mock("./queries/admin", () => ({ useAdminSubmission: mocks.useAdminSubmission }));

vi.mock("./mutations/submission", () => ({
    useModifyEntry: () => ({ mutateAsync: mocks.modify, isPending: mocks.modifyPending }),
}));

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: "doomguy",
        submissionRoundId: 4,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: "dsda-doom",
        WAD: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        engine: 11,
        gzDoomAction: null,
        author: true,
        distributable: true,
        info: null,
        customWad: null,
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function stubSubmission(submission: AdminSubmission | null, loading = false, error: string | null = null): void {
    mocks.useAdminSubmission.mockReturnValue({ submission, loading, error });
}

function setup(submissionId = 7) {
    const onSaved = vi.fn();
    const hook = renderHook(() => useModifySubmissionForm(submissionId, onSaved), { wrapper: providerWrapper() });

    return { ...hook, onSaved };
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function sentFields(): [string, FormDataEntryValue][] {
    const formData = mocks.modify.mock.lastCall?.[0];
    if (!formData) {
        throw new Error("No change was sent");
    }

    return Array.from(formData.entries());
}

beforeEach(() => {
    mocks.modify.mockReset();
    mocks.modify.mockResolvedValue(undefined);
    mocks.modifyPending = false;
    stubSubmission(makeSubmission());
});

describe("useModifySubmissionForm", () => {
    it("asks for the submission it was given", () => {
        // when
        setup(12);

        // then
        expect(mocks.useAdminSubmission).toHaveBeenCalledWith(12);
    });

    it("has no draft while the submission is loading", () => {
        // given
        stubSubmission(null, true);

        // when
        const { result } = setup();

        // then
        expect(result.current.loading).toBe(true);
        expect(result.current.draft).toBeNull();
    });

    it("passes on why the submission could not be loaded", () => {
        // given
        stubSubmission(null, false, "Could not load the submission.");

        // when
        const { result } = setup();

        // then
        expect(result.current.loadError).toBe("Could not load the submission.");
        expect(result.current.draft).toBeNull();
    });

    it("fills the draft from the saved submission", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.draft).toEqual({
            wadUrl: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
            wadName: "Sunlust",
            level: "MAP12",
            engine: 11,
            authorName: "doomguy",
            author: true,
            distributable: true,
            recordedFormat: "Practised",
        });
        expect(result.current.hasWadUrl).toBe(true);
        expect(result.current.loadError).toBeNull();
    });

    it("treats an entry the submitter did not make as not distributable", () => {
        // given
        stubSubmission(makeSubmission({ author: false, distributable: true }));

        // when
        const { result } = setup();

        // then
        expect(result.current.draft?.distributable).toBe(false);
    });

    it("knows when the entry has no WAD URL to edit", () => {
        // given
        stubSubmission(makeSubmission({ WAD: null, customWad: "sunlust.zip" }));

        // when
        const { result } = setup();

        // then
        expect(result.current.hasWadUrl).toBe(false);
        expect(result.current.draft?.wadUrl).toBe("");
    });

    it("keeps an edited field over the saved value", () => {
        // given
        const { result } = setup();

        // when
        act(() => {
            result.current.update("level", "MAP27");
        });

        // then
        expect(result.current.draft?.level).toBe("MAP27");
        expect(result.current.draft?.wadName).toBe("Sunlust");
    });

    it("sends every edited field of the entry and reports it saved", async () => {
        // given
        const { result, onSaved } = setup();
        act(() => {
            result.current.update("wadName", "Sunlust (fixed)");
            result.current.update("engine", -1);
            result.current.update("recordedFormat", "Blind");
        });
        const event = submitEvent();

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(sentFields()).toEqual([
            ["id", "7"],
            ["WADName", "Sunlust (fixed)"],
            ["WAD", "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust"],
            ["level", "MAP12"],
            ["engine", "-1"],
            ["author", "true"],
            ["distributable", "true"],
            ["recordedFormat", "Blind"],
            ["authorName", "doomguy"],
        ]);
        expect(onSaved).toHaveBeenCalledOnce();
    });

    it("leaves out the WAD URL when the entry has an uploaded file instead", async () => {
        // given
        stubSubmission(makeSubmission({ WAD: null, customWad: "sunlust.zip" }));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(sentFields().map(([name]) => name)).not.toContain("WAD");
    });

    it("leaves out distributable when the submitter did not make the level", async () => {
        // given
        const { result } = setup();
        act(() => {
            result.current.update("author", false);
        });

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(sentFields()).toContainEqual(["author", "false"]);
        expect(sentFields().map(([name]) => name)).not.toContain("distributable");
    });

    it("leaves out a blank submitter name so the entry becomes anonymous", async () => {
        // given
        const { result } = setup();
        act(() => {
            result.current.update("authorName", "   ");
        });

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(sentFields().map(([name]) => name)).not.toContain("authorName");
    });

    it("reports the server's message and stays unsaved when the change is refused", async () => {
        // given
        mocks.modify.mockRejectedValue(new Error("Unable to find submission of id 7."));
        const { result, onSaved } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Unable to find submission of id 7.");
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("says what failed when the refusal carries no message", async () => {
        // given
        mocks.modify.mockRejectedValue(new Error(""));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("The changes could not be saved.");
    });

    it("clears an earlier error when it saves again", async () => {
        // given
        mocks.modify.mockRejectedValueOnce(new Error("Unable to find submission of id 7."));
        const { result } = setup();
        await act(() => result.current.submit(submitEvent()));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBeNull();
    });

    it("sends nothing while there is no submission to change", async () => {
        // given
        stubSubmission(null);
        const { result, onSaved } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.modify).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("reports the save as in flight while the mutation is pending", () => {
        // given
        mocks.modifyPending = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.saving).toBe(true);
    });
});
