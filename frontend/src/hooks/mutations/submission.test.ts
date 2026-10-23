import type { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    changeStatus,
    deleteEntries,
    modifyEntry,
    setYoutubeLink,
    submitEntry,
    verifyEntries,
} from "../../api/endpoints/submission";
import { expectInvalidated } from "../../test-utils/query";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { PublicSubmission, SuccessResponse } from "../../types/api";
import {
    useChangeStatus,
    useDeleteEntries,
    useModifyEntry,
    useSetYoutubeLink,
    useSubmitEntry,
    useVerifyEntries,
} from "./submission";

vi.mock("../../api/endpoints/submission", () => ({
    changeStatus: vi.fn(),
    deleteEntries: vi.fn(),
    modifyEntry: vi.fn(),
    setYoutubeLink: vi.fn(),
    submitEntry: vi.fn(),
    verifyEntries: vi.fn(),
}));

const mockedChangeStatus = vi.mocked(changeStatus);
const mockedDeleteEntries = vi.mocked(deleteEntries);
const mockedModifyEntry = vi.mocked(modifyEntry);
const mockedSetYoutubeLink = vi.mocked(setYoutubeLink);
const mockedSubmitEntry = vi.mocked(submitEntry);
const mockedVerifyEntries = vi.mocked(verifyEntries);

const ok: SuccessResponse = { success: true, description: "Done" };

const submitted: PublicSubmission = {
    id: 7,
    created: "2026-10-02T18:30:00.000Z",
    updated: "2026-10-02T18:30:00.000Z",
    WADName: "Sunlust",
    level: "MAP12",
    authorName: null,
    submissionRoundId: 5,
    playOrder: null,
    youtubeLink: null,
    status: null,
    chosen: false,
    recordedFormat: "Practised",
    downloadUrl: null,
};

function setup<T>(hook: () => T) {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(hook, { wrapper: providerWrapper({ queryClient }) });

    return { result, queryClient, invalidate };
}

function expectRoundViewsInvalidated(queryClient: QueryClient): void {
    expectInvalidated(queryClient, ["round"]);
    expectInvalidated(queryClient, ["stats"]);
    expectInvalidated(queryClient, ["admin"]);
}

beforeEach(() => {
    mockedChangeStatus.mockResolvedValue(ok);
    mockedDeleteEntries.mockResolvedValue(ok);
    mockedModifyEntry.mockResolvedValue(undefined);
    mockedSetYoutubeLink.mockResolvedValue(ok);
    mockedSubmitEntry.mockResolvedValue(submitted);
    mockedVerifyEntries.mockResolvedValue(ok);
});

describe("useSubmitEntry", () => {
    it("sends the entry form and refreshes nothing, because the entry stays hidden until it is confirmed", async () => {
        // given
        const entry = new FormData();
        entry.set("WADName", "Sunlust");
        const { result, invalidate } = setup(useSubmitEntry);

        // when
        await act(async () => {
            await result.current.mutateAsync(entry);
        });

        // then
        expect(mockedSubmitEntry.mock.lastCall?.[0]).toBe(entry);
        expect(invalidate).not.toHaveBeenCalled();
    });
});

describe("useModifyEntry", () => {
    it("sends the changed fields and refreshes every round view", async () => {
        // given
        const changes = new FormData();
        changes.set("id", "7");
        const { result, queryClient } = setup(useModifyEntry);

        // when
        await act(async () => {
            await result.current.mutateAsync(changes);
        });

        // then
        expect(mockedModifyEntry.mock.lastCall?.[0]).toBe(changes);
        expectRoundViewsInvalidated(queryClient);
    });
});

describe("useChangeStatus", () => {
    it("sends the new status with its comment and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useChangeStatus);

        // when
        await act(async () => {
            await result.current.mutateAsync({
                submissionId: 7,
                status: "Rejected",
                additionalInfo: "The map would not load",
            });
        });

        // then
        expect(mockedChangeStatus.mock.lastCall?.[0]).toEqual({
            submissionId: 7,
            status: "Rejected",
            additionalInfo: "The map would not load",
        });
        expectRoundViewsInvalidated(queryClient);
    });
});

describe("useSetYoutubeLink", () => {
    it("sends the submission and its link and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useSetYoutubeLink);

        // when
        await act(async () => {
            await result.current.mutateAsync({ id: 7, link: "https://www.youtube.com/watch?v=abc123" });
        });

        // then
        expect(mockedSetYoutubeLink).toHaveBeenCalledWith(7, "https://www.youtube.com/watch?v=abc123");
        expectRoundViewsInvalidated(queryClient);
    });

    it("sends a null link to clear it", async () => {
        // given
        const { result } = setup(useSetYoutubeLink);

        // when
        await act(async () => {
            await result.current.mutateAsync({ id: 7, link: null });
        });

        // then
        expect(mockedSetYoutubeLink).toHaveBeenCalledWith(7, null);
    });
});

describe("useVerifyEntries", () => {
    it("verifies the ids it is given and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useVerifyEntries);

        // when
        await act(async () => {
            await result.current.mutateAsync([1, 2]);
        });

        // then
        expect(mockedVerifyEntries.mock.lastCall?.[0]).toEqual([1, 2]);
        expectRoundViewsInvalidated(queryClient);
    });
});

describe("useDeleteEntries", () => {
    it("deletes the ids it is given and refreshes every round view", async () => {
        // given
        const { result, queryClient } = setup(useDeleteEntries);

        // when
        await act(async () => {
            await result.current.mutateAsync([3, 5]);
        });

        // then
        expect(mockedDeleteEntries.mock.lastCall?.[0]).toEqual([3, 5]);
        expectRoundViewsInvalidated(queryClient);
    });

    it("leaves the cache alone when the delete fails", async () => {
        // given
        mockedDeleteEntries.mockRejectedValue(new Error("Submission 5 does not exist"));
        const { result, invalidate } = setup(useDeleteEntries);

        // when
        await act(async () => {
            await expect(result.current.mutateAsync([3, 5])).rejects.toThrow("Submission 5 does not exist");
        });

        // then
        expect(invalidate).not.toHaveBeenCalled();
    });
});
