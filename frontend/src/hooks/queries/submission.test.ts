import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmSubmission } from "../../api/endpoints/submission";
import { fetchThroughProxy } from "../../api/endpoints/utils";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { SuccessResponse } from "../../types/api";
import { useIdgamesTitle, useSubmissionConfirmation } from "./submission";

vi.mock("../../api/endpoints/submission", () => ({
    confirmSubmission: vi.fn(),
}));

vi.mock("../../api/endpoints/utils", () => ({
    fetchThroughProxy: vi.fn(),
}));

const mockedConfirmSubmission = vi.mocked(confirmSubmission);
const mockedFetchThroughProxy = vi.mocked(fetchThroughProxy);

const confirmed: SuccessResponse = { success: true, description: "Your submission has been confirmed." };
const sunlustUrl = "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust";
const idgamesPage = `<table class="filelist"><tbody><tr><td>Title:</td><td> Sunlust </td></tr></tbody></table>`;

beforeEach(() => {
    mockedConfirmSubmission.mockResolvedValue(confirmed);
    mockedFetchThroughProxy.mockResolvedValue(idgamesPage);
});

describe("useSubmissionConfirmation", () => {
    it("keys the query by the confirmation code", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useSubmissionConfirmation("uid-1"), {
            wrapper: providerWrapper({ queryClient: qc }),
        });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["submission", "confirmation", "uid-1"]);
    });

    it("confirms the code it is given and hands back the server's answer", async () => {
        // when
        const { result } = renderHook(() => useSubmissionConfirmation("uid-1"), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(mockedConfirmSubmission).toHaveBeenCalledWith("uid-1");
        expect(result.current).toEqual({ result: confirmed, error: null, loading: false });
    });

    it("hands back the server's message when the confirmation fails", async () => {
        // given
        mockedConfirmSubmission.mockRejectedValue(new Error("This link has expired. Submit your entry again."));

        // when
        const { result } = renderHook(() => useSubmissionConfirmation("uid-1"), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({
            result: null,
            error: "This link has expired. Submit your entry again.",
            loading: false,
        });
    });

    it("explains the failure plainly when the server gives no reason", async () => {
        // given
        mockedConfirmSubmission.mockRejectedValue(new Error(""));

        // when
        const { result } = renderHook(() => useSubmissionConfirmation("uid-1"), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.error).toBe("This submission could not be confirmed.");
    });

    it("confirms only once however often the page renders it, because the code can be used once", async () => {
        // given
        const wrapper = providerWrapper({ queryClient: createTestQueryClient() });
        const first = renderHook(() => useSubmissionConfirmation("uid-1"), { wrapper });
        await waitFor(() => expect(first.result.current.loading).toBe(false));

        // when
        const second = renderHook(() => useSubmissionConfirmation("uid-1"), { wrapper });

        // then
        expect(second.result.current.result).toEqual(confirmed);
        expect(mockedConfirmSubmission).toHaveBeenCalledOnce();
    });

    it("confirms nothing without a code", () => {
        // when
        const { result } = renderHook(() => useSubmissionConfirmation(null), { wrapper: providerWrapper() });

        // then
        expect(mockedConfirmSubmission).not.toHaveBeenCalled();
        expect(result.current).toEqual({ result: null, error: null, loading: false });
    });
});

describe("useIdgamesTitle", () => {
    it("keys the query by the idgames page", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useIdgamesTitle(sunlustUrl), {
            wrapper: providerWrapper({ queryClient: qc }),
        });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["submission", "doomworld-page", sunlustUrl]);
    });

    it("reads the WAD title from the idgames page fetched through the proxy", async () => {
        // when
        const { result } = renderHook(() => useIdgamesTitle(sunlustUrl), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(mockedFetchThroughProxy).toHaveBeenCalledWith(sunlustUrl);
        expect(result.current.title).toBe("Sunlust");
    });

    it("reports no title when the page has no file list", async () => {
        // given
        mockedFetchThroughProxy.mockResolvedValue("<p>File not found</p>");

        // when
        const { result } = renderHook(() => useIdgamesTitle(sunlustUrl), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.title).toBeNull();
    });

    it("reports loading while the page is being fetched", () => {
        // given
        mockedFetchThroughProxy.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useIdgamesTitle(sunlustUrl), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ title: null, loading: true });
    });

    it("fetches nothing and is not loading without a URL", () => {
        // when
        const { result } = renderHook(() => useIdgamesTitle(null), { wrapper: providerWrapper() });

        // then
        expect(mockedFetchThroughProxy).not.toHaveBeenCalled();
        expect(result.current).toEqual({ title: null, loading: false });
    });
});
