import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminSubmission, SubmissionStatusChange } from "../types/api";
import { useChangeStatusForm } from "./useChangeStatusForm";

const mocks = vi.hoisted(() => ({
    changeStatus: vi.fn<(change: SubmissionStatusChange) => Promise<unknown>>(),
    addRandomEntry: vi.fn<(roundId: number) => Promise<unknown>>(),
    changing: false,
    adding: false,
}));

vi.mock("./mutations/submission", () => ({
    useChangeStatus: () => ({ mutateAsync: mocks.changeStatus, isPending: mocks.changing }),
}));

vi.mock("./mutations/round", () => ({
    useAddRandomEntry: () => ({ mutateAsync: mocks.addRandomEntry, isPending: mocks.adding }),
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

function setup(submission: AdminSubmission = makeSubmission()) {
    const onSaved = vi.fn();
    const hook = renderHook(() => useChangeStatusForm(submission, onSaved), { wrapper: providerWrapper() });

    return { ...hook, onSaved };
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

beforeEach(() => {
    mocks.changeStatus.mockReset();
    mocks.changeStatus.mockResolvedValue({ success: true, description: "Submission status has been changed." });
    mocks.addRandomEntry.mockReset();
    mocks.addRandomEntry.mockResolvedValue(makeSubmission({ id: 8 }));
    mocks.changing = false;
    mocks.adding = false;
});

describe("useChangeStatusForm", () => {
    it("starts from the entry's current status and comment", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.status).toBe("In Progress");
        expect(result.current.comments).toBe("Halfway through");
        expect(result.current.canPickAnother).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("starts from queued with no comment when the entry has no status yet", () => {
        // when
        const { result } = setup(makeSubmission({ status: null }));

        // then
        expect(result.current.status).toBe("Queued");
        expect(result.current.comments).toBe("");
    });

    it("offers to pick another entry once the entry is rejected", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.chooseStatus("Rejected"));

        // then
        expect(result.current.status).toBe("Rejected");
        expect(result.current.canPickAnother).toBe(true);
        expect(result.current.pickAnother).toBe(false);
    });

    it("ignores a status it does not know", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.chooseStatus("Abandoned"));

        // then
        expect(result.current.status).toBe("In Progress");
    });

    it("forgets the request for another entry when the status changes", () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseStatus("Rejected"));
        act(() => result.current.setPickAnother(true));

        // when
        act(() => result.current.chooseStatus("Queued"));
        act(() => result.current.chooseStatus("Rejected"));

        // then
        expect(result.current.pickAnother).toBe(false);
    });

    it("sends the new status with its comment and reports it saved", async () => {
        // given
        const { result, onSaved } = setup();
        act(() => result.current.chooseStatus("Completed"));
        act(() => result.current.setComments("Great map"));
        const event = submitEvent();

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(mocks.changeStatus).toHaveBeenCalledWith({
            submissionId: 7,
            status: "Completed",
            additionalInfo: "Great map",
        });
        expect(mocks.addRandomEntry).not.toHaveBeenCalled();
        expect(onSaved).toHaveBeenCalledOnce();
    });

    it("leaves the comment out when it is blank", async () => {
        // given
        const { result } = setup();
        act(() => result.current.setComments("   "));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.changeStatus.mock.lastCall?.[0]).toStrictEqual({ submissionId: 7, status: "In Progress" });
    });

    it("picks another entry for the entry's round after rejecting it when asked to", async () => {
        // given
        const { result, onSaved } = setup();
        act(() => result.current.chooseStatus("Rejected"));
        act(() => result.current.setPickAnother(true));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.changeStatus).toHaveBeenCalledWith(expect.objectContaining({ status: "Rejected" }));
        expect(mocks.addRandomEntry).toHaveBeenCalledWith(4);
        expect(onSaved).toHaveBeenCalledOnce();
    });

    it("picks nothing after rejecting when not asked to", async () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseStatus("Rejected"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(mocks.addRandomEntry).not.toHaveBeenCalled();
    });

    it("reports the server's message, picks nothing and stays unsaved when the status is refused", async () => {
        // given
        mocks.changeStatus.mockRejectedValue(new Error("Unable to find submission with id 7."));
        const { result, onSaved } = setup();
        act(() => result.current.chooseStatus("Rejected"));
        act(() => result.current.setPickAnother(true));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Unable to find submission with id 7.");
        expect(mocks.addRandomEntry).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("says what failed when the refusal carries no message", async () => {
        // given
        mocks.changeStatus.mockRejectedValue(new Error(""));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("The status could not be changed.");
    });

    it("says the status changed but no entry was picked when picking fails", async () => {
        // given
        mocks.addRandomEntry.mockRejectedValue(new Error("Round 4 does not exist."));
        const { result, onSaved } = setup();
        act(() => result.current.chooseStatus("Rejected"));
        act(() => result.current.setPickAnother(true));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe(
            "The status was changed, but no other entry could be picked: Round 4 does not exist.",
        );
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("clears an earlier error when it saves again", async () => {
        // given
        mocks.changeStatus.mockRejectedValueOnce(new Error("Unable to find submission with id 7."));
        const { result } = setup();
        await act(() => result.current.submit(submitEvent()));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBeNull();
    });

    it("reports the save as in flight while either change is pending", () => {
        // given
        mocks.adding = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.saving).toBe(true);
    });
});
