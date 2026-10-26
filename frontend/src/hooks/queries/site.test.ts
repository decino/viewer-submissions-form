import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCaptchaConfig, getUploadConfig } from "../../api/endpoints/config";
import { getRoundStats } from "../../api/endpoints/stats";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { CaptchaConfig, RoundStats, UploadConfig } from "../../types/api";
import { useCaptchaConfig, useRoundStats, useUploadConfig } from "./site";

vi.mock("../../api/endpoints/config", () => ({
    getCaptchaConfig: vi.fn(),
    getUploadConfig: vi.fn(),
}));

vi.mock("../../api/endpoints/stats", () => ({
    getRoundStats: vi.fn(),
}));

const mockedGetCaptchaConfig = vi.mocked(getCaptchaConfig);
const mockedGetUploadConfig = vi.mocked(getUploadConfig);
const mockedGetRoundStats = vi.mocked(getRoundStats);

const captcha: CaptchaConfig = { captchaType: "turnstile", siteKey: "site-key-1" };
const upload: UploadConfig = { fileSizeLimitMb: 50, allowedExtensions: ["wad", "zip", "pk3"] };
const stats: RoundStats = {
    recordFormat: { Practised: 3, Blind: 1 },
    isAuthor: { Yes: 1, No: 3 },
    distributable: null,
};

beforeEach(() => {
    mockedGetCaptchaConfig.mockResolvedValue(captcha);
    mockedGetUploadConfig.mockResolvedValue(upload);
    mockedGetRoundStats.mockResolvedValue(stats);
});

describe("useCaptchaConfig", () => {
    it("keys the query as the captcha config", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useCaptchaConfig(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["config", "captcha"]);
    });

    it("hands back the captcha type and site key", async () => {
        // when
        const { result } = renderHook(() => useCaptchaConfig(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.captcha).toEqual(captcha);
    });

    it("asks the server only once however many forms read it, because it never changes", async () => {
        // given
        const wrapper = providerWrapper({ queryClient: createTestQueryClient() });
        const first = renderHook(() => useCaptchaConfig(), { wrapper });
        await waitFor(() => expect(first.result.current.loading).toBe(false));

        // when
        const second = renderHook(() => useCaptchaConfig(), { wrapper });

        // then
        expect(second.result.current.captcha).toEqual(captcha);
        expect(mockedGetCaptchaConfig).toHaveBeenCalledOnce();
    });

    it("reports loading and no config while the request is in flight", () => {
        // given
        mockedGetCaptchaConfig.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useCaptchaConfig(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ captcha: null, loading: true, error: null });
    });

    it("hands back the reason the captcha config could not be loaded", async () => {
        // given
        mockedGetCaptchaConfig.mockRejectedValue(new Error("The server is down for maintenance."));

        // when
        const { result } = renderHook(() => useCaptchaConfig(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({ captcha: null, loading: false, error: "The server is down for maintenance." });
    });
});

describe("useUploadConfig", () => {
    it("keys the query as the upload config", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useUploadConfig(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["config", "upload"]);
    });

    it("hands back the size limit and the allowed extensions", async () => {
        // when
        const { result } = renderHook(() => useUploadConfig(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.upload).toEqual(upload);
    });

    it("reports loading and no config while the request is in flight", () => {
        // given
        mockedGetUploadConfig.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useUploadConfig(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ upload: null, loading: true, error: null });
    });

    it("hands back the reason the upload config could not be loaded", async () => {
        // given
        mockedGetUploadConfig.mockRejectedValue(new Error("The server is down for maintenance."));

        // when
        const { result } = renderHook(() => useUploadConfig(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({ upload: null, loading: false, error: "The server is down for maintenance." });
    });
});

describe("useRoundStats", () => {
    it("keys the query by the round it is given", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useRoundStats(5), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["stats", "round", 5]);
    });

    it("asks for the stats of the round it is given and hands them back", async () => {
        // when
        const { result } = renderHook(() => useRoundStats(5), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(mockedGetRoundStats).toHaveBeenCalledWith(5);
        expect(result.current.stats).toEqual(stats);
    });

    it("hands back the reason the stats could not be loaded", async () => {
        // given
        mockedGetRoundStats.mockRejectedValue(new Error("The server is down for maintenance."));

        // when
        const { result } = renderHook(() => useRoundStats(5), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({ stats: null, loading: false, error: "The server is down for maintenance." });
    });
});
